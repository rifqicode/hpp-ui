import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from '@/lib/api-client'
import { useAuthStore } from '@/store/use-auth-store'
import { useLoadingStore } from '@/store/use-loading-store'

let originalAdapter: typeof apiClient.defaults.adapter
let adapter: ReturnType<typeof vi.fn<AxiosAdapter>>
function response(config: InternalAxiosRequestConfig, data: unknown, status = 200) {
  return { config, data, status, statusText: String(status), headers: {} }
}

beforeEach(() => {
  originalAdapter = apiClient.defaults.adapter
  adapter = vi.fn<AxiosAdapter>()
  apiClient.defaults.adapter = adapter
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ user: null, token: null, permissions: [], activeStoreId: null })
  useLoadingStore.setState({ pending: 0 })
})
afterEach(() => { apiClient.defaults.adapter = originalAdapter })

describe('API client interceptors', () => {
  it('attaches the session and store headers and unwraps backend envelopes', async () => {
    localStorage.setItem('token', 'test-token')
    useAuthStore.getState().setActiveStoreId('store-1')
    adapter.mockImplementation(async config => response(config, { success: true, data: { id: 'p1' }, message: 'OK' }))
    const result = await apiClient.get('/products')
    const [config] = adapter.mock.calls[0]
    expect(config.headers.get('Authorization')).toBe('Bearer test-token')
    expect(config.headers.get('X-Store-ID')).toBe('store-1')
    expect(result.data).toEqual({ id: 'p1' })
    expect(useLoadingStore.getState().pending).toBe(0)
  })
  it('preserves explicit store overrides used by background requests', async () => {
    useAuthStore.getState().setActiveStoreId('store-1')
    adapter.mockImplementation(async config => response(config, []))
    await apiClient.get('/products', { headers: { 'X-Store-ID': 'store-2' } })
    expect(adapter.mock.calls[0][0].headers.get('X-Store-ID')).toBe('store-2')
    expect(adapter.mock.calls[0][0].headers.has('Authorization')).toBe(false)
  })
  it.each([null, ['a'], { data: ['a'] }, { success: true }, 'plain response'])('preserves a non-envelope response: %j', async (body) => {
    adapter.mockImplementation(async config => response(config, body))
    expect((await apiClient.get('/example')).data).toEqual(body)
  })
  it.each<[unknown, string]>([
    [{ message: 'Gagal', errors: 'Nama wajib' }, 'Gagal (Nama wajib)'],
    [{ error: 'Tidak ditemukan' }, 'Tidak ditemukan'],
    [{ errors: ['Nama wajib', 'Email salah'] }, 'Nama wajib, Email salah'],
    [{ errors: { name: 'Nama wajib', email: '' } }, 'Nama wajib'],
  ])('exposes the backend validation error: %j', async (body, expected) => {
    adapter.mockImplementation(async config => { throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, undefined, response(config, body, 422)) })
    await expect(apiClient.post('/products', {})).rejects.toThrow(expected)
    expect(useLoadingStore.getState().pending).toBe(0)
  })
  it.each(['QUOTA_EXCEEDED', 'FEATURE_LOCKED', 'STAFF_ACCESS_SUSPENDED'])('dispatches an upgrade event for %s', async (code) => {
    const listener = vi.fn()
    window.addEventListener('open-upgrade-modal', listener)
    try {
      adapter.mockImplementation(async config => { throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, undefined, response(config, { message: 'Upgrade diperlukan', code }, 403)) })
      await expect(apiClient.post('/products', {})).rejects.toThrow('Upgrade diperlukan')
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { code, message: 'Upgrade diperlukan' } }))
    } finally { window.removeEventListener('open-upgrade-modal', listener) }
  })
  it('dispatches structured feature lock metadata without overwriting message with error values', async () => {
    const listener = vi.fn()
    window.addEventListener('open-upgrade-modal', listener)
    try {
      const resp = {
        message: 'Fitur "Ekspor Laporan" belum tersedia pada paket langganan toko saat ini.',
        errors: {
          code: 'FEATURE_LOCKED',
          feature: 'export_reports',
          feature_name: 'Ekspor Laporan',
        },
      }
      adapter.mockImplementation(async (config) => {
        throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, undefined, response(config, resp, 403))
      })
      await expect(apiClient.get('/reports/export')).rejects.toThrow(
        'Fitur "Ekspor Laporan" belum tersedia pada paket langganan toko saat ini.'
      )
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            code: 'FEATURE_LOCKED',
            message: 'Fitur "Ekspor Laporan" belum tersedia pada paket langganan toko saat ini.',
            feature: 'export_reports',
            featureName: 'Ekspor Laporan',
          },
        })
      )
    } finally {
      window.removeEventListener('open-upgrade-modal', listener)
    }
  })
  it('keeps the session when the login endpoint returns unauthorized', async () => {
    localStorage.setItem('token', 'old-session')
    adapter.mockImplementation(async config => { throw new AxiosError('Unauthorized', 'ERR_BAD_RESPONSE', config, undefined, response(config, {}, 401)) })
    await expect(apiClient.post('/auth/login', {})).rejects.toThrow('Unauthorized')
    expect(localStorage.getItem('token')).toBe('old-session')
  })
  it('clears an expired session for a protected endpoint', async () => {
    window.history.replaceState({}, '', '/login')
    localStorage.setItem('token', 'expired')
    useAuthStore.setState({ token: 'expired', activeStoreId: 'store-1', permissions: ['products:read'] })
    adapter.mockImplementation(async config => { throw new AxiosError('Unauthorized', 'ERR_BAD_RESPONSE', config, undefined, response(config, {}, 401)) })
    await expect(apiClient.get('/products')).rejects.toThrow('Unauthorized')
    expect(localStorage.getItem('token')).toBeNull()
    expect(useAuthStore.getState()).toMatchObject({ token: null, activeStoreId: null, permissions: [] })
  })
  it('clears loading state when the network fails without an HTTP response', async () => {
    adapter.mockRejectedValue(new Error('Network unavailable'))
    await expect(apiClient.get('/products')).rejects.toThrow('Network unavailable')
    expect(useLoadingStore.getState().pending).toBe(0)
  })
  it('does not increment loading pending state when skipLoading is true (in flight and on completion)', async () => {
    let inFlightPending = -1
    adapter.mockImplementation(async (config) => {
      inFlightPending = useLoadingStore.getState().pending
      return response(config, { success: true, data: { ok: true } })
    })

    const result = await apiClient.get('/background-task', { skipLoading: true })
    expect(inFlightPending).toBe(0)
    expect(useLoadingStore.getState().pending).toBe(0)
    expect(result.data).toEqual({ ok: true })
  })
  it('does not decrement loading pending state below zero when skipLoading request fails', async () => {
    adapter.mockImplementation(async (config) => {
      expect(useLoadingStore.getState().pending).toBe(0)
      throw new AxiosError('Failed', 'ERR_BAD_RESPONSE', config, undefined, response(config, { message: 'Failed' }, 500))
    })

    await expect(apiClient.get('/background-task', { skipLoading: true })).rejects.toThrow('Failed')
    expect(useLoadingStore.getState().pending).toBe(0)
  })
  it('automatically skips loading overlay for /store/ai/... requests without explicit skipLoading', async () => {
    let inFlightPending = -1
    adapter.mockImplementation(async (config) => {
      inFlightPending = useLoadingStore.getState().pending
      return response(config, { success: true, data: { reply: 'Hello' } })
    })

    const result = await apiClient.post('/store/ai/conversations', { message: 'Hi' })
    expect(inFlightPending).toBe(0)
    expect(useLoadingStore.getState().pending).toBe(0)
    expect(result.data).toEqual({ reply: 'Hello' })
  })
})

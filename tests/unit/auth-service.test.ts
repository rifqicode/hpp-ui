import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from '@/lib/api-client'
import { authService } from '@/features/auth/services/auth-service'
import { user } from '../support/fixtures'

let originalAdapter: typeof apiClient.defaults.adapter
let adapter: ReturnType<typeof vi.fn<AxiosAdapter>>
let body: unknown
function response(config: InternalAxiosRequestConfig, data: unknown, status = 200) {
  return { data, config, status, statusText: String(status), headers: {} }
}

beforeEach(() => {
  body = { user, token: 'test-token' }
  originalAdapter = apiClient.defaults.adapter
  adapter = vi.fn<AxiosAdapter>(async config => response(config, body))
  apiClient.defaults.adapter = adapter
})
afterEach(() => { apiClient.defaults.adapter = originalAdapter })

describe('authentication service requests', () => {
  it('posts login credentials and returns the authentication response', async () => {
    const credentials = { email: user.email, password: 'Abcdef12!' }
    expect(await authService.login(credentials)).toEqual(body)
    expect(adapter.mock.calls[0][0]).toMatchObject({ url: '/auth/login', method: 'post' })
    expect(JSON.parse(adapter.mock.calls[0][0].data)).toEqual(credentials)
  })
  it('sends account and store details during registration', async () => {
    const payload = { name: user.name, email: user.email, password: 'Abcdef12!', store: { name: 'Toko Rina' } }
    await authService.register(payload)
    expect(adapter.mock.calls[0][0].url).toBe('/auth/register')
    expect(JSON.parse(adapter.mock.calls[0][0].data)).toEqual(payload)
  })
  it('encodes tokens in invitation and reset validation URLs', async () => {
    await authService.getInviteDetails('a+b/c?')
    expect(adapter.mock.calls[0][0].url).toBe('/auth/invite?token=a%2Bb%2Fc%3F')
    await authService.validateResetToken('a+b/c?')
    expect(adapter.mock.calls[1][0].url).toBe('/auth/reset-password/validate?token=a%2Bb%2Fc%3F')
  })
  it.each([
    ['forgot password', () => authService.forgotPassword(user.email), '/auth/forgot-password', { email: user.email }],
    ['reset password', () => authService.resetPassword({ token: 't1', new_password: 'Abcdef12!' }), '/auth/reset-password', { token: 't1', new_password: 'Abcdef12!' }],
    ['verify email', () => authService.verifyEmail({ email: user.email, code: '123456' }), '/auth/verify-email', { email: user.email, code: '123456' }],
    ['resend verification', () => authService.resendVerification(user.email), '/auth/resend-verification', { email: user.email }],
    ['accept invite', () => authService.acceptInvite({ token: 't1', name: user.name }), '/auth/invite/accept', { token: 't1', name: user.name }],
  ] as const)('sends the %s DTO', async (_name, request, path, payload) => {
    await request()
    expect(adapter.mock.calls[0][0]).toMatchObject({ method: 'post', url: path })
    expect(JSON.parse(adapter.mock.calls[0][0].data)).toEqual(payload)
  })
  it('loads and updates the current user', async () => {
    expect(await authService.getCurrentUser()).toEqual(body)
    body = user
    expect(await authService.updateProfile({ name: 'Rina Baru' })).toEqual(user)
    expect(adapter.mock.calls[1][0]).toMatchObject({ method: 'put', url: '/auth/profile' })
  })
  it('ignores logout network failures', async () => {
    adapter.mockRejectedValue(new Error('Offline'))
    await expect(authService.logout()).resolves.toBeUndefined()
  })
})

describe('authentication service failures', () => {
  it('preserves an unverified account status for the UI redirect', async () => {
    adapter.mockImplementation(async config => { throw new AxiosError('Forbidden', 'ERR_BAD_RESPONSE', config, undefined, response(config, { message: 'Email belum diverifikasi' }, 403)) })
    await expect(authService.login({ email: user.email, password: 'Abcdef12!' })).rejects.toMatchObject({ message: 'Email belum diverifikasi', status: 403 })
  })
  it('normalizes rejected credentials', async () => {
    adapter.mockImplementation(async config => { throw new AxiosError('Unauthorized', 'ERR_BAD_RESPONSE', config, undefined, response(config, { message: 'unauthorized' }, 401)) })
    await expect(authService.login({ email: user.email, password: 'invalid' })).rejects.toThrow('Email atau kata sandi salah. Silakan coba lagi.')
  })
  it('explains a network failure without an HTTP response', async () => {
    adapter.mockRejectedValue(new AxiosError('Network error'))
    await expect(authService.login({ email: user.email, password: 'invalid' })).rejects.toThrow('Tidak dapat terhubung ke server. Periksa koneksi Anda.')
  })
  it.each([
    [() => authService.register({ name: user.name, email: user.email, password: 'Abcdef12!', store: { name: 'Toko' } }), 'Gagal mendaftar. Silakan coba lagi.'],
    [() => authService.getCurrentUser(), 'Gagal memuat data pengguna.'],
    [() => authService.updateProfile({ name: user.name }), 'Gagal menyimpan profil.'],
    [() => authService.getInviteDetails('t1'), 'Tautan undangan tidak valid atau telah kadaluarsa.'],
    [() => authService.acceptInvite({ token: 't1' }), 'Gagal menerima undangan.'],
    [() => authService.forgotPassword(user.email), 'Gagal memproses permintaan reset kata sandi.'],
    [() => authService.validateResetToken('t1'), 'Tautan reset kata sandi tidak valid atau telah kedaluwarsa.'],
    [() => authService.resetPassword({ token: 't1', new_password: 'Abcdef12!' }), 'Gagal mengatur ulang kata sandi. Silakan coba lagi.'],
    [() => authService.verifyEmail({ email: user.email, code: '123456' }), 'Gagal memverifikasi email. Pastikan kode verifikasi sesuai.'],
    [() => authService.resendVerification(user.email), 'Gagal mengirim ulang kode verifikasi.'],
  ] as const)('uses the operation fallback for non-Error rejections', async (request, expected) => {
    adapter.mockRejectedValue('unavailable')
    await expect(request()).rejects.toThrow(expected)
  })
})

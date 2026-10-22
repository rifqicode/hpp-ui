import { beforeEach, describe, expect, it, vi } from 'vitest'
import { settingsService } from '@/features/settings/services/settings-service'
import { useAuthStore } from '@/store/use-auth-store'
import { user } from '../support/fixtures'
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
const cache = vi.hoisted(() => ({ readPermissionCache: vi.fn(), writePermissionCache: vi.fn(), clearPermissionCache: vi.fn() }))
vi.mock('@/lib/api-client', () => ({ default: http }))
vi.mock('@/lib/permission-cache', () => cache)
beforeEach(() => {
  vi.resetAllMocks()
  cache.readPermissionCache.mockResolvedValue(null)
  cache.writePermissionCache.mockResolvedValue(undefined)
  useAuthStore.setState({ user, activeStoreId: 's1', permissions: [] })
  for (const method of Object.values(http)) method.mockResolvedValue({ data: { id: 's1', name: 'Toko' } })
})

const operations = [
  ['update store', () => settingsService.updateStoreProfile({ name: 'Toko' }), 'put', '/store', 'Gagal memperbarui profil toko'],
  ['create store', () => settingsService.createStore({ name: 'Toko' }), 'post', '/stores', 'Gagal membuat toko'],
  ['invite staff', () => settingsService.inviteStaff({ email: user.email, name: user.name, role_id: 'r1' }), 'post', '/staff/invite', 'Gagal mengundang staf'],
  ['change staff role', () => settingsService.updateStaffRole('u1', 'r1'), 'put', '/staff/u1/role', 'Gagal mengubah peran staf'],
  ['revoke staff', () => settingsService.revokeStaff('u1'), 'delete', '/staff/u1', 'Gagal mencabut akses staf'],
  ['load user', () => settingsService.getUserProfile(), 'get', '/auth/me', 'Gagal mengambil profil pengguna'],
  ['update user', () => settingsService.updateUserProfile({ name: 'Rina' }), 'put', '/auth/profile', 'Gagal memperbarui profil pengguna'],
  ['change password', () => settingsService.changePassword('old', 'new'), 'put', '/auth/password', 'Gagal memperbarui kata sandi. Periksa kata sandi saat ini.'],
  ['load sessions', () => settingsService.getSessions(), 'get', '/auth/sessions', 'Gagal memuat sesi aktif'],
  ['revoke session', () => settingsService.revokeSession('session1'), 'delete', '/auth/sessions/session1', 'Gagal menghapus sesi'],
  ['revoke other sessions', () => settingsService.revokeOtherSessions(), 'delete', '/auth/sessions/others', 'Gagal membatalkan sesi perangkat lain'],
  ['delete account', () => settingsService.deleteAccount(), 'delete', '/auth/account', 'Gagal menghapus akun'],
  ['create role', () => settingsService.createRole({ name: ' kasir toko ', displayName: 'Kasir', permissionCodes: ['products:read'] }), 'post', '/roles', 'Gagal menambahkan peran baru'],
  ['update role', () => settingsService.updateRole('r1', { name: ' Kasir ', permission_codes: ['products:read'] }), 'put', '/roles/r1', 'Gagal memperbarui peran'],
] as const

describe('settings service operations', () => {
  it.each(operations)('%s uses %s', async (_label, request, method, path) => {
    await request()
    expect(http[method].mock.calls[0][0]).toBe(path)
  })
  it.each(operations)('%s explains a server failure', async (_label, request, method, _path, fallback) => {
    http[method].mockRejectedValueOnce({ response: { data: {} } })
    await expect(request()).rejects.toThrow(fallback)
  })
  it('loads store, staff, preferences, and Telegram resources', async () => {
    await settingsService.getStoreProfile(); expect(http.get).toHaveBeenLastCalledWith('/store')
    http.get.mockResolvedValueOnce({ data: null }); expect(await settingsService.getStoresList()).toEqual([])
    await settingsService.switchStore('s2'); expect(http.post).toHaveBeenLastCalledWith('/stores/switch', { store_id: 's2' })
    http.get.mockResolvedValueOnce({ data: [{ id: 'm1' }, { id: 'm2', user_id: 'u2', joined_at: '2026-01-01' }, { id: 'm3', userId: 'u3', joinedAt: '2026-01-02' }] })
    expect(await settingsService.getStaffList()).toMatchObject([{ userId: 'm1', joinedAt: '' }, { userId: 'u2', joinedAt: '2026-01-01' }, { userId: 'u3', joinedAt: '2026-01-02' }])
    http.get.mockResolvedValueOnce({ data: null }); expect(await settingsService.getStaffList()).toEqual([])
    await settingsService.getPreferences(); expect(http.get).toHaveBeenLastCalledWith('/store/preferences')
    await settingsService.updatePreferences({ currency: 'IDR' }); expect(http.put).toHaveBeenLastCalledWith('/store/preferences', { currency: 'IDR' })
    await settingsService.getTelegramStatus(); expect(http.get).toHaveBeenLastCalledWith('/integrations/me')
    http.post.mockResolvedValueOnce({ data: { code: '123456', expires_at: '2026-01-01' } })
    expect(await settingsService.generateTelegramCode()).toEqual({ code: '123456', expiresAt: '2026-01-01' })
    await settingsService.disconnectTelegram(); expect(http.post).toHaveBeenLastCalledWith('/integrations/telegram/disconnect')
    await settingsService.updateTelegramPreferences({ dailyReportAlert: true }); expect(http.put).toHaveBeenLastCalledWith('/integrations/telegram/preferences', { dailyReportAlert: true })
  })
  it('normalizes role ownership and filters roles from other stores', async () => {
    http.get.mockResolvedValueOnce({ data: [{ id: 'global', name: 'OWNER' }, { id: 'local', name: 'Kasir', store_id: 's1', description: 'Toko', permissions: [], is_system: false }, { id: 'other', name: 'Kasir', store_id: 's2' }] })
    expect(await settingsService.getRolesList()).toMatchObject([{ id: 'global', storeId: null, is_system: true }, { id: 'local', storeId: 's1', is_system: false }])
    http.get.mockResolvedValueOnce({ data: null }); expect(await settingsService.getRolesList()).toEqual([])
    http.get.mockResolvedValueOnce({ data: null }); expect(await settingsService.getPermissionsCatalog()).toEqual([])
    http.get.mockResolvedValueOnce({ data: [{ code: 'products:read' }] }); expect(await settingsService.getPermissionsCatalog()).toHaveLength(1)
  })
  it('falls back to the role list when direct role lookup fails', async () => {
    http.get.mockRejectedValueOnce(new Error('Missing endpoint')).mockResolvedValueOnce({ data: [{ id: 'r1', name: 'Kasir', store_id: 's1' }] })
    expect(await settingsService.getRoleById('r1')).toMatchObject({ id: 'r1', name: 'Kasir' })
    http.get.mockResolvedValueOnce({ data: null }); expect(await settingsService.getRoleById('bad')).toBeNull()
    http.get.mockRejectedValueOnce(new Error('Missing')).mockResolvedValueOnce({ data: [] }); expect(await settingsService.getRoleById('bad')).toBeNull()
  })
  it('trims role names and sends backend permission_codes', async () => {
    await settingsService.createRole({ name: ' kasir toko ', displayName: 'Kasir', description: ' Toko ', permissionCodes: ['products:read'] })
    expect(http.post).toHaveBeenLastCalledWith('/roles', { name: 'KASIR_TOKO', description: 'Toko', permission_codes: ['products:read'] })
    await settingsService.updateRole('r1', { name: ' Kasir ', description: ' Baru ', permission_codes: [] })
    expect(http.put).toHaveBeenLastCalledWith('/roles/r1', { name: 'Kasir', description: 'Baru', permission_codes: [] })
  })
})

describe('permission cache scoping', () => {
  it('returns cached grants only to the matching user and store', async () => {
    const grants = { permissions: ['products:read'], role: 'Kasir' }
    cache.readPermissionCache.mockResolvedValueOnce(grants)
    expect(await settingsService.getStorePermissions()).toEqual(grants)
    expect(useAuthStore.getState().permissions).toEqual(grants.permissions)
    expect(http.get).not.toHaveBeenCalled()
  })
  it('forces a refresh and writes signed cache for the requested store', async () => {
    const grants = { permissions: ['products:write'], role: 'Owner' }
    http.get.mockResolvedValueOnce({ data: grants })
    expect(await settingsService.getStorePermissions('s1', true)).toEqual(grants)
    expect(cache.readPermissionCache).not.toHaveBeenCalled()
    expect(cache.writePermissionCache).toHaveBeenCalledWith(user.id, 's1', grants)
    expect(useAuthStore.getState().permissions).toEqual(grants.permissions)
  })
  it('never replaces current grants with a response for a different store', async () => {
    const grants = { permissions: ['products:read'], role: 'Kasir' }
    http.get.mockResolvedValueOnce({ data: grants })
    await settingsService.getStorePermissions('s2')
    expect(useAuthStore.getState().permissions).toEqual([])
    expect(http.get).toHaveBeenCalledWith('/permissions/me', { headers: { 'X-Store-ID': 's2' } })
  })
  it('can request permissions without a selected store or authenticated user', async () => {
    useAuthStore.setState({ user: null, activeStoreId: null })
    http.get.mockResolvedValueOnce({ data: {} })
    expect(await settingsService.getStorePermissions()).toEqual({})
    expect(cache.writePermissionCache).not.toHaveBeenCalled()
  })
})

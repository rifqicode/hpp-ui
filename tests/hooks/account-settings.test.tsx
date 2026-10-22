import type { FormEvent } from 'react'
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAccountSettings } from '@/features/settings/hooks/use-account-settings'
import { authService } from '@/features/auth/services/auth-service'
import { settingsService } from '@/features/settings/services/settings-service'
import { useAuthStore } from '@/store/use-auth-store'
import { mockPageServices, resetSession } from '../support/page-services'
import { user } from '../support/fixtures'
import { createWrapper } from '../support/render'
const event = () => ({ preventDefault: vi.fn() }) as unknown as FormEvent
beforeEach(() => {
  resetSession(); mockPageServices()
  vi.spyOn(window, 'alert').mockImplementation(() => {})
  vi.spyOn(authService, 'updateProfile').mockResolvedValue({ ...user, name: 'Rina Baru' })
  for (const method of ['changePassword', 'revokeSession', 'revokeOtherSessions', 'deleteAccount'] as const) vi.spyOn(settingsService, method).mockResolvedValue(undefined)
})
async function setup() {
  const hook = renderHook(useAccountSettings, createWrapper('/settings'))
  await waitFor(() => expect(hook.result.current.loadingInitial).toBe(false))
  return hook
}

describe('account settings', () => {
  it('validates required fields, saves profile data and updates the session', async () => {
    const { result } = await setup()
    act(() => result.current.setName(' '))
    await act(() => result.current.handleSaveProfile(event()))
    expect(result.current.profileError).toBe('Nama dan email wajib diisi.')
    act(() => { result.current.setName('Rina Baru'); result.current.setEmail('new@example.com'); result.current.setPhone('08123'); result.current.setBio('Owner') })
    await act(() => result.current.handleSaveProfile(event()))
    expect(authService.updateProfile).toHaveBeenCalledWith({ name: 'Rina Baru', email: 'new@example.com', phone: '08123', bio: 'Owner', avatar: '' })
    expect(result.current.profileMsg).toContain('berhasil disimpan')
    expect(useAuthStore.getState().user?.name).toBe('Rina Baru')
  })
  it.each([
    ['current password does not match', 'Kata sandi saat ini salah atau tidak sesuai.'], ['current password is incorrect', 'Kata sandi saat ini salah atau tidak sesuai.'],
    ['new password must be at least 6 characters', 'Kata sandi baru minimal 6 karakter.'], ['new password must be different', 'Kata sandi baru harus berbeda dari kata sandi saat ini.'],
    ['email is already registered', 'Email sudah digunakan oleh akun lain.'], ['email is already in use', 'Email sudah digunakan oleh akun lain.'],
    ['invalid password payload', 'Data kata sandi tidak valid. Periksa kembali input Anda.'], ['user not found', 'Akun pengguna tidak ditemukan.'],
    ['Request failed with status code 500', 'Gagal menyimpan perubahan profil.'], ['', 'Gagal menyimpan perubahan profil.'], ['Offline', 'Offline'],
  ])('translates backend error %s', async (message, expected) => {
    vi.mocked(authService.updateProfile).mockRejectedValue(new Error(message))
    const { result } = await setup()
    await act(() => result.current.handleSaveProfile(event()))
    expect(result.current.profileError).toBe(expected)
    expect(result.current.isSavingProfile).toBe(false)
  })
  it('updates and removes the avatar, preserving errors for the dialog', async () => {
    const { result } = await setup()
    await act(() => result.current.handleUpdateAvatar('https://example.com/photo.png'))
    expect(result.current.avatarUrl).toBe('https://example.com/photo.png')
    expect(result.current.profileMsg).toContain('diperbarui')
    await act(() => result.current.handleUpdateAvatar(''))
    expect(result.current.profileMsg).toContain('dihapus')
    vi.mocked(authService.updateProfile).mockRejectedValueOnce(null)
    await act(async () => { await expect(result.current.handleUpdateAvatar('bad')).rejects.toBeNull() })
    expect(result.current.profileError).toBe('Gagal memperbarui foto profil.')
  })
  it('requires a valid matching password and clears it after a successful change', async () => {
    const { result } = await setup()
    await act(() => result.current.handleChangePassword(event()))
    expect(result.current.passwordError).toContain('minimal 8')
    act(() => result.current.setNewPassword('Abcdef12!'))
    await act(() => result.current.handleChangePassword(event()))
    expect(result.current.passwordError).toContain('tidak cocok')
    act(() => { result.current.setCurrentPassword('old'); result.current.setConfirmPassword('Abcdef12!') })
    await act(() => result.current.handleChangePassword(event()))
    expect(settingsService.changePassword).toHaveBeenCalledWith('old', 'Abcdef12!')
    expect(result.current).toMatchObject({ currentPassword: '', newPassword: '', confirmPassword: '', passwordLoading: false })
    expect(result.current.passwordMsg).toContain('berhasil')
  })
  it('keeps password errors visible and clears success messages after their timeout', async () => {
    const { result } = await setup()
    vi.useFakeTimers()
    await act(() => result.current.handleSaveProfile(event()))
    act(() => vi.advanceTimersByTime(3500))
    expect(result.current.profileMsg).toBe('')
    act(() => { result.current.setNewPassword('Abcdef12!'); result.current.setConfirmPassword('Abcdef12!') })
    vi.mocked(settingsService.changePassword).mockRejectedValueOnce(new Error('current password is incorrect'))
    await act(() => result.current.handleChangePassword(event()))
    expect(result.current.passwordError).toContain('saat ini salah')
    await act(() => result.current.handleChangePassword(event()))
    act(() => vi.advanceTimersByTime(4000))
    expect(result.current.passwordMsg).toBe('')
  })
  it('revokes individual and other sessions while retaining the current session', async () => {
    vi.mocked(settingsService.getSessions).mockResolvedValue([{ id: 'current', device: 'Laptop', browser: 'Chrome', location: 'Jakarta', lastActive: 'Sekarang', isCurrent: true, type: 'desktop' }, { id: 'other', device: 'Ponsel', browser: 'Safari', location: 'Jakarta', lastActive: 'Kemarin', isCurrent: false, type: 'mobile' }])
    const { result } = await setup()
    await act(() => result.current.handleRevokeSession('other'))
    expect(result.current.sessions.map(s => s.id)).toEqual(['current'])
    await act(() => result.current.loadSessions())
    await act(() => result.current.handleRevokeOtherSessions())
    expect(result.current.sessions.map(s => s.id)).toEqual(['current'])
    vi.mocked(settingsService.revokeSession).mockRejectedValueOnce(new Error('Offline'))
    await act(() => result.current.handleRevokeSession('other'))
    expect(window.alert).toHaveBeenCalledWith('Offline')
    vi.mocked(settingsService.revokeOtherSessions).mockRejectedValueOnce(null)
    await act(() => result.current.handleRevokeOtherSessions())
    expect(window.alert).toHaveBeenCalledWith('Gagal membatalkan sesi perangkat lain.')
  })
  it('requires exact account deletion confirmation, handles failure, and clears the session on success', async () => {
    const { result } = await setup()
    await act(() => result.current.handleDeleteAccount())
    expect(settingsService.deleteAccount).not.toHaveBeenCalled()
    act(() => result.current.setDeleteConfirmText('HAPUS AKUN'))
    vi.mocked(settingsService.deleteAccount).mockRejectedValueOnce(new Error('Tidak diizinkan'))
    await act(() => result.current.handleDeleteAccount())
    expect(result.current.deleteError).toBe('Tidak diizinkan')
    await act(() => result.current.handleDeleteAccount())
    expect(useAuthStore.getState().token).toBeNull()
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/login')
  })
})

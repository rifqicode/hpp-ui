import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AccountSettingsPage from '@/pages/settings/account-setting-page'
import { authService } from '@/features/auth/services/auth-service'
import { settingsService } from '@/features/settings/services/settings-service'
import { mockPageServices, resetSession } from '../support/page-services'
import { mockPopulatedPages } from '../support/populated-pages'
import { user as account } from '../support/fixtures'
import { renderPage } from '../support/render'

beforeEach(() => {
  resetSession()
  mockPageServices()
  mockPopulatedPages()
  vi.spyOn(authService, 'updateProfile').mockResolvedValue(account)
  vi.spyOn(settingsService, 'changePassword').mockResolvedValue(undefined)
  vi.spyOn(settingsService, 'revokeSession').mockResolvedValue(undefined)
  vi.spyOn(settingsService, 'deleteAccount').mockResolvedValue(undefined)
})
async function setup(tab = 'profile') {
  const user = userEvent.setup()
  renderPage(<AccountSettingsPage />, `/settings?tab=${tab}`)
  await screen.findByRole('heading', { name: 'Pengaturan & Profil Akun' })
  return user
}

describe('account settings layout and forms', () => {
  it.each([false, true])('supports keyboard navigation with compact layout=%s', async (compact) => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: compact, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList)
    const user = await setup()
    expect(screen.getByRole('tablist', { name: 'Pengaturan akun' })).toHaveAttribute('aria-orientation', compact ? 'horizontal' : 'vertical')
    screen.getByRole('tab', { name: 'Profil Pengguna' }).focus()
    await user.keyboard(compact ? '{ArrowRight}' : '{ArrowDown}')
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Keamanan & Sesi' })).toHaveAttribute('aria-selected', 'true'))
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('?tab=security')
    expect(screen.getByRole('button', { name: 'Perbarui Kata Sandi' })).toBeVisible()
  })

  it('saves identity and contact fields and opens the photo dialog', async () => {
    const user = await setup()
    fireEvent.change(screen.getByLabelText(/Nama Lengkap/), { target: { value: 'Rina Baru' } })
    fireEvent.change(screen.getByLabelText(/Alamat Email/), { target: { value: 'new@example.com' } })
    fireEvent.change(screen.getByLabelText('Nomor Telepon / WhatsApp'), { target: { value: '08120000' } })
    fireEvent.change(screen.getByLabelText('Bio Singkat / Catatan Jabatan'), { target: { value: 'Kasir toko' } })
    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan Profil' }))
    await waitFor(() => expect(authService.updateProfile).toHaveBeenCalledWith({ name: 'Rina Baru', email: 'new@example.com', phone: '08120000', bio: 'Kasir toko', avatar: '' }))
    expect(await screen.findByText('Profil pengguna berhasil disimpan!')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Ubah Foto Profil' }))
    const dialog = screen.getByRole('dialog', { name: 'Foto Profil Pengguna' })
    expect(dialog).toBeVisible()
    expect(within(dialog).queryByText('Avatar Inisial Gradient Standar')).not.toBeInTheDocument()
    expect(within(dialog).queryByText('Tampil di sidebar, topbar, dan pencatatan transaksi kasir.')).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Batal' }))
  })

  it('toggles password visibility and submits all three password fields', async () => {
    const user = await setup('security')
    const current = screen.getByLabelText('Kata Sandi Saat Ini')
    fireEvent.change(current, { target: { value: 'old-password' } })
    await user.click(screen.getByRole('button', { name: 'Tampilkan kata sandi saat ini' }))
    expect(current).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Sembunyikan kata sandi saat ini' }))
    expect(current).toHaveAttribute('type', 'password')
    fireEvent.change(screen.getByLabelText('Kata Sandi Baru'), { target: { value: 'Abcdef12!' } })
    fireEvent.change(screen.getByLabelText('Konfirmasi Sandi Baru'), { target: { value: 'Abcdef12!' } })
    await user.click(screen.getByRole('button', { name: 'Perbarui Kata Sandi' }))
    await waitFor(() => expect(settingsService.changePassword).toHaveBeenCalledWith('old-password', 'Abcdef12!'))
    expect(current).toHaveValue('')
    expect(screen.getByLabelText('Kata Sandi Baru')).toHaveValue('')
    expect(await screen.findByText('Kata sandi akun Anda berhasil diperbarui!')).toBeVisible()
  })

  it('revokes another device without offering to revoke the current one', async () => {
    const user = await setup('security')
    expect(screen.getAllByRole('button', { name: 'Hapus Sesi' })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Hapus Sesi' }))
    await waitFor(() => expect(settingsService.revokeSession).toHaveBeenCalledWith('other'))
    expect(screen.queryByText('Ponsel')).not.toBeInTheDocument()
    expect(screen.getByText('Sesi Saat Ini')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Refresh' }))
    await waitFor(() => expect(settingsService.getSessions).toHaveBeenCalledTimes(2))
  })

  it('resets deletion confirmation when the dialog is dismissed', async () => {
    const user = await setup('danger')
    await user.click(screen.getByRole('button', { name: 'Hapus Akun Permanen' }))
    let dialog = screen.getByRole('dialog', { name: 'Konfirmasi Penghapusan Akun' })
    expect(within(dialog).getByRole('button', { name: 'Hapus Akun Sekarang' })).toBeDisabled()
    await user.type(within(dialog).getByPlaceholderText('HAPUS AKUN'), 'HAPUS AKUN')
    expect(within(dialog).getByRole('button', { name: 'Hapus Akun Sekarang' })).toBeEnabled()
    await user.keyboard('{Escape}')
    expect(settingsService.deleteAccount).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Hapus Akun Permanen' }))
    dialog = screen.getByRole('dialog', { name: 'Konfirmasi Penghapusan Akun' })
    expect(within(dialog).getByPlaceholderText('HAPUS AKUN')).toHaveValue('')
    expect(within(dialog).getByRole('button', { name: 'Hapus Akun Sekarang' })).toBeDisabled()
  })
})

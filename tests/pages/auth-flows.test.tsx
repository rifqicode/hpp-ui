import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from '@/pages/auth/login-page'
import RegisterPage from '@/pages/auth/register-page'
import VerifyEmailPage from '@/pages/auth/verify-email-page'
import AcceptInvitePage from '@/pages/auth/accept-invite-page'
import ForgotPasswordPage from '@/pages/auth/forgot-password-page'
import ResetPasswordPage from '@/pages/auth/reset-password-page'
import { authService } from '@/features/auth/services/auth-service'
import { settingsService } from '@/features/settings/services/settings-service'
import { useAuthStore } from '@/store/use-auth-store'
import { mockPageServices, resetSession } from '../support/page-services'
import { renderPage, deferred } from '../support/render'
import { user as account, store } from '../support/fixtures'

beforeEach(() => { resetSession(false); mockPageServices() })

describe('login page', () => {
  async function fillLogin() {
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Alamat Email atau Username'), account.email)
    await user.type(screen.getByLabelText('Kata Sandi'), 'Abcdef12!')
    return user
  }
  it('requires credentials before contacting the server', async () => {
    const login = vi.spyOn(authService, 'login')
    const user = userEvent.setup()
    renderPage(<LoginPage />, '/login')
    await user.click(screen.getByRole('button', { name: 'Masuk ke Dashboard' }))
    expect(screen.getByText('Email dan kata sandi wajib diisi')).toBeVisible()
    expect(login).not.toHaveBeenCalled()
  })
  it('toggles password visibility and the remember checkbox', async () => {
    const user = userEvent.setup()
    renderPage(<LoginPage />, '/login')
    const password = screen.getByLabelText('Kata Sandi')
    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Lihat kata sandi' }))
    expect(password).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Sembunyikan kata sandi' }))
    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('checkbox', { name: 'Ingat saya di perangkat ini' }))
    expect(screen.getByRole('checkbox')).toBeChecked()
  })
  it('disables submission while pending and selects the first store after login', async () => {
    const pending = deferred<{ user: typeof account; token: string }>()
    vi.spyOn(authService, 'login').mockReturnValue(pending.promise)
    renderPage(<LoginPage />, '/login')
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: 'Masuk ke Dashboard' }))
    expect(screen.getByRole('button', { name: 'Memverifikasi Akun...' })).toBeDisabled()
    pending.resolve({ user: account, token: 'test-token' })
    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/dashboard'))
    expect(authService.login).toHaveBeenCalledWith({ email: account.email, password: 'Abcdef12!' })
    expect(useAuthStore.getState()).toMatchObject({ activeStoreId: store.id, activeStoreName: store.name, token: 'test-token' })
  })
  it('sends an owner with no stores to setup', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue({ user: account, token: 'test-token' })
    vi.mocked(settingsService.getStoresList).mockResolvedValue([])
    renderPage(<LoginPage />, '/login')
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: 'Masuk ke Dashboard' }))
    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/setup-store'))
  })
  it.each([new Error('Unauthorized'), new Error('Server tidak tersedia'), null])('renders a login failure and allows retry: %s', async (error) => {
    vi.spyOn(authService, 'login').mockRejectedValue(error)
    renderPage(<LoginPage />, '/login')
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: 'Masuk ke Dashboard' }))
    expect(await screen.findByText(error instanceof Error ? error.message === 'Unauthorized' ? 'Email atau kata sandi salah. Silakan coba lagi.' : error.message : 'Gagal masuk. Periksa kembali email dan kata sandi Anda.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Masuk ke Dashboard' })).toBeEnabled()
  })
  it('directs an unverified account to email verification', async () => {
    vi.spyOn(authService, 'login').mockRejectedValue(Object.assign(new Error('Email belum diverifikasi'), { status: 403 }))
    renderPage(<LoginPage />, '/login')
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: 'Masuk ke Dashboard' }))
    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/verify-email?email=rina%40example.com'))
  })
  it('switches to 2FA device verification view and logs in upon entering OTP', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue({
      user: account,
      token: '',
      requires_device_verification: true,
      challenge_token: 'challenge-xyz',
      email_masked: 'ri***@example.com',
      device_info: 'Chrome on macOS',
    })
    const verifyDevice = vi.spyOn(authService, 'verifyDevice').mockResolvedValue({
      user: account,
      token: 'jwt-device-token',
    })
    vi.mocked(settingsService.getStoresList).mockResolvedValue([store])

    renderPage(<LoginPage />, '/login')
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: 'Masuk ke Dashboard' }))

    expect(await screen.findByText('Verifikasi Perangkat Baru')).toBeVisible()
    expect(screen.getByText(/ri\*\*\*@example.com/)).toBeVisible()
    expect(screen.getByText(/Chrome on macOS/)).toBeVisible()

    for (let i = 1; i <= 6; i++) {
      await user.type(screen.getByLabelText(`Digit ${i}`), `${i}`)
    }

    await user.click(screen.getByRole('button', { name: 'Verifikasi & Masuk' }))
    expect(verifyDevice).toHaveBeenCalledWith('challenge-xyz', '123456')
    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/dashboard'))
  })
})

describe('registration page', () => {
  it('does not advance an empty form or call register', async () => {
    const register = vi.spyOn(authService, 'register')
    const user = userEvent.setup()
    renderPage(<RegisterPage />, '/register')
    await user.click(screen.getByRole('button', { name: /Lanjut/ }))
    expect(screen.getByText('Nama lengkap, email bisnis, dan kata sandi wajib diisi.')).toBeVisible()
    expect(register).not.toHaveBeenCalled()
  })
  it('requires matching passwords and accepted terms before opening store setup', async () => {
    const user = userEvent.setup()
    renderPage(<RegisterPage />, '/register')
    await user.type(screen.getByLabelText(/Nama Lengkap Pemilik/), account.name)
    await user.type(screen.getByLabelText(/Alamat Email Bisnis/), account.email)
    await user.type(screen.getByLabelText(/^Kata Sandi/), 'Abcdef12!')
    await user.click(screen.getByRole('button', { name: /Lanjut/ }))
    expect(screen.getByText('Konfirmasi kata sandi tidak cocok dengan kata sandi.')).toBeVisible()
    await user.type(screen.getByLabelText(/Konfirmasi Kata Sandi/), 'Abcdef12!')
    await user.click(screen.getByRole('button', { name: /Lanjut/ }))
    expect(screen.getByText('Anda harus menyetujui Ketentuan Layanan & Kebijakan Privasi.')).toBeVisible()
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Lanjut/ }))
    expect(screen.getByRole('heading', { name: 'Setup Profil Toko Pertama' })).toBeVisible()
  })
})

describe('email verification page', () => {
  function setup() { return renderPage(<VerifyEmailPage />, '/verify-email?email=rina%40example.com') }
  it('requires all six digits and moves focus between inputs', async () => {
    const user = userEvent.setup()
    setup()
    expect(screen.getByRole('button', { name: 'Verifikasi Email' })).toBeDisabled()
    await user.type(screen.getByLabelText('Digit ke-1'), '1')
    expect(screen.getByLabelText('Digit ke-2')).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByLabelText('Digit ke-1')).toHaveFocus()
  })
  it('accepts a pasted code, verifies it, and stores the authenticated session', async () => {
    vi.spyOn(authService, 'verifyEmail').mockResolvedValue({ user: account, token: 'test-token', active_store_id: store.id, store: { id: store.id, name: store.name } })
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByLabelText('Digit ke-1'))
    await user.paste('12-34 56')
    expect(screen.getByLabelText('Digit ke-6')).toHaveValue('6')
    await user.click(screen.getByRole('button', { name: 'Verifikasi Email' }))
    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/dashboard'))
    expect(authService.verifyEmail).toHaveBeenCalledWith({ email: account.email, code: '123456' })
    expect(useAuthStore.getState().activeStoreName).toBe(store.name)
  })
  it('shows verification errors and restores the submit control', async () => {
    vi.spyOn(authService, 'verifyEmail').mockRejectedValue(new Error('Kode kedaluwarsa'))
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByLabelText('Digit ke-1'))
    await user.paste('123456')
    await user.click(screen.getByRole('button', { name: 'Verifikasi Email' }))
    expect(await screen.findByText('Kode kedaluwarsa')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Verifikasi Email' })).toBeEnabled()
  })
  it('persists the resend cooldown across remounts', async () => {
    const resend = vi.spyOn(authService, 'resendVerification').mockResolvedValue(undefined)
    const user = userEvent.setup()
    const first = setup()
    await user.click(screen.getByRole('button', { name: 'Kirim Ulang Kode' }))
    expect(await screen.findByText('Kode verifikasi baru telah dikirimkan ke email Anda.')).toBeVisible()
    expect(screen.getByRole('button', { name: /Kirim ulang dalam/ })).toBeDisabled()
    first.unmount()
    setup()
    expect(screen.getByRole('button', { name: /Kirim ulang dalam/ })).toBeDisabled()
    expect(resend).toHaveBeenCalledTimes(1)
  })
})

describe('invitation and password pages', () => {
  it('explains a missing invitation token and provides a login link', async () => {
    renderPage(<AcceptInvitePage />, '/accept-invite')
    expect(await screen.findByText('Undangan Tidak Valid')).toBeVisible()
    expect(screen.getByText('Tautan undangan tidak memiliki token yang valid.')).toBeVisible()
    expect(authService.getInviteDetails).not.toHaveBeenCalled()
  })
  it('shows that an existing user already has access', async () => {
    vi.mocked(authService.getInviteDetails).mockResolvedValue({ name: account.name, email: account.email, store_name: store.name, role_name: 'Kasir', is_existing_user: true })
    renderPage(<AcceptInvitePage />, '/accept-invite?token=invite-token')
    expect(await screen.findByText('Akses Toko Sudah Aktif')).toBeVisible()
  })
  it('submits forgot password and allows entering a different email', async () => {
    vi.spyOn(authService, 'forgotPassword').mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage(<ForgotPasswordPage />, '/forgot-password')
    await user.type(screen.getByLabelText(/Alamat Email/), account.email)
    const input = screen.getByLabelText(/Alamat Email/)
    fireEvent.submit(input.closest('form')!)
    expect(await screen.findByRole('button', { name: 'Kirim Ulang ke Email Lain' })).toBeVisible()
    expect(authService.forgotPassword).toHaveBeenCalledWith(account.email)
    await user.click(screen.getByRole('button', { name: 'Kirim Ulang ke Email Lain' }))
    expect(screen.getByLabelText(/Alamat Email/)).toHaveValue('')
  })
  it('does not expose a reset form for a missing token', async () => {
    renderPage(<ResetPasswordPage />, '/reset-password')
    expect(await screen.findByText('Tautan reset kata sandi tidak memiliki token yang valid.')).toBeVisible()
    expect(screen.queryByLabelText(/^Kata Sandi Baru/)).not.toBeInTheDocument()
  })
})

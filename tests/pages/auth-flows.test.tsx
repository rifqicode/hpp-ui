import { act, fireEvent, screen, waitFor } from '@testing-library/react'
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
import { agreementDocument } from '../support/agreement-fixture'
import type { ServiceAgreementDocument } from '@/features/auth/types'

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
    expect(screen.getByText('Email atau username dan kata sandi wajib diisi')).toBeVisible()
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
  it('waits for store permissions before opening the dashboard on first login', async () => {
    const pending = deferred<{ permissions: string[]; role: string }>()
    vi.spyOn(authService, 'login').mockResolvedValue({ user: account, token: 'test-token' })
    vi.mocked(settingsService.getStorePermissions).mockReturnValue(pending.promise)
    useAuthStore.setState({ permissions: [] })
    renderPage(<LoginPage />, '/login')
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: 'Masuk ke Dashboard' }))
    await waitFor(() => expect(settingsService.getStorePermissions).toHaveBeenCalledWith(store.id))
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/login')
    expect(screen.getByRole('button', { name: 'Memverifikasi Akun...' })).toBeDisabled()
    pending.resolve({ permissions: ['menu:dashboard'], role: 'OWNER' })
    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/dashboard'))
  })
  it.each([new Error('Unauthorized'), new Error('Server tidak tersedia'), null])('renders a login failure and allows retry: %s', async (error) => {
    vi.spyOn(authService, 'login').mockRejectedValue(error)
    renderPage(<LoginPage />, '/login')
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: 'Masuk ke Dashboard' }))
    expect(await screen.findByText(error instanceof Error ? error.message === 'Unauthorized' ? 'Email, username, atau kata sandi salah. Silakan coba lagi.' : error.message : 'Gagal masuk. Periksa kembali email atau username dan kata sandi Anda.')).toBeVisible()
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

    await user.click(screen.getByLabelText('Digit 1'))
    await user.paste('123456')

    await user.click(screen.getByRole('button', { name: 'Verifikasi & Masuk' }))
    expect(verifyDevice).toHaveBeenCalledWith('challenge-xyz', '123456')
    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/dashboard'))
  })
})

describe('registration page', () => {
  it('keeps a late store lookup from opening the dashboard after first store creation', async () => {
    resetSession(true)
    const pendingStores = deferred<(typeof store)[]>()
    vi.mocked(settingsService.getStoresList).mockReturnValue(pendingStores.promise)
    vi.spyOn(settingsService, 'createStore').mockResolvedValue(store)
    const user = userEvent.setup()
    renderPage(<RegisterPage initialStep={2} />, '/setup-store')
    await user.type(screen.getByLabelText(/Nama Toko/), store.name)
    await user.type(screen.getByLabelText(/Kota \/ Alamat Gerai/), 'Jakarta')
    await user.click(screen.getByRole('button', { name: 'Selesaikan Pendaftaran' }))
    expect(await screen.findByRole('button', { name: 'Mulai Panduan Toko' })).toBeVisible()
    await act(async () => { pendingStores.resolve([store]) })
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/setup-store')
    await user.click(screen.getByRole('button', { name: 'Mulai Panduan Toko' }))
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/onboarding')
  })

  it('opens onboarding directly when registration returns an authenticated session', async () => {
    vi.spyOn(authService, 'register').mockResolvedValue({ user: account, token: 'test-token', active_store_id: store.id })
    const user = userEvent.setup()
    renderPage(<RegisterPage />, '/register')
    await user.type(screen.getByLabelText(/Nama Lengkap Pemilik/), account.name)
    await user.type(screen.getByLabelText(/Alamat Email Bisnis/), account.email)
    await user.type(screen.getByLabelText(/^Kata Sandi/), 'Abcdef12!')
    await user.type(screen.getByLabelText(/Konfirmasi Kata Sandi/), 'Abcdef12!')
    await readAgreement(user)
    await user.click(screen.getByRole('button', { name: /Lanjut/ }))
    await user.type(screen.getByLabelText(/Nama Toko/), store.name)
    await user.type(screen.getByLabelText(/Kota \/ Alamat Gerai/), 'Jakarta')
    await user.click(screen.getByRole('button', { name: 'Selesaikan Pendaftaran' }))
    expect(await screen.findByRole('button', { name: 'Mulai Panduan Toko' })).toBeVisible()
    expect(settingsService.getStoresList).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/onboarding'), { timeout: 2500 })
  })

  it('keeps agreement controls locked while the backend document is loading', async () => {
    const pending = deferred<ServiceAgreementDocument>()
    vi.mocked(authService.getServiceAgreement).mockReturnValue(pending.promise)
    const user = userEvent.setup()
    renderPage(<RegisterPage />, '/register')
    await user.click(screen.getByRole('checkbox'))
    expect(screen.getByText('Memuat dokumen ketentuan...')).toBeVisible()
    const document = screen.getByRole('region', { name: 'Dokumen Ketentuan Layanan dan Kebijakan Privasi' })
    Object.defineProperties(document, {
      scrollHeight: { configurable: true, value: 2000 },
      clientHeight: { configurable: true, value: 400 },
    })
    fireEvent.scroll(document, { target: { scrollTop: 1600 } })
    expect(screen.getByRole('button', { name: 'Selesai membaca dan setuju' })).toBeDisabled()
    pending.resolve(agreementDocument)
    expect(await screen.findByText(`Versi ${agreementDocument.version} · ${agreementDocument.app_name}`)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Selesai membaca dan setuju' })).toBeDisabled()
    fireEvent.scroll(document, { target: { scrollTop: 1600 } })
    await user.click(screen.getByRole('button', { name: 'Selesai membaca dan setuju' }))
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('allows retry after a document failure and displays the document returned by the backend', async () => {
    vi.mocked(authService.getServiceAgreement)
      .mockRejectedValueOnce(new Error('Dokumen tidak dapat dimuat'))
      .mockResolvedValueOnce({ ...agreementDocument, version: 'server-document-v8', title: 'Dokumen terbaru dari backend' })
    const user = userEvent.setup()
    renderPage(<RegisterPage />, '/register')
    await user.click(screen.getByRole('checkbox'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Dokumen tidak dapat dimuat')
    expect(screen.getByRole('button', { name: 'Selesai membaca dan setuju' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByRole('heading', { name: 'Dokumen terbaru dari backend' })).toBeVisible()
    expect(screen.getByText('Versi server-document-v8 · Ekatra POS')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Selesai membaca dan setuju' })).toBeDisabled()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    expect(screen.getByRole('button', { name: /Lanjut/ })).toBeDisabled()
  })

  async function readAgreement(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('checkbox'))
    const document = screen.getByRole('region', { name: 'Dokumen Ketentuan Layanan dan Kebijakan Privasi' })
    Object.defineProperties(document, {
      scrollHeight: { configurable: true, value: 2000 },
      clientHeight: { configurable: true, value: 400 },
    })
    fireEvent.scroll(document, { target: { scrollTop: 1600 } })
    await user.click(screen.getByRole('button', { name: 'Selesai membaca dan setuju' }))
  }

  it('does not advance an empty form or call register', async () => {
    const register = vi.spyOn(authService, 'register')
    const user = userEvent.setup()
    renderPage(<RegisterPage />, '/register')
    const next = screen.getByRole('button', { name: /Lanjut/ })
    expect(next).toBeDisabled()
    await user.click(next)
    fireEvent.submit(next.closest('form')!)
    expect(screen.getByText('Nama lengkap, email bisnis, dan kata sandi wajib diisi.')).toBeVisible()
    expect(register).not.toHaveBeenCalled()
  })
  it('requires matching passwords and accepted terms before opening store setup', async () => {
    const user = userEvent.setup()
    renderPage(<RegisterPage />, '/register')
    await user.type(screen.getByLabelText(/Nama Lengkap Pemilik/), account.name)
    await user.type(screen.getByLabelText(/Alamat Email Bisnis/), account.email)
    await user.type(screen.getByLabelText(/^Kata Sandi/), 'Abcdef12!')
    const next = screen.getByRole('button', { name: /Lanjut/ })
    fireEvent.submit(next.closest('form')!)
    expect(screen.getByText('Konfirmasi kata sandi tidak cocok dengan kata sandi.')).toBeVisible()
    await user.type(screen.getByLabelText(/Konfirmasi Kata Sandi/), 'Abcdef12!')
    fireEvent.submit(next.closest('form')!)
    expect(screen.getByText('Anda harus menyetujui Ketentuan Layanan & Kebijakan Privasi.')).toBeVisible()
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    await readAgreement(user)
    expect(screen.getByRole('checkbox')).toBeChecked()
    expect(screen.queryByText('Dokumen sudah dibaca sampai akhir. Centang persetujuan untuk melanjutkan pendaftaran.')).not.toBeInTheDocument()
    expect(next).toBeEnabled()
    await user.click(screen.getByRole('button', { name: /Lanjut/ }))
    expect(screen.getByRole('heading', { name: 'Setup Profil Toko Pertama' })).toBeVisible()
  })

  it('keeps consent locked after opening, partially scrolling, closing, and reopening the document', async () => {
    const user = userEvent.setup()
    renderPage(<RegisterPage />, '/register')
    await user.click(screen.getByRole('checkbox'))
    const document = screen.getByRole('region', { name: 'Dokumen Ketentuan Layanan dan Kebijakan Privasi' })
    expect(document).toHaveFocus()
    Object.defineProperties(document, {
      scrollHeight: { configurable: true, value: 2000 },
      clientHeight: { configurable: true, value: 400 },
    })
    fireEvent.scroll(document, { target: { scrollTop: 800 } })
    expect(screen.getByRole('button', { name: 'Selesai membaca dan setuju' })).toBeDisabled()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    await user.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('button', { name: 'Selesai membaca dan setuju' })).toBeDisabled()
    await user.keyboard('{Escape}')
    await readAgreement(user)
    const consent = screen.getByRole('checkbox')
    expect(consent).toBeEnabled()
    expect(consent).toBeChecked()
    expect(screen.getByRole('button', { name: /Lanjut/ })).toBeDisabled()
  })

  it('opens agreement modal when clicking the document title link', async () => {
    const user = userEvent.setup()
    renderPage(<RegisterPage />, '/register')
    await user.click(screen.getByRole('button', { name: /Ketentuan Layanan & Kebijakan Privasi/ }))
    expect(screen.getByRole('region', { name: 'Dokumen Ketentuan Layanan dan Kebijakan Privasi' })).toBeVisible()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('requires a valid email and disables continuation when consent is withdrawn', async () => {
    const user = userEvent.setup()
    renderPage(<RegisterPage />, '/register')
    await user.type(screen.getByLabelText(/Nama Lengkap Pemilik/), account.name)
    await user.type(screen.getByLabelText(/Alamat Email Bisnis/), 'invalid-email')
    await user.type(screen.getByLabelText(/^Kata Sandi/), 'Abcdef12!')
    await user.type(screen.getByLabelText(/Konfirmasi Kata Sandi/), 'Abcdef12!')
    await readAgreement(user)
    const next = screen.getByRole('button', { name: /Lanjut/ })
    expect(next).toBeDisabled()
    fireEvent.submit(next.closest('form')!)
    expect(screen.getByText('Masukkan alamat email bisnis yang valid.')).toBeVisible()
    await user.clear(screen.getByLabelText(/Alamat Email Bisnis/))
    await user.type(screen.getByLabelText(/Alamat Email Bisnis/), account.email)
    expect(next).toBeEnabled()
    await user.click(screen.getByRole('checkbox'))
    expect(next).toBeDisabled()
  })

  it('submits registration after reading and agreeing, retaining consent when navigating back', async () => {
    const register = vi.spyOn(authService, 'register').mockResolvedValue({
      user: account, token: '', requires_verification: true,
    })
    const user = userEvent.setup()
    renderPage(<RegisterPage />, '/register')
    await user.type(screen.getByLabelText(/Nama Lengkap Pemilik/), account.name)
    await user.type(screen.getByLabelText(/Alamat Email Bisnis/), account.email)
    await user.type(screen.getByLabelText(/^Kata Sandi/), 'Abcdef12!')
    await user.type(screen.getByLabelText(/Konfirmasi Kata Sandi/), 'Abcdef12!')
    await readAgreement(user)
    await user.click(screen.getByRole('button', { name: /Lanjut/ }))
    await user.click(screen.getByRole('button', { name: 'Kembali' }))
    expect(screen.getByRole('checkbox')).toBeChecked()
    await user.click(screen.getByRole('button', { name: /Lanjut/ }))
    await user.type(screen.getByLabelText(/Nama Toko/), 'Dapur Rina')
    await user.type(screen.getByLabelText(/Kota \/ Alamat Gerai/), 'Jakarta')
    const phone = screen.getByLabelText(/No. WhatsApp Operasional/)
    expect(screen.getByText('+62', { exact: true })).toBeVisible()
    await user.type(phone, '1234')
    await user.click(screen.getByRole('button', { name: 'Selesaikan Pendaftaran' }))
    expect(screen.getByText(/Nomor WhatsApp harus diawali 8/)).toBeVisible()
    expect(register).not.toHaveBeenCalled()
    await user.clear(phone)
    await user.type(phone, '8123456789012345')
    expect(phone).toHaveValue('812345678901')
    await user.clear(phone)
    await user.click(phone)
    await user.paste('+62 812-3456-7890')
    expect(phone).toHaveValue('81234567890')
    await user.click(screen.getByRole('button', { name: 'Selesaikan Pendaftaran' }))
    await waitFor(() => expect(register).toHaveBeenCalledWith(expect.objectContaining({
      email: account.email,
      consent: { accepted: true, document_version: agreementDocument.version },
      store: expect.objectContaining({ name: 'Dapur Rina', location: 'Jakarta', phone: '+6281234567890' }),
    })))
    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/verify-email'))
  })
})

describe('email verification page', () => {
  function setup() { return renderPage(<VerifyEmailPage />, '/verify-email?email=rina%40example.com') }
  it.each([
    { name: 'owner with a store', user: account, store: { id: store.id, name: store.name }, route: '/onboarding' },
    { name: 'owner without a store', user: account, store: undefined, route: '/setup-store' },
    { name: 'staff with a store', user: { ...account, account_type: 'STAFF' as const, role: 'CASHIER' }, store: { id: store.id, name: store.name }, route: '/dashboard' },
  ])('routes $name to $route after verification', async ({ user: verifiedUser, store: verifiedStore, route }) => {
    vi.spyOn(authService, 'verifyEmail').mockResolvedValue({ user: verifiedUser, token: 'test-token', store: verifiedStore, permissions: [] })
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByLabelText('Digit ke-1'))
    await user.paste('123456')
    await user.click(screen.getByRole('button', { name: 'Verifikasi Email' }))
    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent(route))
    expect(useAuthStore.getState().activeStoreId).toBe(verifiedStore?.id ?? null)
  })
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
    vi.spyOn(authService, 'verifyEmail').mockResolvedValue({ user: account, token: 'test-token', active_store_id: store.id, store: { id: store.id, name: store.name }, permissions: ['menu:dashboard', 'products:read'] })
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByLabelText('Digit ke-1'))
    await user.paste('12-34 56')
    expect(screen.getByLabelText('Digit ke-6')).toHaveValue('6')
    await user.click(screen.getByRole('button', { name: 'Verifikasi Email' }))
    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/onboarding'))
    expect(authService.verifyEmail).toHaveBeenCalledWith({ email: account.email, code: '123456' })
    expect(useAuthStore.getState().activeStoreName).toBe(store.name)
    expect(useAuthStore.getState().permissions).toEqual(['menu:dashboard', 'products:read'])
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
  it('loads permissions before opening onboarding when verification omits grants', async () => {
    const pending = deferred<{ permissions: string[]; role: string }>()
    vi.spyOn(authService, 'verifyEmail').mockResolvedValue({ user: account, token: 'test-token', active_store_id: store.id })
    vi.mocked(settingsService.getStorePermissions).mockReturnValue(pending.promise)
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByLabelText('Digit ke-1'))
    await user.paste('123456')
    await user.click(screen.getByRole('button', { name: 'Verifikasi Email' }))
    await waitFor(() => expect(settingsService.getStorePermissions).toHaveBeenCalledWith(store.id))
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/verify-email')
    pending.resolve({ permissions: ['menu:dashboard'], role: 'OWNER' })
    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/onboarding'))
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

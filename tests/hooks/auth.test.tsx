import type { FormEvent } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useForgotPassword } from '@/features/auth/hooks/use-forgot-password'
import { useResetPassword } from '@/features/auth/hooks/use-reset-password'
import { authService } from '@/features/auth/services/auth-service'
import { createWrapper, deferred } from '../support/render'

const submit = () => ({ preventDefault: vi.fn() }) as unknown as FormEvent

beforeEach(() => {
  vi.spyOn(authService, 'forgotPassword').mockResolvedValue(undefined)
  vi.spyOn(authService, 'resetPassword').mockResolvedValue(undefined)
  vi.spyOn(authService, 'validateResetToken').mockResolvedValue({ valid: true, email: 'rina@example.com' })
})

describe('forgot password form', () => {
  it.each([['', 'Silakan masukkan alamat email Anda.'], ['invalid', 'Format email tidak valid.']])('rejects %s before calling the service', async (email, message) => {
    const { result } = renderHook(useForgotPassword)
    act(() => result.current.setEmail(email))
    await act(() => result.current.handleSubmit(submit()))
    expect(result.current.errorMessage).toBe(message)
    expect(authService.forgotPassword).not.toHaveBeenCalled()
  })
  it('trims email, exposes the pending state, and resets the form after success', async () => {
    const pending = deferred<void>()
    vi.mocked(authService.forgotPassword).mockReturnValue(pending.promise)
    const { result } = renderHook(useForgotPassword)
    act(() => result.current.setEmail(' rina@example.com '))
    let operation!: Promise<void>
    act(() => { operation = result.current.handleSubmit(submit()) })
    expect(result.current.isSubmitting).toBe(true)
    expect(authService.forgotPassword).toHaveBeenCalledWith('rina@example.com')
    await act(async () => { pending.resolve(); await operation })
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.isSuccess).toBe(true)
    act(() => result.current.resetForm())
    expect(result.current).toMatchObject({ email: '', isSuccess: false, errorMessage: null })
  })
  it.each([new Error('Email tidak tersedia'), 'offline'])('shows service errors and restores the submit button: %s', async (error) => {
    vi.mocked(authService.forgotPassword).mockRejectedValue(error)
    const { result } = renderHook(useForgotPassword)
    act(() => result.current.setEmail('rina@example.com'))
    await act(() => result.current.handleSubmit(submit()))
    expect(result.current.errorMessage).toBe(error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses permintaan.')
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.isSuccess).toBe(false)
  })
})

describe('reset password form', () => {
  function setup(entry = '/reset-password?token=valid-token') {
    return renderHook(useResetPassword, createWrapper(entry))
  }
  it('rejects a missing token without a server request', async () => {
    const { result } = setup('/reset-password')
    await waitFor(() => expect(result.current.isValidating).toBe(false))
    expect(result.current.isTokenValid).toBe(false)
    expect(result.current.tokenError).toContain('tidak memiliki token')
    expect(authService.validateResetToken).not.toHaveBeenCalled()
  })
  it.each([new Error('Token kedaluwarsa'), null])('handles invalid token failures: %s', async (error) => {
    vi.mocked(authService.validateResetToken).mockRejectedValue(error)
    const { result } = setup()
    await waitFor(() => expect(result.current.isValidating).toBe(false))
    expect(result.current.isTokenValid).toBe(false)
    expect(result.current.tokenError).toBe(error instanceof Error ? error.message : 'Tautan reset kata sandi tidak valid atau telah kedaluwarsa.')
  })
  it('validates password and confirmation before submitting a valid reset', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.isTokenValid).toBe(true))
    expect(result.current.userEmail).toBe('rina@example.com')
    await act(() => result.current.handleSubmit(submit()))
    expect(result.current.formError).toContain('minimal 8 karakter')
    act(() => result.current.setPassword('Abcdef12!'))
    await act(() => result.current.handleSubmit(submit()))
    expect(result.current.formError).toBe('Konfirmasi kata sandi tidak cocok.')
    expect(authService.resetPassword).not.toHaveBeenCalled()
    act(() => result.current.setConfirmPassword('Abcdef12!'))
    await act(() => result.current.handleSubmit(submit()))
    expect(authService.resetPassword).toHaveBeenCalledWith({ token: 'valid-token', new_password: 'Abcdef12!' })
    expect(result.current.isSuccess).toBe(true)
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.formError).toBeNull()
  })
  it.each([new Error('Reset ditolak'), 'offline'])('handles reset submission failures: %s', async (error) => {
    vi.mocked(authService.resetPassword).mockRejectedValue(error)
    const { result } = setup()
    await waitFor(() => expect(result.current.isValidating).toBe(false))
    act(() => { result.current.setPassword('Abcdef12!'); result.current.setConfirmPassword('Abcdef12!') })
    await act(() => result.current.handleSubmit(submit()))
    expect(result.current.formError).toBe(error instanceof Error ? error.message : 'Gagal mengatur ulang kata sandi. Silakan coba lagi.')
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.isSubmitting).toBe(false)
  })
})

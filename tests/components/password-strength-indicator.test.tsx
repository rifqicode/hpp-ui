import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator'

describe('PasswordStrengthIndicator', () => {
  it('stays hidden until a password is entered', () => {
    const { container } = render(<PasswordStrengthIndicator password="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('updates the strength feedback as the password changes', () => {
    const { rerender } = render(<PasswordStrengthIndicator password="abc" />)
    expect(screen.getByText('Lemah')).toBeInTheDocument()
    rerender(<PasswordStrengthIndicator password="abcdefgh" />)
    expect(screen.getByText('Sedang')).toBeInTheDocument()
    expect(screen.queryByText('Lemah')).not.toBeInTheDocument()
    rerender(<PasswordStrengthIndicator password="Abcdef12!" />)
    expect(screen.getByText('Kuat & Aman')).toBeInTheDocument()
    expect(screen.queryByText('Sedang')).not.toBeInTheDocument()
    expect(screen.getByText('Minimal 8 karakter')).toBeInTheDocument()
    expect(screen.getByText('Mengandung huruf dan angka')).toBeInTheDocument()
    expect(screen.getByText('Kombinasi huruf besar & kecil atau simbol')).toBeInTheDocument()
  })
})

import { describe, expect, it } from 'vitest'
import {
  calculatePasswordStrength,
  validatePassword,
} from '@/components/ui/password-strength-indicator'

describe('password validation', () => {
  it.each(['', 'Abc1234'])('rejects passwords shorter than eight characters', (password) => {
    expect(validatePassword(password)).toBe('Kata sandi minimal 8 karakter.')
  })

  it.each(['abcdefgh', '12345678', 'Abcdefg!'])('requires both letters and numbers: %s', (password) => {
    expect(validatePassword(password)).toBe('Kata sandi harus mengandung kombinasi huruf dan angka.')
  })

  it.each(['abcdefg1', 'Abcdef12!'])('accepts a valid password: %s', (password) => {
    expect(validatePassword(password)).toBeNull()
  })

  it.each<[string, number]>([
    ['', 0], ['abc', 0], ['abcdef', 1], ['abcdefgh', 2], ['abcdefg1', 3], ['Abcdef12!', 4],
  ])('scores %s as %i', (password, score) => {
    expect(calculatePasswordStrength(password)).toBe(score)
  })
})

import { describe, expect, it } from 'vitest'
import { normalizeOperationalPhoneInput } from '@/features/auth/lib/phone'

describe('operational phone input', () => {
  it.each([
    ['', ''],
    ['81234567890', '81234567890'],
    ['081234567890', '81234567890'],
    ['6281234567890', '81234567890'],
    ['+62 (812) 3456-7890', '81234567890'],
    ['+4481234567890', '4481234567890'],
    ['81234567890123456789', '81234567890123456789'],
  ])('normalizes %s without truncating the number', (input, expected) => {
    expect(normalizeOperationalPhoneInput(input)).toBe(expected)
  })
})

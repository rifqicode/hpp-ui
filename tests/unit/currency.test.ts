import { describe, expect, it } from 'vitest'
import { formatCurrency } from '@/components/ui/currency-text'

describe('currency display', () => {
  it.each([null, undefined, '', '   ', NaN, Infinity, -Infinity, 'NaN', 'null', 'undefined', 'abc', '12abc'])('uses a placeholder for %s', (value) => {
    expect(formatCurrency(value)).toBe('-')
    expect(formatCurrency(value, { emptyDisplay: 'Belum tersedia' })).toBe('Belum tersedia')
  })
  it.each<[number | string, string]>([
    [0, 'Rp 0'], [15000, 'Rp 15.000'], [-15000, '-Rp 15.000'],
    ['Rp 15.000', 'Rp 15.000'], ['IDR 15.000', 'Rp 15.000'],
    ['1.000.000', 'Rp 1.000.000'], ['15000.5', 'Rp 15.001'],
    ['15.000,50', 'Rp 15.001'], ['15,000.50', 'Rp 15.001'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatCurrency(value)).toBe(expected)
  })
  it('formats decimal precision, signs, and custom units', () => {
    expect(formatCurrency('15000.5', { allowDecimal: true })).toBe('Rp 15.000,50')
    expect(formatCurrency(1250.125, { decimalDigits: 3, prefix: '', suffix: '/kg' })).toBe('1.250,125/kg')
    expect(formatCurrency(5000, { showPositiveSign: true })).toBe('+Rp 5.000')
    expect(formatCurrency(0, { showPositiveSign: true })).toBe('Rp 0')
    expect(formatCurrency(1250.5, { allowDecimal: true, thousandSeparator: ',', decimalSeparator: '.' })).toBe('Rp 1,250.50')
  })
})

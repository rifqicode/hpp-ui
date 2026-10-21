import { describe, expect, it } from 'vitest'
import {
  calculateCursorPosition,
  countMeaningfulChars,
  formatAsYouType,
  formatNumber,
  parseNumber,
} from '@/lib/number-format'

describe('localized number formatting', () => {
  it.each([
    [undefined, ''], [null, ''], ['', ''], ['   ', ''],
    [0, '0'], [1500000, '1.500.000'], ['0001250', '1.250'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatNumber(value)).toBe(expected)
  })

  it('formats backend decimals and limits precision', () => {
    expect(formatNumber('1250.56789', { allowDecimal: true, maxDecimals: 2 })).toBe('1.250,56')
    expect(formatNumber('0.001', { allowDecimal: true })).toBe('0,001')
  })

  it('supports negative quantities when enabled', () => {
    expect(formatNumber(-1250.5, { allowDecimal: true, allowNegative: true })).toBe('-1.250,5')
  })

  it('supports alternate separators', () => {
    expect(formatNumber(1250.5, {
      allowDecimal: true, thousandSeparator: ',', decimalSeparator: '.',
    })).toBe('1,250.5')
  })

  it('parses localized decimals into a backend value', () => {
    expect(parseNumber('1.250,50', { allowDecimal: true })).toEqual({
      rawString: '1250.50', numberValue: 1250.5, isValid: true,
    })
  })

  it.each(['', '   ', 'abc'])('rejects input without a number: %s', (input) => {
    expect(parseNumber(input)).toEqual({ rawString: '', numberValue: 0, isValid: false })
  })

  it('preserves a decimal separator while typing', () => {
    expect(formatAsYouType('1250,', { allowDecimal: true })).toEqual({
      display: '1.250,', rawString: '1250.', numericValue: 1250, hasDecimalSeparator: true,
    })
  })

  it('handles a fractional quantity without a leading zero', () => {
    expect(formatAsYouType(',125', { allowDecimal: true })).toEqual({
      display: '0,125', rawString: '0.125', numericValue: 0.125, hasDecimalSeparator: true,
    })
  })

  it('keeps the caret after the same digit when grouping adds a separator', () => {
    expect(countMeaningfulChars('12.345')).toBe(5)
    expect(calculateCursorPosition('12.345', 3)).toBe(4)
    expect(calculateCursorPosition('12.345', 0)).toBe(0)
    expect(calculateCursorPosition('12.345', 99)).toBe(6)
  })
})

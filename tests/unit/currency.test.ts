import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import * as React from 'react'
import { formatCurrency, CurrencyText } from '@/components/ui/currency-text'

describe('currency display core formatter', () => {
  it.each([null, undefined, '', '   ', NaN, Infinity, -Infinity, 'NaN', 'null', 'undefined', 'abc', '12abc'])('uses a placeholder for %s', (value) => {
    expect(formatCurrency(value)).toBe('-')
    expect(formatCurrency(value, { emptyDisplay: 'Belum tersedia' })).toBe('Belum tersedia')
  })

  it.each<[number | string, string]>([
    [0, 'Rp 0'],
    [15000, 'Rp 15.000'],
    [-15000, '-Rp 15.000'],
    ['Rp 15.000', 'Rp 15.000'],
    ['IDR 15.000', 'Rp 15.000'],
    ['1.000.000', 'Rp 1.000.000'],
    ['15000.5', 'Rp 15.001'],
    ['15.000,50', 'Rp 15.001'],
    ['15,000.50', 'Rp 15.001'],
  ])('formats %s as %s in default summary mode', (value, expected) => {
    expect(formatCurrency(value)).toBe(expected)
  })

  it('formats legacy options: decimal precision, signs, and custom units', () => {
    expect(formatCurrency('15000.5', { allowDecimal: true })).toBe('Rp 15.000,50')
    expect(formatCurrency(1250.125, { decimalDigits: 3, prefix: '', suffix: '/kg' })).toBe('1.250,125/kg')
    expect(formatCurrency(5000, { showPositiveSign: true })).toBe('+Rp 5.000')
    expect(formatCurrency(0, { showPositiveSign: true })).toBe('Rp 0')
    expect(formatCurrency(1250.5, { allowDecimal: true, thousandSeparator: ',', decimalSeparator: '.' })).toBe('Rp 1,250.50')
  })
})

describe('PRD Section 10 Acceptance Criteria: Presets and Rounding', () => {
  it('Summary preset: 0 decimals with nearest half-away-from-zero rounding', () => {
    // Ringkasan 3333.3333 tampil Rp 3.333
    expect(formatCurrency(3333.3333, { preset: 'summary' })).toBe('Rp 3.333')
    // Ringkasan 3333.67 tampil Rp 3.334
    expect(formatCurrency(3333.67, { preset: 'summary' })).toBe('Rp 3.334')
    // Ringkasan 1.4999 langsung dari raw menjadi Rp 1, bukan Rp 2
    expect(formatCurrency(1.4999, { preset: 'summary' })).toBe('Rp 1')
    // Halfway values
    expect(formatCurrency(12.5, { preset: 'summary' })).toBe('Rp 13')
    expect(formatCurrency(-12.5, { preset: 'summary' })).toBe('-Rp 13')
  })

  it('Detail preset: max 2 decimals with auto-trimming trailing zeros', () => {
    // Detail 3333.3333 tampil Rp 3.333,33
    expect(formatCurrency(3333.3333, { preset: 'detail' })).toBe('Rp 3.333,33')
    // Integer does not force ,00 (1500 -> Rp 1.500)
    expect(formatCurrency(1500, { preset: 'detail' })).toBe('Rp 1.500')
    // Single decimal trailing trimmed (1500.5 -> Rp 1.500,5)
    expect(formatCurrency(1500.5, { preset: 'detail' })).toBe('Rp 1.500,5')
    // Halfway cases round half-away-from-zero: 1234.565 -> Rp 1.234,57 and -1234.565 -> -Rp 1.234,57
    expect(formatCurrency(1234.565, { preset: 'detail' })).toBe('Rp 1.234,57')
    expect(formatCurrency(-1234.565, { preset: 'detail' })).toBe('-Rp 1.234,57')
    // IEEE 754 precision check (1.005 -> 1.01)
    expect(formatCurrency(1.005, { preset: 'detail' })).toBe('Rp 1,01')
  })

  it('UnitRate preset: max 4 decimals with auto-trimming trailing zeros', () => {
    // Tarif 0.1256 tampil Rp 0,1256 dengan satuan yang relevan
    expect(formatCurrency(0.1256, { preset: 'unitRate', suffix: ' / g' })).toBe('Rp 0,1256 / g')
    // Trailing zeros trimmed in unitRate
    expect(formatCurrency(0.12, { preset: 'unitRate', suffix: ' / g' })).toBe('Rp 0,12 / g')
    expect(formatCurrency(1.0, { preset: 'unitRate' })).toBe('Rp 1')
  })

  it('Full preset: shows all decimals from API without rounding', () => {
    expect(formatCurrency(3333.3333, { preset: 'full' })).toBe('Rp 3.333,3333')
    expect(formatCurrency('1234.56789', { preset: 'full' })).toBe('Rp 1.234,56789')
    expect(formatCurrency('1500', { preset: 'full' })).toBe('Rp 1.500')
  })

  it('API decimal string parsing: "1.234" is parsed as decimal 1,234 (not integer 1234)', () => {
    // On detail preset, 1.234 becomes Rp 1,23
    expect(formatCurrency('1.234', { preset: 'detail' })).toBe('Rp 1,23')
    // On unitRate preset, 1.234 becomes Rp 1,234
    expect(formatCurrency('1.234', { preset: 'unitRate' })).toBe('Rp 1,234')
    // On summary preset, 1.234 rounds to Rp 1
    expect(formatCurrency('1.234', { preset: 'summary' })).toBe('Rp 1')
  })

  it('Non-zero small values display threshold indicators and never zero', () => {
    // Detail threshold: 0 < abs(val) < 0.005 -> <Rp 0,01
    expect(formatCurrency(0.004, { preset: 'detail' })).toBe('<Rp 0,01')
    expect(formatCurrency(-0.004, { preset: 'detail' })).toBe('-(<Rp 0,01)')
    // UnitRate threshold: 0 < abs(val) < 0.00005 -> <Rp 0,0001
    expect(formatCurrency(0.00002, { preset: 'unitRate' })).toBe('<Rp 0,0001')
    expect(formatCurrency(-0.00002, { preset: 'unitRate' })).toBe('-(<Rp 0,0001)')
    // Summary threshold: 0 < abs(val) < 0.5 -> <Rp 1
    expect(formatCurrency(0.3, { preset: 'summary' })).toBe('<Rp 1')
    expect(formatCurrency(-0.3, { preset: 'summary' })).toBe('-(<Rp 1)')
  })

  it('Absolute zero displays Rp 0 without minus sign', () => {
    expect(formatCurrency(0)).toBe('Rp 0')
    expect(formatCurrency(-0)).toBe('Rp 0')
    expect(formatCurrency(0, { preset: 'detail' })).toBe('Rp 0')
    expect(formatCurrency(-0, { preset: 'detail' })).toBe('Rp 0')
    expect(formatCurrency(0, { preset: 'unitRate' })).toBe('Rp 0')
    expect(formatCurrency(0, { preset: 'full' })).toBe('Rp 0')
  })
})

describe('CurrencyText component and showFullValueAction', () => {
  it('renders standard formatted currency without action button by default', () => {
    render(React.createElement(CurrencyText, { value: 3333.3333, preset: 'detail' }))
    expect(screen.getByText('Rp 3.333,33')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /nilai asli/i })).not.toBeInTheDocument()
  })

  it('renders action button and opens accessible dialog with raw value and copy action', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    })

    render(
      React.createElement(CurrencyText, {
        value: '3333.333345',
        preset: 'detail',
        showFullValueAction: true,
        rawUnit: '/ pcs',
      })
    )

    // Formatted text is displayed
    expect(screen.getByText('Rp 3.333,33')).toBeInTheDocument()

    // Action trigger button exists
    const trigger = screen.getByRole('button', { name: /nilai asli dari server/i })
    expect(trigger).toBeInTheDocument()

    // Click trigger to open Dialog
    fireEvent.click(trigger)

    // Dialog elements should appear
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Nilai Asli dari Server')).toBeInTheDocument()
    expect(screen.getByText(/3333\.333345/)).toBeInTheDocument()

    // Click copy button
    const copyButton = screen.getByRole('button', { name: /salin nilai asli/i })
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('3333.333345')
      expect(screen.getByText('Tersalin!')).toBeInTheDocument()
    })
  })
})

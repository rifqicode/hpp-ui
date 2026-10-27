import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FormattedNumberInput } from '@/components/ui/formatted-number-input'

function PriceInput({ allowDecimal = false }: { allowDecimal?: boolean }) {
  const [value, setValue] = useState<number | string>('')
  return <>
    <FormattedNumberInput aria-label="Harga" value={value} onChange={setValue} allowDecimal={allowDecimal} />
    <output aria-label="Nilai tersimpan">{String(value)}</output>
  </>
}

describe('FormattedNumberInput', () => {
  it('formats a loaded backend value and updates when the parent resets it', () => {
    const { rerender } = render(<FormattedNumberInput aria-label="Harga" value={1250.5} allowDecimal />)
    expect(screen.getByRole('textbox', { name: 'Harga' })).toHaveValue('1.250,5')
    rerender(<FormattedNumberInput aria-label="Harga" value={5000} allowDecimal />)
    expect(screen.getByRole('textbox', { name: 'Harga' })).toHaveValue('5.000')
  })

  it('groups thousands while keeping the stored value free of separators', async () => {
    const user = userEvent.setup()
    render(<PriceInput />)
    await user.type(screen.getByRole('textbox', { name: 'Harga' }), '12500')
    expect(screen.getByRole('textbox', { name: 'Harga' })).toHaveValue('12.500')
    expect(screen.getByLabelText('Nilai tersimpan')).toHaveTextContent(/^12500$/)
  })

  it('accepts a localized decimal and preserves its raw string', async () => {
    const user = userEvent.setup()
    render(<PriceInput allowDecimal />)
    await user.type(screen.getByRole('textbox', { name: 'Harga' }), '12,50')
    expect(screen.getByRole('textbox', { name: 'Harga' })).toHaveValue('12,50')
    expect(screen.getByLabelText('Nilai tersimpan')).toHaveTextContent(/^12\.50$/)
  })

  it('emits the configured empty value when cleared', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onValueChange = vi.fn()
    render(<FormattedNumberInput aria-label="Harga" defaultValue={12500} emptyValue={null} onChange={onChange} onValueChange={onValueChange} />)
    await user.clear(screen.getByRole('textbox', { name: 'Harga' }))
    expect(screen.getByRole('textbox', { name: 'Harga' })).toHaveValue('')
    expect(onChange).toHaveBeenLastCalledWith(null, expect.anything())
    expect(onValueChange).toHaveBeenLastCalledWith({ floatValue: undefined, formattedValue: '', rawString: '' })
  })

  it('blocks decimal keys for integer quantities', async () => {
    const user = userEvent.setup()
    render(<PriceInput />)
    await user.type(screen.getByRole('textbox', { name: 'Harga' }), '12.,5')
    expect(screen.getByRole('textbox', { name: 'Harga' })).toHaveValue('125')
  })

  it('formats 50000 smoothly without getting stuck when allowDecimal is true', async () => {
    const user = userEvent.setup()
    render(<PriceInput allowDecimal />)
    await user.type(screen.getByRole('textbox', { name: 'Harga' }), '50000')
    expect(screen.getByRole('textbox', { name: 'Harga' })).toHaveValue('50.000')
    expect(screen.getByLabelText('Nilai tersimpan')).toHaveTextContent(/^50000$/)
  })

  it.each([{ disabled: true }, { readOnly: true }])('prevents edits when %j', async (props) => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FormattedNumberInput aria-label="Harga" value={12500} onChange={onChange} {...props} />)
    await user.type(screen.getByRole('textbox', { name: 'Harga' }), '99')
    expect(screen.getByRole('textbox', { name: 'Harga' })).toHaveValue('12.500')
    expect(onChange).not.toHaveBeenCalled()
  })
})

import { createRef, useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Switch } from '@/components/ui/switch'
import { CurrencyText } from '@/components/ui/currency-text'
import { UserAvatar } from '@/components/ui/user-avatar'

describe('Switch', () => {
  it('toggles with the keyboard and exposes its checked state', async () => {
    function Example() {
      const [checked, setChecked] = useState(false)
      return <Switch aria-label="Notifikasi" checked={checked} onCheckedChange={setChecked} />
    }
    const user = userEvent.setup()
    render(<Example />)
    const control = screen.getByRole('switch', { name: 'Notifikasi' })
    expect(control).toHaveAttribute('aria-checked', 'false')
    await user.tab()
    expect(control).toHaveFocus()
    await user.keyboard(' ')
    expect(control).toHaveAttribute('aria-checked', 'true')
    await user.keyboard(' ')
    expect(control).toHaveAttribute('aria-checked', 'false')
  })
  it('does not emit changes while disabled', async () => {
    const user = userEvent.setup()
    const change = vi.fn()
    render(<Switch aria-label="Notifikasi" checked disabled onCheckedChange={change} />)
    await user.click(screen.getByRole('switch'))
    expect(change).not.toHaveBeenCalled()
  })
})

describe('CurrencyText', () => {
  it('forwards semantic tags, refs, and accessible labels', () => {
    const ref = createRef<HTMLElement>()
    render(<CurrencyText as="strong" aria-label="Total" ref={ref} value={12500} suffix="/kg" />)
    expect(screen.getByLabelText('Total')).toHaveTextContent('Rp 12.500/kg')
    expect(ref.current?.tagName).toBe('STRONG')
  })
})

describe('UserAvatar', () => {
  it.each([['Rina Sari', 'RS'], ['Rina', 'RI'], ['', 'U'], ['   ', 'U'], ['!!!', 'U'], ['Rina Putri Sari', 'RS']])('shows initials for %s', (name, expected) => {
    render(<UserAvatar name={name} />)
    expect(screen.getByText(expected)).toBeVisible()
  })
})

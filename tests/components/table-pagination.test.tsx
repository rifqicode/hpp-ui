import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TablePagination } from '@/components/ui/table-pagination'

describe('TablePagination', () => {
  it('does not show pagination for an empty list', () => {
    const { container } = render(<TablePagination total={0} displayedCount={0} onPrev={vi.fn()} onNext={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the count and only allows moving forward on the first page', async () => {
    const user = userEvent.setup()
    const onPrev = vi.fn()
    const onNext = vi.fn()
    render(<TablePagination total={25} displayedCount={10} page={1} totalPages={3} label="produk" onPrev={onPrev} onNext={onNext} />)

    expect(screen.getByText('Menampilkan 10 dari 25 produk')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Prev' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(onPrev).not.toHaveBeenCalled()
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('prevents moving beyond the last page', async () => {
    const user = userEvent.setup()
    const onPrev = vi.fn()
    const onNext = vi.fn()
    render(<TablePagination total={25} displayedCount={5} page={3} totalPages={3} onPrev={onPrev} onNext={onNext} />)
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Prev' }))
    expect(onNext).not.toHaveBeenCalled()
    expect(onPrev).toHaveBeenCalledTimes(1)
  })

  it('disables both directions while data is loading', async () => {
    const user = userEvent.setup()
    const onPrev = vi.fn()
    const onNext = vi.fn()
    render(<TablePagination total={25} displayedCount={10} page={2} totalPages={3} disabled onPrev={onPrev} onNext={onNext} />)
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
      await user.click(button)
    }
    expect(onPrev).not.toHaveBeenCalled()
    expect(onNext).not.toHaveBeenCalled()
  })

  it('disables both directions for a single page', () => {
    render(<TablePagination total={5} displayedCount={5} page={1} totalPages={1} onPrev={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })
})

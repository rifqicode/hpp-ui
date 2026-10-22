import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DataTable } from '@/components/ui/data-table'

const columns = [{ header: 'Produk', accessor: (item: { name: string }) => item.name }]
const data = [{ name: 'Roti' }, { name: 'Donat' }, { name: 'Susu' }]

describe('DataTable', () => {
  it('paginates local data and returns to the previous page', async () => {
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={data} pageSize={2} />)
    expect(screen.getByRole('cell', { name: 'Roti' })).toBeVisible()
    expect(screen.queryByRole('cell', { name: 'Susu' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('cell', { name: 'Susu' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Prev' }))
    expect(screen.getByRole('cell', { name: 'Roti' })).toBeVisible()
  })
  it('clamps the current page when data shrinks after deletion', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<DataTable columns={columns} data={data} pageSize={2} />)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    rerender(<DataTable columns={columns} data={[data[0]]} pageSize={2} />)
    expect(screen.getByRole('cell', { name: 'Roti' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled()
  })
  it('does not slice server-paginated data and delegates navigation', async () => {
    const user = userEvent.setup()
    const onPrev = vi.fn()
    const onNext = vi.fn()
    render(<DataTable columns={columns} data={data} pageSize={1} page={2} total={30} totalPages={10} onPrev={onPrev} onNext={onNext} />)
    expect(screen.getAllByRole('cell')).toHaveLength(3)
    await user.click(screen.getByRole('button', { name: 'Prev' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(onPrev).toHaveBeenCalledOnce()
    expect(onNext).toHaveBeenCalledOnce()
  })
  it('shows an empty message and no pagination when there are no rows', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="Belum ada produk" />)
    expect(screen.getByRole('cell', { name: 'Belum ada produk' })).toHaveAttribute('colspan', '1')
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
  })
})

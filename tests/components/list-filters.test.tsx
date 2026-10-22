import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ListFilters } from '@/components/ui/list-filters'

function FilterExample({ isFetching = false }: { isFetching?: boolean }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  return <ListFilters
    label="Filter produk"
    search={{ label: 'Cari produk', placeholder: 'Nama produk', value: search, onChange: setSearch }}
    filters={[{
      id: 'category', label: 'Kategori', value: category, onChange: setCategory,
      options: [{ value: '', label: 'Semua kategori' }, { value: 'roti', label: 'Roti' }],
    }]}
    hasFilters={Boolean(search || category)}
    onReset={() => { setSearch(''); setCategory('') }}
    isFetching={isFetching}
    summary="10 produk"
  />
}

describe('ListFilters', () => {
  it('accepts a search and clears it using the clear button', async () => {
    const user = userEvent.setup()
    render(<FilterExample />)
    expect(screen.queryByRole('button', { name: 'Hapus pencarian' })).not.toBeInTheDocument()
    const search = screen.getByRole('textbox', { name: 'Cari produk' })
    await user.type(search, 'Tepung')
    expect(search).toHaveValue('Tepung')
    await user.click(screen.getByRole('button', { name: 'Hapus pencarian' }))
    expect(search).toHaveValue('')
    expect(screen.queryByRole('button', { name: 'Reset filter' })).not.toBeInTheDocument()
  })

  it('changes category and resets all active filters together', async () => {
    const user = userEvent.setup()
    render(<FilterExample />)
    const search = screen.getByRole('textbox', { name: 'Cari produk' })
    const category = screen.getByRole('combobox', { name: 'Kategori' })
    await user.type(search, 'Susu')
    await user.selectOptions(category, 'roti')
    expect(category).toHaveValue('roti')
    await user.click(screen.getByRole('button', { name: 'Reset filter' }))
    expect(search).toHaveValue('')
    expect(category).toHaveValue('')
    expect(screen.queryByRole('button', { name: 'Reset filter' })).not.toBeInTheDocument()
  })

  it('shows fetching feedback without removing the filters', () => {
    const { rerender } = render(<FilterExample isFetching />)
    expect(screen.getByLabelText('Memperbarui data')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Filter produk' })).toBeInTheDocument()
    expect(screen.getByText('10 produk')).toBeInTheDocument()
    rerender(<FilterExample />)
    expect(screen.queryByLabelText('Memperbarui data')).not.toBeInTheDocument()
  })

  it('renders trailing actions next to filters when provided', () => {
    render(<ListFilters
      label="Filter produk"
      search={{ label: 'Cari', placeholder: 'Cari...', value: '', onChange: () => {} }}
      hasFilters={false}
      onReset={() => {}}
      trailingActions={<button type="button">Urutkan</button>}
    />)
    expect(screen.getByRole('button', { name: 'Urutkan' })).toBeInTheDocument()
  })
})

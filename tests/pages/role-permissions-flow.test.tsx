import * as React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RoleCreatePage from '@/pages/settings/role-create-page'
import { PermissionBrowser } from '@/features/settings/components/permission-browser'
import { settingsService } from '@/features/settings/services/settings-service'
import type { Permission } from '@/features/settings/types'
import { mockPageServices, resetSession } from '../support/page-services'
import { renderPage } from '../support/render'

const catalog: Permission[] = [
  { id: 'p1', code: 'products:read', name: 'Lihat Produk', description: 'Melihat daftar produk jual.', group: 'products' },
  { id: 'p2', code: 'products:write', name: 'Tambah Produk', description: 'Membuat produk baru.', group: 'products' },
  { id: 'p3', code: 'stocks:adjust', name: 'Koreksi Stok', description: 'Mencatat selisih bahan baku.', group: 'stocks' },
  { id: 'p4', code: 'menu:pos', name: 'Akses Kasir', description: 'Membuka halaman POS.', group: 'MENU' },
]

beforeEach(() => {
  resetSession()
  mockPageServices()
  vi.mocked(settingsService.getPermissionsCatalog).mockResolvedValue(catalog)
  vi.spyOn(settingsService, 'createRole').mockResolvedValue({ id: 'new-role', name: 'Kasir' })
  vi.spyOn(settingsService, 'updateRole').mockResolvedValue({ id: 'role-1', name: 'Kasir' })
})

function Picker({ initial = [] }: { initial?: string[] }) {
  const [selected, setSelected] = React.useState(initial)
  return <PermissionBrowser permissions={catalog} selectedCodes={selected} onSelectionChange={setSelected} />
}

describe('permission selection', () => {
  it('keeps hidden selections and limits bulk selection to visible search results', async () => {
    const user = userEvent.setup()
    renderPage(<Picker />)
    const first = screen.getByRole('checkbox', { name: 'Lihat Produk', exact: true })
    first.focus()
    await user.keyboard(' ')
    expect(first).toBeChecked()
    await user.type(screen.getByRole('textbox', { name: 'Cari hak akses' }), 'selisih')
    expect(screen.queryByRole('checkbox', { name: 'Lihat Produk', exact: true })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Pilih hasil (1)' }))
    await user.click(screen.getByRole('button', { name: 'Hapus pencarian izin' }))
    expect(screen.getByRole('checkbox', { name: 'Lihat Produk', exact: true })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Koreksi Stok', exact: true })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Tambah Produk', exact: true })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Akses Kasir', exact: true })).not.toBeChecked()
  })

  it('shows partial group selection and applies a group checkbox only to visible results', async () => {
    const user = userEvent.setup()
    renderPage(<Picker initial={['products:read', 'stocks:adjust']} />)
    const group = screen.getByRole('checkbox', { name: 'Pilih semua izin yang tampil di Katalog Produk Siap Jual' })
    expect(group).toBePartiallyChecked()
    await user.type(screen.getByRole('textbox', { name: 'Cari hak akses' }), 'tambah')
    await user.click(screen.getByRole('checkbox', { name: 'Pilih semua izin yang tampil di Katalog Produk Siap Jual' }))
    await user.click(screen.getByRole('button', { name: 'Hapus pencarian izin' }))
    expect(screen.getByRole('checkbox', { name: 'Lihat Produk', exact: true })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Tambah Produk', exact: true })).toBeChecked()
    await user.click(screen.getByRole('checkbox', { name: 'Pilih semua izin yang tampil di Katalog Produk Siap Jual' }))
    expect(screen.getByRole('checkbox', { name: 'Koreksi Stok', exact: true })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Lihat Produk', exact: true })).not.toBeChecked()
  })

  it('searches permission codes and filters selected permissions without clearing choices', async () => {
    const user = userEvent.setup()
    renderPage(<Picker initial={['products:read', 'menu:pos']} />)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Modul hak akses' }), 'MENU')
    expect(screen.getByRole('checkbox', { name: 'Akses Kasir', exact: true })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Reset filter izin' }))
    await user.type(screen.getByRole('textbox', { name: 'Cari hak akses' }), 'PRODUCTS:READ')
    expect(screen.getByRole('checkbox', { name: 'Lihat Produk', exact: true })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Reset filter izin' }))
    await user.click(screen.getByRole('checkbox', { name: 'Hanya yang dipilih' }))
    expect(screen.queryByRole('checkbox', { name: 'Tambah Produk', exact: true })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Akses Kasir', exact: true })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Kosongkan semua' }))
    expect(screen.getByText('Tidak ada hak akses yang cocok.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Reset filter izin' }))
    expect(screen.getByRole('checkbox', { name: 'Lihat Produk', exact: true })).not.toBeChecked()
  })
})

describe('role authoring', () => {
  it('creates a role with selections made across different searches', async () => {
    const user = userEvent.setup()
    renderPage(<RoleCreatePage />, '/settings/role/new')
    const name = await screen.findByRole('textbox', { name: /Nama Peran/ })
    await user.type(name, 'Kasir Toko')
    await user.type(screen.getByRole('textbox', { name: 'Cari hak akses' }), 'produk')
    await user.click(screen.getByRole('checkbox', { name: 'Lihat Produk', exact: true }))
    await user.clear(screen.getByRole('textbox', { name: 'Cari hak akses' }))
    await user.type(screen.getByRole('textbox', { name: 'Cari hak akses' }), 'menu:pos')
    await user.click(screen.getByRole('checkbox', { name: 'Akses Kasir', exact: true }))
    await user.click(screen.getByRole('button', { name: 'Simpan Peran Baru' }))
    await waitFor(() => expect(settingsService.createRole).toHaveBeenCalledWith(expect.objectContaining({ name: 'KASIR_TOKO', displayName: 'Kasir Toko', permissionCodes: ['products:read', 'menu:pos'] }), 'store-1'))
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/settings/store?tab=roles')
  })

  it('loads existing choices and preserves hidden permissions when editing', async () => {
    vi.mocked(settingsService.getRoleById).mockResolvedValue({ id: 'role-1', name: 'Kasir', permissions: [catalog[0], catalog[3]] })
    const user = userEvent.setup()
    renderPage(<RoleCreatePage />, '/settings/role/role-1', '/settings/role/:id')
    expect(await screen.findByRole('checkbox', { name: 'Lihat Produk', exact: true })).toBeChecked()
    await user.type(screen.getByRole('textbox', { name: 'Cari hak akses' }), 'koreksi')
    await user.click(screen.getByRole('checkbox', { name: 'Koreksi Stok', exact: true }))
    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    await waitFor(() => expect(settingsService.updateRole).toHaveBeenCalledWith('role-1', expect.objectContaining({ permission_codes: ['products:read', 'menu:pos', 'stocks:adjust'] }), 'store-1'))
  })
})

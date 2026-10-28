import { describe, expect, it } from 'vitest'
import { getActiveMenuTitle } from '@/lib/page-info'
import { filterNavigation, getActiveNavigationIds, NAVIGATION } from '@/components/layout/sidebar-navigation'
import { getCompatibleUnits, getCostPerRecipeUnit, getQuantityInBaseUnit, normalizeUnit } from '@/lib/units'

describe('page titles', () => {
  it.each([
    ['/dashboard/', 'Dashboard'], ['/inventory/stocks', 'Bahan Baku'], ['/inventory/stocks/s1', 'Detail Bahan Baku'],
    ['/inventory/purchase/new', 'Catat Belanja Masuk'], ['/inventory/movements/new', 'Koreksi Mutasi'],
    ['/inventory/suppliers', 'Suppliers'], ['/inventory/suppliers/s1', 'Detail Supplier'],
    ['/inventory/purchase-orders', 'Purchase'], ['/inventory/purchase-orders/new', 'Buat PO Baru'], ['/inventory/purchase-orders/p1', 'Detail Purchase Order'],
    ['/production/products', 'Produk'], ['/production/products/new', 'Tambah Produk'], ['/production/products/p1', 'Detail Produk'],
    ['/production/batches', 'Production'], ['/production/batches/new', 'Mulai Batch'], ['/production/batches/b1', 'Detail Batch'],
    ['/production/hpp', 'Simulasi Produk Baru'], ['/hpp', 'Simulasi Produk Baru'], ['/production/hpp/recipe-simulation', 'Simulasi Produk Baru'],
    ['/production/hpp/production-simulation', 'Simulasi Produksi & Restock'], ['/production/overheads', 'Biaya Overhead'],
    ['/sales/pos', 'Point of Sale'], ['/sales/history', 'Riwayat Transaksi'], ['/sales/customers', 'Pelanggan'],
    ['/settings/store', 'Pengaturan Toko'], ['/settings/role', 'Manajemen Role'], ['/settings', 'Pengaturan Akun'],
    ['/subscription', 'Paket & Langganan'], ['/subscription/invoices', 'Paket & Langganan'], ['/unknown', 'HPP Manager'],
  ])('maps %s to %s', (path, expected) => { expect(getActiveMenuTitle(path)).toBe(expected) })
})

describe('navigation permissions and route boundaries', () => {
  it('prunes restricted modules without mutating the navigation tree', () => {
    const original = JSON.stringify(NAVIGATION)
    const result = filterNavigation(NAVIGATION, () => false)
    expect(result.map(item => item.id)).toEqual(['administration'])
    expect(result[0].children?.map(item => item.id)).toEqual(['subscription', 'account-settings'])
    expect(JSON.stringify(NAVIGATION)).toBe(original)
  })
  it.each([
    ['/production/hpp/recipe-simulation/', ['production', 'hpp', 'recipe-simulation']],
    ['/inventory/purchase-orders/p1/edit', ['inventory', 'purchase']],
    ['/inventory/stocks/s1', ['inventory', 'stocks']],
    ['/inventory/stocks-other', []],
    ['/settings/store', ['administration', 'store-settings']],
  ])('finds the active branch for %s', (path, ids) => {
    expect([...getActiveNavigationIds(NAVIGATION, String(path))]).toEqual(ids)
  })
})

describe('inventory unit conversion', () => {
  it.each([[' gram ', 'g'], ['Kilogram', 'kg'], ['LITRE', 'l'], ['liter', 'l'], ['butir', 'butir']])('normalizes %s', (input, expected) => { expect(normalizeUnit(input)).toBe(expected) })
  it('offers only compatible dimensions', () => {
    expect(getCompatibleUnits('kg')).toEqual(['g', 'kg'])
    expect(getCompatibleUnits('L')).toEqual(['ml', 'l'])
    expect(getCompatibleUnits('butir')).toEqual(['butir'])
    expect(getQuantityInBaseUnit(1, 'kg', 'ml')).toBeNaN()
  })
  it('preserves purchasing and recipe costs across base units', () => {
    expect(getQuantityInBaseUnit(2, 'kg', 'g')).toBe(2000)
    expect(getQuantityInBaseUnit(250, 'ml', 'liter')).toBe(0.25)
    expect(getQuantityInBaseUnit(2, 'kemasan', 'kg', 25)).toBe(50)
    expect(getQuantityInBaseUnit(3, '', 'butir')).toBe(3)
    expect(getCostPerRecipeUnit(15000, 'g', 'kg') * 125).toBe(1875)
  })
})

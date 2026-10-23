import { test, expect } from '@playwright/test'

test('purchase list filters, refresh recovery, actions and responsive layouts', async ({ page }) => {
  const permissions = ['purchases:read', 'purchases:request', 'purchases:process']
  const records = ['PURCHASE_REQUEST', 'PURCHASE_ORDER', 'COMPLETED', 'REJECTED', 'CANCELLED'].map((status, index) => ({
    id: `po-${index}`, po_number: `PO-UI-00${index}`, category: 'PURCHASE_ORDER', status,
    supplier_name: 'Pemasok Bahan Baku Cabang Jakarta', supplier_id: 'supplier-1',
    order_date: '2026-10-21T08:00:00Z', created_at: '2026-10-21T08:00:00Z',
    receipt_status: index === 2 ? 'RECEIVED' : 'NOT_RECEIVED', payment_status: index === 2 ? 'PAID' : 'UNPAID',
    total_amount: 50000, items: [{ id: 'item-1', stock_id: 'stock-1', stock_name: 'Tepung Terigu Protein Tinggi', quantity: 2, base_unit: 'kg', unit_price: 25000, total_price: 50000 }],
  }))
  let failList = false
  let failSummary = false
  const requests: URL[] = []
  await page.addInitScript(({ permissions }) => {
    localStorage.setItem('token', 'purchase-ui-test')
    localStorage.setItem('auth-storage', JSON.stringify({ state: {
      user: { id: 'test-user', name: 'Tester', email: 'ui@example.com' }, token: 'purchase-ui-test',
      activeStoreId: 'test-store', activeStoreName: 'Test Store', permissions,
    }, version: 0 }))
  }, { permissions })
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url())
    const path = url.pathname
    let data: unknown = []
    if (path.endsWith('/stores')) data = [{ id: 'test-store', name: 'Test Store', status: 'online' }]
    else if (path.endsWith('/permissions/me')) data = { role: 'STAFF', permissions }
    else if (path.endsWith('/subscription/usage')) data = { effective_tier: 'FREE', status: 'ACTIVE', quotas: {}, features: {} }
    else if (path.endsWith('/suppliers')) data = [{ id: 'supplier-1', name: 'Pemasok Bahan Baku Cabang Jakarta' }]
    else if (path.endsWith('/purchase-orders/summary')) {
      if (failSummary) return route.fulfill({ status: 500, json: { success: false, message: 'Summary unavailable' } })
      data = { total_orders: 5, request_count: 1, order_count: 1, completed_count: 1, total_completed_amount: 50000 }
    } else if (path.endsWith('/purchase-orders')) {
      requests.push(url)
      if (failList) return route.fulfill({ status: 500, json: { success: false, message: 'Purchases unavailable' } })
      const items = records.filter(record =>
        (!url.searchParams.get('status') || record.status === url.searchParams.get('status')) &&
        (!url.searchParams.get('search') || record.po_number.includes(url.searchParams.get('search')!)) &&
        (!url.searchParams.get('receipt_status') || record.receipt_status === url.searchParams.get('receipt_status')) &&
        (!url.searchParams.get('payment_status') || record.payment_status === url.searchParams.get('payment_status')) &&
        (!url.searchParams.get('category') || record.category === url.searchParams.get('category')))
      data = { items, total: items.length, page: 1, limit: 10, total_pages: 1 }
    }
    await route.fulfill({ json: { success: true, data } })
  })

  await page.goto('/inventory/purchase-orders')
  await expect(page.getByRole('tab', { name: 'Kanban', exact: true })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('tab', { name: 'List', exact: true }).click()
  await expect(page.getByRole('table', { name: 'Daftar pembelian' })).toBeVisible()
  const beforeRefresh = requests.length
  await page.getByRole('button', { name: 'Refresh pembelian' }).click()
  await expect.poll(() => requests.length).toBeGreaterThan(beforeRefresh)
  await page.getByRole('button', { name: /Menunggu persetujuan/ }).click()
  await expect(page.getByRole('link', { name: 'PO-UI-000', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'PO-UI-001', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Reset filter', exact: true }).click()
  await page.getByRole('combobox', { name: 'Penerimaan', exact: true }).selectOption('RECEIVED')
  await expect(page.getByRole('link', { name: 'PO-UI-002', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'PO-UI-000', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Reset filter', exact: true }).click()
  await page.getByRole('button', { name: 'Urutkan', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Nominal Tertinggi', exact: true }).click()
  await expect.poll(() => requests.at(-1)?.searchParams.get('sort_by')).toBe('amount-desc')
  await page.getByRole('button', { name: 'Reset filter', exact: true }).click()
  await page.getByRole('tab', { name: 'Kanban', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Kanban', exact: true })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('button', { name: 'Setujui (PO)', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  await page.getByRole('textbox', { name: 'Cari pembelian', exact: true }).fill('missing')
  await expect(page.getByRole('heading', { name: 'Tidak ada pesanan yang cocok' })).toBeVisible()
  await page.getByRole('button', { name: 'Reset filter', exact: true }).click()
  await page.getByRole('tab', { name: 'List', exact: true }).click()

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect(page.getByRole('link', { name: 'PO-UI-000', exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.getByRole('button', { name: 'Aksi untuk PO-UI-000', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Setujui (Jadikan PO)' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.screenshot({ path: `test-results/purchase-${width}.png`, fullPage: true })
  }

  failList = true
  await page.getByRole('button', { name: 'Refresh pembelian' }).click()
  await expect(page.getByRole('heading', { name: 'Gagal memuat pembelian' })).toBeVisible({ timeout: 15000 })
  failList = false
  await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
  await expect(page.getByRole('table', { name: 'Daftar pembelian' })).toBeVisible()
  failSummary = true
  await page.getByRole('button', { name: 'Refresh pembelian' }).click()
  await expect(page.getByText('Ringkasan pembelian gagal dimuat.')).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('Ringkasan belum tersedia', { exact: true })).toBeVisible()
  failSummary = false
  await page.getByRole('button', { name: 'Muat ulang ringkasan', exact: true }).click()
  await expect(page.getByText('Ringkasan pembelian gagal dimuat.')).toBeHidden()
})

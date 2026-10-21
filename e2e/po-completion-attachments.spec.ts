import { test, expect, type Page } from '@playwright/test'

async function setupPurchase(page: Page, options = { failUploadAt: 0, holdUploads: false }) {
  const state = { uploads: 0, signedRequests: 0, completed: [] as Record<string, unknown>[] }
  let releaseUpload = () => {}
  const uploadReady = new Promise<void>((resolve) => { releaseUpload = resolve })
  let order = {
    id: 'attachment-po', po_number: 'PO-ATTACHMENTS-001', category: 'PURCHASE_ORDER', status: 'PURCHASE_ORDER',
    supplier_id: 'supplier-1', supplier_name: 'Supplier Test', created_by_user_id: 'attachment-user', created_by_name: 'Tester',
    order_date: '2026-10-21T08:00:00Z', created_at: '2026-10-21T08:00:00Z', total_amount: 50000,
    attachment_url: 'https://files.example.com/original.pdf', attachment_name: 'Penawaran-awal.pdf',
    completion_attachments: [] as { url: string; name: string }[],
    items: [{ id: 'item-1', stock_id: 'stock-1', stock_name: 'Tepung', quantity: 2, base_unit: 'kg', unit_price: 25000, total_price: 50000 }], logs: [],
  }
  await page.addInitScript(() => {
    localStorage.setItem('token', 'attachment-test')
    localStorage.setItem('auth-storage', JSON.stringify({ state: {
      user: { id: 'attachment-user', name: 'Tester', email: 'attachment@example.com' }, token: 'attachment-test',
      activeStoreId: 'attachment-store', activeStoreName: 'Attachment Test Store',
    }, version: 0 }))
    sessionStorage.removeItem('perm-cache')
  })
  await page.route('**/__attachment-upload/*', async route => {
    state.uploads++
    if (options.holdUploads) await uploadReady
    await route.fulfill({ status: state.uploads === options.failUploadAt ? 500 : 200, body: '' })
  })
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    let data: unknown = []
    if (path.endsWith('/stores')) data = [{ id: 'attachment-store', name: 'Attachment Test Store', status: 'online' }]
    else if (path.endsWith('/permissions/me')) data = { role: 'STAFF', permissions: ['purchases:read', 'purchases:process'] }
    else if (path.endsWith('/subscription/usage')) data = { effective_tier: 'FREE', status: 'ACTIVE', quotas: {}, features: {}, is_in_grace_period: false }
    else if (path.endsWith('/suppliers')) data = [{ id: 'supplier-1', name: 'Supplier Test' }]
    else if (path.endsWith('/completion-upload-presigned-url')) {
      state.signedRequests++
      const request = route.request().postDataJSON()
      data = { upload_url: `http://localhost:5173/__attachment-upload/${state.signedRequests}`, public_url: `https://files.example.com/${request.filename}` }
    } else if (path.endsWith('/attachment-po/complete')) {
      const body = route.request().postDataJSON()
      state.completed.push(body)
      order = { ...order, status: 'COMPLETED', completion_attachments: body.completion_attachments || [] }
      data = order
    } else if (path.endsWith('/purchase-orders/attachment-po')) data = order
    await route.fulfill({ json: { success: true, data } })
  })
  await page.goto('/inventory/purchase-orders/attachment-po')
  await page.getByRole('button', { name: 'Set Harga & Selesaikan PO', exact: true }).click()
  return { state, releaseUpload: () => { options.holdUploads = false; releaseUpload() } }
}

const pdf = (name: string) => ({ name, mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test document') })

test('completion accepts multiple documents, removal and reload without replacing the original', async ({ page }) => {
  const { state } = await setupPurchase(page)
  const dialog = page.getByRole('dialog')
  const input = dialog.locator('input[type=file]')
  await input.setInputFiles([pdf('Faktur.pdf'), pdf('Tanda-terima.pdf')])
  await expect(dialog.getByText('2 dari 10 dokumen terlampir', { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: 'Hapus lampiran Tanda-terima.pdf', exact: true }).click()
  await expect(dialog.getByText('1 dari 10 dokumen terlampir', { exact: true })).toBeVisible()
  await input.setInputFiles(pdf('Tanda-terima.pdf'))
  await expect(dialog.getByText('2 dari 10 dokumen terlampir', { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: 'Konfirmasi & Masukkan ke Stok' }).click()
  await expect(dialog).toBeHidden()
  expect(state.completed[0].completion_attachments).toEqual([
    { url: 'https://files.example.com/Faktur.pdf', name: 'Faktur.pdf' },
    { url: 'https://files.example.com/Tanda-terima.pdf', name: 'Tanda-terima.pdf' },
  ])
  await page.reload()
  for (const name of ['Penawaran-awal.pdf', 'Faktur.pdf', 'Tanda-terima.pdf']) {
    await expect(page.getByRole('link', { name: `Buka / Unduh ${name}`, exact: true })).toBeVisible()
  }
})

test('completion without documents remains optional', async ({ page }) => {
  const { state } = await setupPurchase(page)
  await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi & Masukkan ke Stok' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  expect(state.completed[0].completion_attachments).toEqual([])
  expect(state.signedRequests).toBe(0)
  await expect(page.getByRole('link', { name: 'Buka / Unduh Penawaran-awal.pdf', exact: true })).toBeVisible()
})

test('invalid batches and excess files are rejected before uploading', async ({ page }) => {
  const { state } = await setupPurchase(page)
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[type=file]').setInputFiles([pdf('Faktur.pdf'), { name: 'Program.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('invalid') }])
  await expect(dialog.getByRole('alert')).toContainText('Pilih dokumen PDF')
  expect(state.uploads).toBe(0)
  await dialog.locator('input[type=file]').setInputFiles(Array.from({ length: 11 }, (_, index) => pdf(`Faktur-${index}.pdf`)))
  await expect(dialog.getByRole('alert')).toContainText('Maksimal 10 dokumen')
  expect(state.signedRequests).toBe(0)
})

test('upload failure keeps successful documents so remaining files can be retried', async ({ page }) => {
  const options = { failUploadAt: 2, holdUploads: false }
  await setupPurchase(page, options)
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[type=file]').setInputFiles([pdf('Faktur.pdf'), pdf('Tanda-terima.pdf')])
  await expect(dialog.getByRole('alert')).toContainText('Upload dokumen gagal')
  await expect(dialog.getByText('1 dari 10 dokumen terlampir', { exact: true })).toBeVisible()
  options.failUploadAt = 0
  await dialog.locator('input[type=file]').setInputFiles(pdf('Tanda-terima.pdf'))
  await expect(dialog.getByText('2 dari 10 dokumen terlampir', { exact: true })).toBeVisible()
})

test('uploading blocks completion and dismissal until files finish', async ({ page }) => {
  const { releaseUpload } = await setupPurchase(page, { failUploadAt: 0, holdUploads: true })
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[type=file]').setInputFiles(pdf('Faktur.pdf'))
  await expect(dialog.getByRole('button', { name: 'Konfirmasi & Masukkan ke Stok' })).toBeDisabled()
  await expect(dialog.getByRole('button', { name: 'Batal', exact: true })).toBeDisabled()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeVisible()
  releaseUpload()
  await expect(dialog.getByText('1 dari 10 dokumen terlampir', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Konfirmasi & Masukkan ke Stok' })).toBeEnabled()
})

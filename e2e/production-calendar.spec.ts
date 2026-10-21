import { test } from '@playwright/test';

test('production calendar: full month, navigation, details, status legend and mobile', async ({ page }) => {
  const storeId = '11111111-1111-4111-8111-111111111111';
  const productId = '22222222-2222-4222-8222-222222222222';
  const statuses = ['DRAFT', 'QUEUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'VOID'];
  const requests: { month: string; statuses: string | null; store: string | undefined }[] = [];
  await page.addInitScript(({ storeId }) => {
    localStorage.setItem('token', 'calendar-test');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { user: { id: 'test-user', name: 'Tester', email: 'calendar@example.com' }, token: 'calendar-test', activeStoreId: storeId, activeStoreName: 'Calendar Bakery', permissions: [] }, version: 0 }));
  }, { storeId });
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    let data: unknown = [];
    if (url.pathname.endsWith('/stores')) data = [{ id: storeId, name: 'Calendar Bakery', timezone: 'Asia/Jakarta', status: 'online' }];
    else if (url.pathname.endsWith('/permissions')) data = { role: 'STORE_OWNER', permissions: ['menu:recipes', 'production:read', 'production:write', 'production:void'] };
    else if (url.pathname.endsWith('/production/calendar')) {
      const month = url.searchParams.get('month') || '2026-10';
      requests.push({ month, statuses: url.searchParams.get('statuses'), store: route.request().headers()['x-store-id'] });
      const totalDays = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate();
      const selected = url.searchParams.get('statuses');
      const allItems = Array.from({ length: 30 }, (_, i) => ({ id: `33333333-3333-4333-8333-${String(i).padStart(12, '0')}`, batch_number: `B-${month}-TEST-${i}`, product_id: productId, product_name: 'Roti Test ' + i, product_unit: 'pcs', status: statuses[i % 6], started_at: month + '-19T03:00:00Z', ended_at: month + '-20T03:00:00Z', start_date: month + '-19', end_date: month + '-20', qty_planned: '10', qty_actual: '9', total_cost: '100000', hpp_per_unit: '11111.1111' }));
      const items = selected ? allItems.filter(item => selected.split(',').includes(item.status)) : allItems;
      data = { month, timezone: 'Asia/Jakarta', today: '2026-10-19', summary: { total: items.length, completed_cost: '500000', by_status: Object.fromEntries(statuses.map(status => [status, items.filter(item => item.status === status).length])) }, items, days: Array.from({ length: totalDays }, (_, i) => ({ date: month + '-' + String(i + 1).padStart(2, '0'), item_ids: i === 18 || i === 19 ? items.map(item => item.id) : [] })) };
    } else if (/\/production\/[0-9a-f-]+$/.test(url.pathname)) {
      data = { id: url.pathname.split('/').pop(), store_id: storeId, product_id: productId, batch_number: 'B-DETAIL-TEST', status: 'COMPLETED', product: { name: 'Roti Test Detail', unit: 'pcs', selling_price: '15000' }, started_at: '2026-09-19T03:00:00Z', qty_planned: '10', qty_actual: '9', bom_cost: '100000', total_cost: '100000', hpp_per_unit: '11111.1111' };
    } else if (url.pathname.endsWith('/subscription')) data = { tier: 'FREE', status: 'ACTIVE', current_period_end: '2027-01-01' };
    else if (url.pathname.endsWith('/production')) data = { items: [], total: 0, page: 1, total_pages: 1, page_size: 20 };
    await route.fulfill({ json: { success: true, data }, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.goto('/production/batches');
  await page.getByRole('heading', { name: 'Oktober 2026', exact: true }).waitFor();
  if (await page.getByRole('tab', { name: 'Kalender' }).getAttribute('aria-selected') !== 'true') throw new Error('Calendar is not the default');
  if (await page.getByLabel('Dasar tanggal', { exact: true }).count()) throw new Error('Date basis filter should be removed');
  await page.getByRole('heading', { name: 'Produksi', exact: true }).first().waitFor();
  const span = page.locator('[data-calendar-batch][data-span="2"]').first();
  await span.waitFor();
  const rectangle = await span.boundingBox();
  const dateCell = await page.getByRole('button', { name: /19 Oktober 2026, 30 batch/ }).boundingBox();
  if (!rectangle || !dateCell || rectangle.width < dateCell.width * 1.8) throw new Error('Two-day batch does not span two date columns');
  if (await page.getByLabel('Legend status produksi').locator('span.inline-flex').count() !== 6) throw new Error('Missing status legend');
  if (await page.getByRole('button', { name: /batch/ }).count() < 31) throw new Error('Missing month days');
  if (await page.getByRole('region', { name: 'Produksi tanggal terpilih' }).getByRole('link').count() !== 30) throw new Error('Month truncated at 20 records');
  await page.getByRole('button', { name: 'Bulan sebelumnya' }).click();
  await page.getByRole('heading', { name: 'September 2026', exact: true }).waitFor();
  await page.getByRole('button', { name: /19 September 2026, 30 batch/ }).click();
  await page.getByRole('region', { name: 'Produksi tanggal terpilih' }).getByRole('link').first().click();
  await page.getByText('B-DETAIL-TEST', { exact: true }).first().waitFor();
  await page.getByRole('link', { name: 'Daftar Batch', exact: true }).click();
  await page.getByRole('heading', { name: 'September 2026', exact: true }).waitFor();
  if (new URL(page.url()).searchParams.get('day') !== '2026-09-19') throw new Error('Lost selected date returning from detail');
  await page.getByRole('button', { name: 'Bulan berikutnya' }).click();
  await page.getByRole('heading', { name: 'Oktober 2026', exact: true }).waitFor();
  const filteredResponse = page.waitForResponse(response => response.url().includes('statuses=VOID'));
  await page.getByLabel('Status', { exact: true }).selectOption('VOID');
  await filteredResponse;
  await page.getByRole('button', { name: /19 Oktober 2026, 5 batch/ }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) throw new Error('Mobile horizontal overflow');
  await page.getByRole('button', { name: /19 Oktober 2026, 5 batch/ }).click();
  if (await page.getByRole('region', { name: 'Produksi tanggal terpilih' }).getByRole('link').count() !== 5) throw new Error('Mobile daily items missing');
  const result = { requests, mobileOverflow: false, checked: ['calendar default', '31 days', '30 records', 'six status legend', 'previous month fetch', 'batch detail', 'return context', 'cached month refetch', 'status filtering', 'mobile'] };
  if (requests.some(request => request.store !== storeId)) throw new Error('Missing tenant header');
  if (requests.filter(request => request.month === '2026-10').length < 2) throw new Error('Month return did not refetch');
  if (result.requests.length === 0) throw new Error('No monthly requests');
  await page.route('**/production/calendar?**', route => route.fulfill({ status: 500, json: { success: false, message: 'Calendar unavailable' } }));
  await page.getByRole('button', { name: 'Refresh kalender' }).click();
  await page.getByRole('alert').getByText('Gagal memuat histori produksi').waitFor();
  await page.route('**/production/calendar?**', route => route.fulfill({ json: { success: true, data: {
    month: '2026-10', timezone: 'Asia/Jakarta', today: '2026-10-19', items: [],
    summary: { total: 0, completed_cost: '0', by_status: Object.fromEntries(statuses.map(status => [status, 0])) },
    days: Array.from({ length: 31 }, (_, index) => ({ date: `2026-10-${String(index + 1).padStart(2, '0')}`, item_ids: [] })),
  } } }));
  await page.getByRole('button', { name: 'Coba lagi' }).click();
  await page.getByText('Tidak ada produksi yang cocok dengan filter pada bulan ini.', { exact: true }).waitFor();
  if (await page.getByRole('alert').count()) throw new Error('Empty month shown as an error');
  await page.getByRole('tab', { name: 'Daftar', exact: true }).click();
  await page.getByRole('tab', { name: 'Daftar', exact: true, selected: true }).waitFor();
});

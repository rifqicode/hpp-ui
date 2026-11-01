import { test, expect, type Locator, type Page } from '@playwright/test';

test.use({
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
  channel: 'chromium',
  hasTouch: true,
});

async function pan(page: Page, target: Locator, distance = 200) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error('The scroll surface is not visible.');
  const x = box.x + Math.min(box.width - 10, 230);
  const y = box.y + Math.min(box.height / 2, 25);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - distance, y, { steps: 12 });
}

for (const width of [390, 1280]) {
  test(`purchase mouse panning preserves card actions and native gestures at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const records = ['PURCHASE_REQUEST', 'PURCHASE_ORDER', 'COMPLETED'].map((status, index) => ({
      id: `drag-${index}`,
      po_number: `PO-DRAG-00${index + 1}`,
      category: 'PURCHASE_ORDER',
      status,
      supplier_id: 'supplier-1',
      supplier_name: 'Supplier Test',
      order_date: '2026-11-01T08:00:00Z',
      created_at: '2026-11-01T08:00:00Z',
      receipt_status: index === 2 ? 'RECEIVED' : 'NOT_RECEIVED',
      payment_status: index === 2 ? 'PAID' : 'UNPAID',
      total_amount: 50000,
      items: [
        {
          id: 'item-1',
          stock_id: 'stock-1',
          stock_name: 'Tepung',
          quantity: 2,
          base_unit: 'kg',
          unit_price: 25000,
          total_price: 50000,
        },
      ],
      logs: [],
    }));
    await page.addInitScript(() => {
      localStorage.setItem('token', 'drag-scroll-test');
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: { id: 'drag-user', name: 'Tester', email: 'drag@example.com' },
            token: 'drag-scroll-test',
            activeStoreId: 'drag-store',
            activeStoreName: 'Drag Store',
          },
          version: 0,
        }),
      );
    });
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      let data: unknown = [];
      if (url.pathname.endsWith('/stores'))
        data = [{ id: 'drag-store', name: 'Drag Store', status: 'online' }];
      else if (url.pathname.endsWith('/permissions/me'))
        data = {
          role: 'STAFF',
          permissions: ['purchases:read', 'purchases:request', 'purchases:process'],
        };
      else if (url.pathname.endsWith('/subscription/usage'))
        data = { effective_tier: 'FREE', status: 'ACTIVE', quotas: {}, features: {} };
      else if (url.pathname.endsWith('/suppliers'))
        data = [{ id: 'supplier-1', name: 'Supplier Test' }];
      else if (url.pathname.endsWith('/purchase-orders/summary'))
        data = {
          total_orders: 3,
          request_count: 1,
          order_count: 1,
          invoice_count: 0,
          completed_count: 1,
          total_completed_amount: 50000,
        };
      else if (url.pathname.endsWith('/purchase-orders')) {
        const column = url.searchParams.get('kanban_column');
        const statuses: Record<string, string> = {
          pengajuan: 'PURCHASE_REQUEST',
          dipesan: 'PURCHASE_ORDER',
          selesai: 'COMPLETED',
        };
        const items = column
          ? records.filter(record => record.status === statuses[column])
          : records;
        data = { items, total: items.length, page: 1, limit: 10, total_pages: 1 };
      } else if (/\/purchase-orders\/drag-\d+$/.test(url.pathname))
        data = records.find(record => url.pathname.endsWith(record.id));
      await route.fulfill({ json: { success: true, data } });
    });
    await page.goto('/inventory/purchase-orders');
    const board = page.getByRole('region', { name: 'Kanban pembelian', exact: true });
    await expect(board.getByText('PO-DRAG-001', { exact: true })).toBeVisible();
    await pan(page, board.getByRole('heading', { name: 'Purchase Request', exact: true }));
    await expect(board).toHaveAttribute('data-dragging', 'true');
    await page.mouse.up();
    await expect.poll(() => board.evaluate(element => element.scrollLeft)).toBeGreaterThan(100);
    await expect(board).not.toHaveAttribute('data-dragging');
    await expect(page).toHaveURL(/\/inventory\/purchase-orders$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await board.evaluate(element => {
      element.scrollLeft = 0;
    });

    if (width === 390) {
      const heading = board.getByRole('heading', { name: 'Purchase Request', exact: true });
      const box = await heading.boundingBox();
      if (!box) throw new Error('Column heading is not visible.');
      const session = await page.context().newCDPSession(page);
      const x = box.x + box.width - 5;
      const y = box.y + box.height / 2;
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y }],
      });
      for (let step = 1; step <= 8; step++)
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: x - step * 15, y }],
        });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect.poll(() => board.evaluate(element => element.scrollLeft)).toBeGreaterThan(40);
      await session.detach();
      await board.evaluate(element => {
        element.scrollLeft = 0;
      });
    }

    await board.getByRole('button', { name: 'Setujui (PO)', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    if (width === 1280) {
      const card = board.locator('[draggable="true"]').filter({ hasText: 'PO-DRAG-001' });
      await card.dragTo(board.locator(':scope > div').nth(1), {
        targetPosition: { x: 100, y: 100 },
      });
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toBeHidden();
      await expect(board).not.toHaveAttribute('data-dragging');
    }

    await page.getByRole('tab', { name: 'List', exact: true }).click();
    const tableArea = page.getByRole('region', { name: 'Tabel pembelian', exact: true });
    await expect(tableArea.getByRole('table', { name: 'Daftar pembelian' })).toBeVisible();
    const overflows = await tableArea.evaluate(
      element => element.scrollWidth > element.clientWidth,
    );
    if (overflows) {
      await pan(
        page,
        tableArea.getByRole('columnheader', { name: 'No. Pengajuan', exact: true }),
        100,
      );
      await page.mouse.up();
      await expect.poll(() => tableArea.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
      await tableArea.evaluate(element => {
        element.scrollLeft = 0;
      });
    }
    await tableArea.getByRole('link', { name: 'PO-DRAG-001', exact: true }).click();
    await expect(page).toHaveURL(/\/inventory\/purchase-orders\/drag-0$/);
  });
}

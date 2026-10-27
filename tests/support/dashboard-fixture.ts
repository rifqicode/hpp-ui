import type { DashboardOverview } from '@/features/dashboard/types/overview';
import { store } from './fixtures';

export function dashboardFixture(): DashboardOverview {
  return {
    store_id: store.id, timezone: 'Asia/Jakarta', currency: 'IDR', as_of: '2026-10-22T07:00:00Z',
    range: { start_date: '2026-10-16', end_date: '2026-10-22' }, comparison_range: null, profit_status: 'ok',
    sales: { status: 'ok', data: { current: { net_sales: '135000', gross_profit: '85000', margin_pct: '62.96', average_order: '67500', transactions: 2 }, previous: null,
      trend: [{ date: '2026-10-21', net_sales: '50000', transactions: 1 }, { date: '2026-10-22', net_sales: '85000', transactions: 1 }] } },
    products: { status: 'ok', data: [{ product_id: 'product-1', variant_id: 'variant-product-1', name: 'Roti Coklat', unit: 'pcs', quantity: '3', net_sales: '135000' }] },
    inventory: { status: 'ok', data: { count: 1, items: [{ id: 'stock-1', name: 'Tepung', kind: 'OUT', quantity: '0', unit: 'g' }] } },
    purchases: { status: 'ok', data: { count: 0, items: [] } }, production: { status: 'ok', data: { count: 0, items: [] } },
  };
}

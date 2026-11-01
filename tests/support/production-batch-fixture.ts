import type { ProductionHead, ProductionLogItem } from '@/features/production/services/production-batch-service';

export const productionLog = (overrides: Partial<ProductionLogItem> = {}): ProductionLogItem => ({
  id: 'log-1', variant_id: 'variant-1', status: 'IN_PROGRESS', target_quantity: '10', good_quantity: '0', waste_quantity: '0', hpp_per_unit: '0', total_cost: '0', bom_cost: '100',
  started_at: '2026-10-31T03:00:00Z', inventory_consumed_at: '2026-10-31T03:00:00Z',
  recipe_snapshot: { product_name: 'Brownies', variant_name: 'Original', product_unit: 'pcs', items: [{ stock_id: 'flour', stock_name: 'Tepung', unit: 'kg', quantity: '0.03' }], overheads: [{ name: 'Gas', amount: '20000' }] },
  consumptions: [{ stock_id: 'flour', quantity: '0.1', subtotal_cost: '10' }, { stock_id: 'flour', quantity: '0.2', subtotal_cost: '20' }],
  ...overrides,
});
export const productionHead = (overrides: Partial<ProductionHead> = {}): ProductionHead => ({
  id: 'head-1', batch_number: 'PB-20261031-000001', source: 'MANUAL', status: 'IN_PROGRESS', notes: '', target_completed_at: '2026-10-31T04:00:00Z', queued_at: '2026-10-31T02:55:00Z', started_at: '2026-10-31T03:00:00Z', completed_at: null, created_at: '2026-10-31T02:55:00Z', order_context_snapshot: {}, logs: [productionLog()], ...overrides,
});

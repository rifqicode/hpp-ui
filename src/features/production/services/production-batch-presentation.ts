import type { ProductionBatch } from '../types';
import type { ProductionHead } from './production-batch-service';
import { mapBackendLogToProductionBatch } from './production-service';

export function productionCosts(batch: ProductionBatch) {
  const material =
    batch.hasActualConsumptions || batch.stockCost > 0
      ? batch.stockCost
      : batch.ingredients.reduce((sum, item) => sum + item.cost, 0);
  const overhead =
    batch.status === 'COMPLETED'
      ? (batch.overheads ?? []).reduce((sum, item) => sum + Number(item.amount || 0), 0) +
        Number(batch.laborCost || 0)
      : 0;
  return {
    material,
    overhead,
    total: batch.totalCost && batch.totalCost > 0 ? batch.totalCost : material + overhead,
  };
}

export function presentProductionHead(head: ProductionHead): ProductionBatch {
  const items = head.logs.map(mapBackendLogToProductionBatch);
  const first = items[0];
  const sameUnit = items.every(item => item.productUnit === first?.productUnit);
  return {
    ...first,
    id: head.id,
    batchNumber: head.batch_number,
    source: head.source,
    orderContext: head.order_context_snapshot,
    saleId: head.sale_id,
    status: head.status,
    notes: head.notes,
    productName: items.length === 1 ? first.productName : `${items.length} varian produksi`,
    productionItems: items,
    targetQuantity: sameUnit
      ? items.reduce((sum, item) => sum + item.targetQuantity, 0)
      : items.length,
    goodQuantity: sameUnit
      ? items.reduce((sum, item) => sum + (item.goodQuantity || 0), 0)
      : undefined,
    wasteQuantity: sameUnit
      ? items.reduce((sum, item) => sum + (item.wasteQuantity || 0), 0)
      : undefined,
    productUnit: sameUnit ? first?.productUnit : 'varian',
    stockCost: items.reduce((sum, item) => sum + item.stockCost, 0),
    totalCost: items.reduce((sum, item) => sum + (item.totalCost || 0), 0),
    hppPerUnit: items.length === 1 ? first.hppPerUnit : undefined,
    startedAt: head.started_at || head.queued_at || head.created_at,
    completedAt: head.completed_at || undefined,
    targetCompletedAt: head.target_completed_at,
  };
}

import apiClient from '../../../lib/api-client';
import type {
  ProductionBatch,
  ProductionCalendarFilters,
  ProductionCalendarResponse,
  StartProductionInput,
  CompleteProductionInput,
  ConsumedIngredient,
  ProductionPreviewResponse,
} from '../types';

function mapBackendLogToProductionBatch(log: any): ProductionBatch {
  if (!log) return {} as ProductionBatch;

  const snapshot = log.recipe_snapshot;
  const hasActualConsumptions = Array.isArray(log.consumptions) && log.consumptions.length > 0;

  // Map ingredients from consumptions or snapshot
  const ingredients: ConsumedIngredient[] = [];
  if (hasActualConsumptions) {
    for (const c of log.consumptions) {
      const snapshotItem = snapshot?.items?.find((item: { stock_id: string }) => item.stock_id === c.stock_id);
      ingredients.push({
        stockId: c.stock_id,
        stockName: snapshotItem?.stock_name || c.stock?.name || 'Bahan',
        baseUnit: snapshotItem?.unit || c.stock?.base_unit || 'unit',
        quantity: Number(c.quantity || 0),
        cost: Number(c.subtotal_cost || 0),
      });
    }
  } else if (log.recipe_snapshot && Array.isArray(log.recipe_snapshot.items)) {
    const plannedQty = Number(log.qty_planned || log.target_quantity || 1);
    const rawYield = Number(snapshot.yield_qty);
    const yieldQty = rawYield > 0 ? rawYield : 1;
    const wastePct = Math.max(0, Number(snapshot.waste_pct) || 0);
    const scale = (plannedQty / yieldQty) * (1 + wastePct);
    for (const it of snapshot.items) {
      const q = Number(it.quantity || 0) * scale;
      ingredients.push({
        stockId: it.stock_id,
        stockName: it.stock_name || 'Bahan',
        baseUnit: it.unit || 'unit',
        quantity: q,
        cost: Number(it.cost_per_unit || 0) * q,
      });
    }
  }

  // Map overhead breakdown
  const overheadBreakdown = { labor: 0, energy: 0, packaging: 0, other: 0 };
  if (Array.isArray(log.overheads) && log.overheads.length > 0) {
    for (const oh of log.overheads) {
      const amt = Number(oh.amount || 0);
      const name = (oh.name || '').toLowerCase();
      if (name.includes('tenaga') || name.includes('labor')) {
        overheadBreakdown.labor += amt;
      } else if (name.includes('listrik') || name.includes('energy') || name.includes('gas')) {
        overheadBreakdown.energy += amt;
      } else if (name.includes('kemasan') || name.includes('pack')) {
        overheadBreakdown.packaging += amt;
      } else {
        overheadBreakdown.other += amt;
      }
    }
  }

  return {
    id: log.id,
    batchNumber: log.batch_number || log.batchNumber || 'B-UNKNOWN',
    storeId: log.store_id,
    saleId: log.sale_id || log.saleId || undefined,
    saleItemId: log.sale_item_id || log.saleItemId || undefined,
    productId: log.product_id,
    productName: snapshot?.product_name || log.product?.name || 'Produk',
    productCategory: snapshot?.product_category ?? (log.product?.category_model?.name || log.product?.category || 'Umum'),
    productUnit: snapshot?.product_unit ?? (log.product?.unit || 'pcs'),
    sellingPrice: Number(snapshot?.selling_price ?? log.product?.selling_price ?? 0),
    status: log.status,
    targetQuantity: Number(log.qty_planned || log.target_quantity || 0),
    goodQuantity: Number(log.qty_actual || log.good_quantity || 0),
    wasteQuantity: Number(log.waste_quantity || 0),
    stockCost: Number(log.bom_cost || log.stock_cost || 0),
    overheadCost: Number(log.overhead_cost || 0),
    overheadBreakdown,
    totalCost: Number(log.total_cost || 0),
    hppPerUnit: Number(log.hpp_per_unit || 0),
    startedAt: log.started_at,
    completedAt: log.completed_at || undefined,
    voidedAt: log.voided_at || undefined,
    voidReason: log.void_reason || undefined,
    notes: log.notes || '',
    ingredients,
    hasActualConsumptions,
    overheads: Array.isArray(log.overheads)
      ? log.overheads.map((o: any) => ({
          id: o.id,
          overheadTypeId: o.overhead_type_id || o.overheadTypeId,
          name: o.name,
          amount: Number(o.amount || 0),
        }))
      : undefined,
    recipeSnapshot: log.recipe_snapshot,
  };
}

export const productionService = {
  getCalendar: async (filters: ProductionCalendarFilters, storeId: string, signal?: AbortSignal): Promise<ProductionCalendarResponse> => {
    const response = await apiClient.get<ProductionCalendarResponse>('/production/calendar', {
      params: filters,
      headers: { 'X-Store-ID': storeId },
      signal,
    });
    return response.data;
  },
  getBatches: async (): Promise<ProductionBatch[]> => {
    const response = await apiClient.get<any>('/production');
    const data = response.data;
    const rawList = Array.isArray(data) ? data : data?.items || [];
    return rawList.map(mapBackendLogToProductionBatch);
  },

  getBatchById: async (id: string): Promise<ProductionBatch> => {
    const response = await apiClient.get<any>(`/production/${id}`);
    return mapBackendLogToProductionBatch(response.data);
  },

  pickupProduction: async (id: string): Promise<ProductionBatch> => {
    const response = await apiClient.post<any>(`/production/${id}/pickup`);
    return mapBackendLogToProductionBatch(response.data);
  },

  previewProduction: async (input: { productId: string; quantity: number }): Promise<ProductionPreviewResponse> => {
    const response = await apiClient.post<ProductionPreviewResponse>('/production/preview', {
      product_id: input.productId,
      quantity: input.quantity,
    });
    return response.data;
  },

  startProduction: async (input: StartProductionInput): Promise<ProductionBatch> => {
    const response = await apiClient.post<any>('/production', {
      product_id: input.productId,
      planned_qty: input.targetQuantity,
      notes: input.notes || '',
    });
    return mapBackendLogToProductionBatch(response.data);
  },

  completeProduction: async (id: string, input: CompleteProductionInput): Promise<ProductionBatch> => {
    let overheads: Array<{ overhead_type_id?: string; name: string; amount: number }> = [];

    if (Array.isArray(input.overheads) && input.overheads.length > 0) {
      overheads = input.overheads.map((oh) => ({
        overhead_type_id: oh.overheadTypeId,
        name: oh.name,
        amount: oh.amount,
      }));
    } else {
      if (input.overheadLabor) {
        overheads.push({ name: 'Tenaga Kerja Langsung', amount: input.overheadLabor });
      }
      if (input.overheadEnergy) {
        overheads.push({ name: 'Listrik & Utilitas', amount: input.overheadEnergy });
      }
      if (input.overheadPackaging) {
        overheads.push({ name: 'Kemasan & Packaging', amount: input.overheadPackaging });
      }
      if (input.overheadOther) {
        overheads.push({ name: 'Overhead Lainnya', amount: input.overheadOther });
      }
    }

    const payload = {
      actual_qty: input.goodQuantity,
      waste_qty: input.wasteQuantity || 0,
      labor_cost: input.overheadLabor || 0,
      overheads,
      notes: input.notes || '',
    };

    const response = await apiClient.post<any>(`/production/${id}/complete`, payload);
    return mapBackendLogToProductionBatch(response.data);
  },

  cancelProduction: async (id: string, reason?: string): Promise<ProductionBatch> => {
    const response = await apiClient.post<any>(`/production/${id}/void`, {
      reason: reason || 'Dibatalkan oleh pengguna',
    });
    return mapBackendLogToProductionBatch(response.data);
  },
};

import apiClient from '@/lib/api-client';
import { toError } from '@/features/settings/services/settings-service';
import type { ProductionStatus, ProductionPreviewResponse, ProductionPreviewItem } from '../types';

export type ProductionNumber = number | string;
export interface ProductionMaterialActual {
  stock_id: string;
  sale_item_modifier_id?: string;
  quantity: ProductionNumber;
}
export interface ProductionLogItem {
  id: string;
  variant_id: string;
  status: ProductionStatus;
  target_quantity: ProductionNumber;
  good_quantity: ProductionNumber;
  waste_quantity: ProductionNumber;
  hpp_per_unit: ProductionNumber | null;
  total_cost: ProductionNumber;
  bom_cost: ProductionNumber;
  notes?: string;
  started_at: string | null;
  completed_at?: string | null;
  unfulfilled_quantity?: ProductionNumber;
  inventory_consumed_at?: string;
  recipe_snapshot: {
    product_name: string;
    variant_name: string;
    product_unit?: string;
    items: { stock_id: string; stock_name: string; unit: string; quantity: ProductionNumber }[];
    modifiers?: {
      id: string;
      name: string;
      stock_id: string | null;
      ingredient_quantity: ProductionNumber;
      unit: string;
    }[];
    overheads?: { overhead_type_id?: string; name: string; amount: ProductionNumber }[];
  };
  consumptions?: {
    stock_id: string;
    sale_item_modifier_id?: string;
    quantity: ProductionNumber;
    subtotal_cost: ProductionNumber;
  }[];
}

export interface ProductionHead {
  id: string;
  batch_number: string;
  source: 'MANUAL' | 'POS' | 'ONLINE';
  status: ProductionStatus;
  sale_id?: string;
  notes: string;
  target_completed_at: string | null;
  queued_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  order_context_snapshot: {
    invoice_number?: string;
    fulfillment_type?: string;
    table_number?: string;
    courier_name?: string;
  };
  logs: ProductionLogItem[];
}
export interface ProductionBatchInput {
  notes: string;
  draft: boolean;
  items: { variant_id: string; planned_qty: ProductionNumber; notes?: string }[];
}
export interface ProductionBatchPreview {
  items: ProductionPreviewResponse[];
  ingredients: ProductionPreviewItem[];
  is_all_sufficient: boolean;
}
export interface ProductionCompleteItem {
  labor_cost?: ProductionNumber;
  log_id: string;
  actual_qty: ProductionNumber;
  waste_qty: ProductionNumber;
  notes: string;
  actual_ingredients: ProductionMaterialActual[];
  overheads: { overhead_type_id?: string; name: string; amount: ProductionNumber }[];
}

async function request<T>(operation: () => Promise<{ data: T }>): Promise<T> {
  try {
    return (await operation()).data;
  } catch (error) {
    throw toError(error, 'Data produksi belum berhasil diproses. Coba lagi.');
  }
}

export const productionBatchService = {
  list: async (): Promise<ProductionHead[]> => {
    const items: ProductionHead[] = [];
    let page = 1;
    let pages: number;
    do {
      const result = await request(() =>
        apiClient.get<{ items: ProductionHead[]; total_pages: number }>('/production/batches', {
          params: { page, page_size: 100 },
        }),
      );
      const rows = result.items || [];
      if (!rows.length && page < result.total_pages)
        throw new Error('Daftar batch produksi belum lengkap.');
      items.push(...rows);
      pages = result.total_pages;
      page++;
    } while (page <= pages);
    return items;
  },
  get: (id: string) => request(() => apiClient.get<ProductionHead>(`/production/batches/${id}`)),
  preview: (data: ProductionBatchInput) =>
    request(() => apiClient.post<ProductionBatchPreview>('/production/batches/preview', data)),
  save: (data: ProductionBatchInput, id?: string) =>
    request(() =>
      id
        ? apiClient.put<ProductionHead>(`/production/batches/${id}`, data)
        : apiClient.post<ProductionHead>('/production/batches', data),
    ),
  start: (id: string, target_completed_at?: string) =>
    request(() =>
      apiClient.post<ProductionHead>(`/production/batches/${id}/start`, { target_completed_at }),
    ),
  complete: (id: string, operation_id: string, items: ProductionCompleteItem[]) =>
    request(() =>
      apiClient.post<ProductionHead>(`/production/batches/${id}/complete`, { operation_id, items }),
    ),
  cancel: (id: string, reason: string, log_id?: string) =>
    request(() =>
      apiClient.post<ProductionHead>(`/production/batches/${id}/cancel`, { reason, log_id }),
    ),
  draft: (id: string) =>
    request(() => apiClient.post<ProductionHead>(`/production/batches/${id}/draft`, {})),
};

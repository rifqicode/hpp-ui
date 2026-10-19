export type ProductionStatus = 'DRAFT' | 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'VOID';

export interface ConsumedIngredient {
  stockId: string;
  stockName: string;
  baseUnit: string;
  quantity: number;
  cost: number;
}

export interface ProductionOverheadDetail {
  id?: string;
  overheadTypeId?: string;
  name: string;
  amount: number;
}

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  storeId?: string;
  saleId?: string;
  saleItemId?: string;
  productId: string;
  productName: string;
  productCategory: string;
  productUnit: string;
  sellingPrice: number;
  status: ProductionStatus;
  targetQuantity: number;
  goodQuantity?: number;
  wasteQuantity?: number;
  stockCost: number;
  overheadCost?: number;
  overheadBreakdown?: {
    labor: number;
    energy: number;
    packaging: number;
    other?: number;
  };
  totalCost?: number;
  hppPerUnit?: number;
  startedAt: string;
  completedAt?: string;
  voidedAt?: string;
  voidReason?: string;
  notes?: string;
  ingredients: ConsumedIngredient[];
  overheads?: ProductionOverheadDetail[];
  recipeSnapshot?: {
    product_id: string;
    product_name: string;
    yield_qty: number;
    waste_pct: number;
    items?: Array<{
      stock_id: string;
      stock_name: string;
      quantity: number;
      unit: string;
      cost_per_unit: number;
    }>;
    overheads?: Array<{
      overhead_type_id?: string;
      name: string;
      amount: number;
    }>;
  };
}

export interface StartProductionInput {
  productId: string;
  targetQuantity: number;
  notes?: string;
  customIngredients?: { stockId: string; quantity: number }[];
}

export interface CompleteProductionInput {
  goodQuantity: number;
  wasteQuantity: number;
  overheadLabor?: number;
  overheadEnergy?: number;
  overheadPackaging?: number;
  overheadOther?: number;
  overheads?: ProductionOverheadDetail[];
  notes?: string;
}

export interface ProductionPreviewItem {
  stock_id: string;
  stock_name: string;
  unit: string;
  required_qty: number;
  available_qty: number;
  is_sufficient: boolean;
  estimated_cost: number;
}

export interface ProductionPreviewOverhead {
  overhead_type_id?: string;
  name: string;
  amount: number;
}

export interface ProductionPreviewResponse {
  product_id: string;
  product_name: string;
  planned_qty: number;
  is_all_sufficient: boolean;
  items: ProductionPreviewItem[];
  estimated_bom: number;
  overheads: ProductionPreviewOverhead[];
  estimated_overhead: number;
  estimated_total: number;
  estimated_hpp: number;
}

export interface ProductionCalendarFilters {
  month?: string;
  product_id?: string;
  statuses?: string;
  search?: string;
}

export interface ProductionCalendarItem {
  id: string;
  batch_number: string;
  product_id: string;
  product_name: string;
  product_unit: string;
  status: ProductionStatus;
  started_at: string;
  ended_at: string;
  start_date: string;
  end_date: string;
  qty_planned: string;
  qty_actual: string;
  total_cost: string;
  hpp_per_unit: string;
}

export interface ProductionCalendarResponse {
  month: string;
  timezone: string;
  today: string;
  summary: {
    total: number;
    by_status: Record<ProductionStatus, number>;
    completed_cost: string;
  };
  items: ProductionCalendarItem[];
  days: { date: string; item_ids: string[] }[];
}

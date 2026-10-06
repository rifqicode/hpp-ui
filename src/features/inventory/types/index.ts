export type StockMovementType =
  | 'PURCHASE'
  | 'PRODUCTION_CONSUMPTION'
  | 'PRODUCTION_REVERSAL'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT';

export type InventoryMethod = 'FIFO' | 'FEFO';

export interface Stock {
  id: string;
  store_id: string;
  name: string;
  base_unit: string;
  current_stock: string | number;
  inventory_method: InventoryMethod;
  available_stock?: string | number;
  expired_stock?: string | number;
  created_at: string;
  updated_at: string;
}

export interface StockBatch {
  id: string;
  stock_id: string;
  supplier_id?: string;
  initial_quantity: string | number;
  remaining_quantity: string | number;
  price_per_unit: string | number;
  expired_at?: string;
  created_at: string;
}

export interface StockMovement {
  id: string;
  stock_id: string;
  type: StockMovementType;
  quantity: string | number;
  reference_id: string;
  created_at: string;
}

export interface StockDetail {
  stock: Stock;
  active_batches: StockBatch[];
  movements: StockMovement[];
}

export interface CreateStockInput {
  name: string;
  base_unit: string;
  inventory_method?: InventoryMethod;
}

export interface UpdateStockInput {
  name: string;
  base_unit: string;
  inventory_method?: InventoryMethod;
}

export interface RecordPurchaseInput {
  stock_id: string;
  supplier_id?: string;
  quantity: string | number;
  total_price: string | number;
  purchase_date?: string;
  expired_at?: string;
}

export interface RecordAdjustmentInput {
  stock_id: string;
  type: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT';
  quantity: string | number;
  reason?: string;
  price_per_unit?: string | number;
}

export interface StockQuery {
  page?: number;
  limit?: number;
  search?: string;
  inventory_method?: InventoryMethod;
}

export interface PaginatedStocks {
  items: Stock[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

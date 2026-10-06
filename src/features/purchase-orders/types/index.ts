export type PurchaseOrderStatus =
  | "IN_PROGRESS"
  | "PURCHASE_REQUEST"
  | "PURCHASE_ORDER"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export interface PurchaseOrderItem {
  id: string;
  stockId: string;
  stockName: string;
  quantity: number;
  baseUnit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrderLog {
  id: string;
  userId: string;
  userName: string;
  action: string; // CREATED, UPDATED, APPROVED, REJECTED, COMPLETED, CANCELLED
  notes?: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId?: string;
  supplierName: string;
  createdByUserId?: string;
  createdByName?: string;
  orderDate: string;
  completedDate?: string;
  status: PurchaseOrderStatus;
  notes?: string;
  items: PurchaseOrderItem[];
  logs?: PurchaseOrderLog[];
  totalAmount: number;
  createdAt: string;
}

export interface CreatePOItemInput {
  stock_id: string;
  quantity: number;
  estimated_unit_price?: number;
}

export interface CreatePurchaseOrderInput {
  supplier_id?: string;
  notes?: string;
  order_date?: string;
  items: CreatePOItemInput[];
}

export interface UpdatePurchaseOrderInput {
  supplier_id?: string;
  notes?: string;
  items: CreatePOItemInput[];
}

export interface ApprovePOInput {
  supplier_id?: string;
  notes?: string;
}

export interface RejectPOInput {
  reason: string;
}

export interface CompletePOPriceItem {
  item_id: string;
  unit_price: number;
}

export interface CompletePurchaseOrderInput {
  supplier_id?: string;
  prices: CompletePOPriceItem[];
}

export interface PurchaseOrderQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort_by?: string;
}

export interface PaginatedPurchaseOrders {
  items: PurchaseOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

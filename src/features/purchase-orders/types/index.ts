import type { POAttachment } from '../lib/attachment';

export type PurchaseOrderCategory = "PURCHASE_ORDER" | "DIRECT_ORDER";

export const PURCHASE_ORDER_CATEGORY_LABELS: Record<PurchaseOrderCategory, string> = {
  PURCHASE_ORDER: "Purchase Order",
  DIRECT_ORDER: "Direct Order",
};

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
  category: PurchaseOrderCategory;
  attachmentUrl?: string;
  attachmentName?: string;
  attachments: POAttachment[];
  completionAttachments: POAttachment[];
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
  unit_price?: number;
  total_price?: number;
}

export interface CreatePurchaseOrderInput {
  attachments?: POAttachment[];
  category?: PurchaseOrderCategory;
  attachment_url?: string;
  attachment_name?: string;
  supplier_id?: string;
  notes?: string;
  order_date?: string;
  items: CreatePOItemInput[];
}

export interface UpdatePurchaseOrderInput {
  attachments?: POAttachment[];
  category?: PurchaseOrderCategory;
  attachment_url?: string;
  attachment_name?: string;
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
  total_price?: number;
}

export interface CompletePurchaseOrderInput {
  completion_attachments?: POAttachment[];
  supplier_id?: string;
  prices: CompletePOPriceItem[];
}

export interface PurchaseOrderQueryParams {
  category?: PurchaseOrderCategory;
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

export interface PurchaseOrderSummary {
  total_orders: number;
  request_count: number;
  order_count: number;
  completed_count: number;
  total_completed_amount: string | number;
}

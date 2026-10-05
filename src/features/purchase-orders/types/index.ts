export type PurchaseOrderStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface PurchaseOrderItem {
  id: string;
  stockId: string;
  stockName: string;
  quantity: number;
  baseUnit: string;
  unitPrice: number; // 0 jika belum diset harganya oleh vendor
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. PO-20260922-4821
  supplierId: string;
  supplierName: string;
  orderDate: string;
  completedDate?: string;
  status: PurchaseOrderStatus;
  notes?: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  createdAt: string;
}

export interface CreatePOItemInput {
  stockId: string;
  stockName: string;
  quantity: number;
  baseUnit: string;
  estimatedUnitPrice?: number;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  supplierName: string;
  notes?: string;
  orderDate?: string;
  items: CreatePOItemInput[];
}

export interface CompletePOPriceItem {
  itemId: string;
  unitPrice: number;
}

import apiClient from '../../../lib/api-client';
import type {
  PurchaseOrder,
  CreatePurchaseOrderInput,
  CompletePOPriceItem,
} from '../types';

export function generatePONumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `PO-${year}${month}${day}-${randomNum}`;
}

let LOCAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "po-1",
    poNumber: "PO-20260922-8492",
    supplierId: "sup-1",
    supplierName: "PT Sumber Pangan Sejahtera",
    orderDate: new Date().toISOString(),
    status: "IN_PROGRESS",
    notes: "Pesanan bahan baku mendesak untuk jadwal produksi roti manis.",
    totalAmount: 0,
    createdAt: new Date().toISOString(),
    items: [
      {
        id: "item-101",
        stockId: "mat-1",
        stockName: "Tepung Terigu",
        quantity: 100,
        baseUnit: "kg",
        unitPrice: 0,
        totalPrice: 0,
      },
      {
        id: "item-102",
        stockId: "mat-3",
        stockName: "Gula Pasir",
        quantity: 50,
        baseUnit: "kg",
        unitPrice: 0,
        totalPrice: 0,
      },
    ],
  },
  {
    id: "po-2",
    poNumber: "PO-20260921-3910",
    supplierId: "sup-2",
    supplierName: "CV Grosir Jaya Abadi",
    orderDate: new Date(Date.now() - 86400000).toISOString(),
    status: "IN_PROGRESS",
    notes: "Pengiriman via kurir toko vendor.",
    totalAmount: 0,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    items: [
      {
        id: "item-201",
        stockId: "mat-2",
        stockName: "Minyak Goreng",
        quantity: 40,
        baseUnit: "L",
        unitPrice: 0,
        totalPrice: 0,
      },
    ],
  },
  {
    id: "po-3",
    poNumber: "PO-20260918-7241",
    supplierId: "sup-3",
    supplierName: "Toko Bahan Kue 88",
    orderDate: "2026-09-18T09:30:00Z",
    completedDate: "2026-09-19T14:20:00Z",
    status: "COMPLETED",
    notes: "Faktur lunas dibayar tunai saat serah terima.",
    totalAmount: 1300000,
    createdAt: "2026-09-18T09:30:00Z",
    items: [
      {
        id: "item-301",
        stockId: "mat-5",
        stockName: "Susu Bubuk",
        quantity: 20,
        baseUnit: "kg",
        unitPrice: 65000,
        totalPrice: 1300000,
      },
    ],
  },
  {
    id: "po-4",
    poNumber: "PO-20260915-1102",
    supplierId: "sup-4",
    supplierName: "UD Berkah Tani Mandiri",
    orderDate: "2026-09-15T11:00:00Z",
    status: "CANCELLED",
    notes: "Dibatalkan karena stok vendor sedang habis.",
    totalAmount: 0,
    createdAt: "2026-09-15T11:00:00Z",
    items: [
      {
        id: "item-401",
        stockId: "mat-4",
        stockName: "Ragi",
        quantity: 500,
        baseUnit: "g",
        unitPrice: 0,
        totalPrice: 0,
      },
    ],
  },
];

export const purchaseOrderService = {
  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    try {
      const response = await apiClient.get<PurchaseOrder[]>('/purchase-orders');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return LOCAL_PURCHASE_ORDERS;
    } catch {
      return [...LOCAL_PURCHASE_ORDERS];
    }
  },

  getPurchaseOrderById: async (id: string): Promise<PurchaseOrder> => {
    try {
      const response = await apiClient.get<PurchaseOrder>(`/purchase-orders/${id}`);
      return response.data;
    } catch {
      const found = LOCAL_PURCHASE_ORDERS.find((po) => po.id === id);
      if (!found) {
        throw new Error('Purchase order tidak ditemukan');
      }
      return found;
    }
  },

  createPurchaseOrder: async (input: CreatePurchaseOrderInput): Promise<PurchaseOrder> => {
    try {
      const response = await apiClient.post<PurchaseOrder>('/purchase-orders', input);
      return response.data;
    } catch {
      const newPO: PurchaseOrder = {
        id: `po-${Date.now()}`,
        poNumber: generatePONumber(),
        supplierId: input.supplierId,
        supplierName: input.supplierName,
        orderDate: input.orderDate || new Date().toISOString(),
        status: "IN_PROGRESS",
        notes: input.notes,
        createdAt: new Date().toISOString(),
        totalAmount: 0,
        items: input.items.map((item, idx) => {
          const unitPrice = item.estimatedUnitPrice || 0;
          const totalPrice = unitPrice * item.quantity;
          return {
            id: `item-${Date.now()}-${idx}`,
            stockId: item.stockId,
            stockName: item.stockName,
            quantity: item.quantity,
            baseUnit: item.baseUnit,
            unitPrice,
            totalPrice,
          };
        }),
      };

      newPO.totalAmount = newPO.items.reduce((acc, it) => acc + it.totalPrice, 0);
      LOCAL_PURCHASE_ORDERS = [newPO, ...LOCAL_PURCHASE_ORDERS];
      return newPO;
    }
  },

  completePurchaseOrder: async (
    id: string,
    prices: CompletePOPriceItem[]
  ): Promise<PurchaseOrder> => {
    try {
      const response = await apiClient.post<PurchaseOrder>(`/purchase-orders/${id}/complete`, { prices });
      return response.data;
    } catch {
      const index = LOCAL_PURCHASE_ORDERS.findIndex((po) => po.id === id);
      if (index === -1) {
        throw new Error('Purchase order tidak ditemukan');
      }

      const po = { ...LOCAL_PURCHASE_ORDERS[index] };
      const priceMap = new Map(prices.map((p) => [p.itemId, p.unitPrice]));

      po.items = po.items.map((item) => {
        const finalPrice = priceMap.get(item.id) ?? item.unitPrice ?? 0;
        return {
          ...item,
          unitPrice: finalPrice,
          totalPrice: finalPrice * item.quantity,
        };
      });

      po.totalAmount = po.items.reduce((acc, it) => acc + it.totalPrice, 0);
      po.status = "COMPLETED";
      po.completedDate = new Date().toISOString();

      LOCAL_PURCHASE_ORDERS[index] = po;
      return po;
    }
  },

  cancelPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    try {
      const response = await apiClient.post<PurchaseOrder>(`/purchase-orders/${id}/cancel`);
      return response.data;
    } catch {
      const index = LOCAL_PURCHASE_ORDERS.findIndex((po) => po.id === id);
      if (index === -1) {
        throw new Error('Purchase order tidak ditemukan');
      }
      LOCAL_PURCHASE_ORDERS[index].status = "CANCELLED";
      return LOCAL_PURCHASE_ORDERS[index];
    }
  },
};

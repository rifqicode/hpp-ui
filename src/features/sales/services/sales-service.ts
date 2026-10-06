import apiClient from '../../../lib/api-client';
import { recipeService } from '../../recipes/services/recipe-service';
import type { Product } from '../../recipes/types';
import type { Sale, CreateSaleInput, SalesSummary } from '../types';

const STORAGE_KEY = 'hpp_sales_records_v1';

const INITIAL_SALES: Sale[] = [];

function loadLocalSales(): Sale[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse error
  }
  return [...INITIAL_SALES];
}

function saveLocalSales(sales: Sale[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
  } catch {
    // Ignore storage write error
  }
}

let LOCAL_SALES: Sale[] = loadLocalSales();

export const salesService = {
  getProducts: async (): Promise<Product[]> => {
    return recipeService.getProducts();
  },

  getSales: async (): Promise<Sale[]> => {
    try {
      const res = await apiClient.get<Sale[]>('/sales');
      return res.data;
    } catch {
      return [...LOCAL_SALES];
    }
  },

  getSaleById: async (id: string): Promise<Sale> => {
    try {
      const res = await apiClient.get<Sale>(`/sales/${id}`);
      return res.data;
    } catch {
      const found = LOCAL_SALES.find((s) => s.id === id);
      if (!found) {
        throw new Error('Transaksi tidak ditemukan');
      }
      return found;
    }
  },

  createSale: async (input: CreateSaleInput): Promise<Sale> => {
    try {
      const res = await apiClient.post<Sale>('/sales', input);
      return res.data;
    } catch {
      // Local fallback execution with real FIFO/stock updates
      const allProducts = await recipeService.getProducts();
      const saleId = `sale-${Date.now()}`;
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const seq = String(LOCAL_SALES.length + 1).padStart(3, '0');
      const invoiceNumber = `TRX-${dateStr}-${seq}`;

      let totalGross = 0;
      let totalCost = 0;

      const items = input.items.map((it, idx) => {
        const prod = allProducts.find((p) => p.id === it.productId);
        const productName = prod ? prod.name : 'Produk Toko';
        const category = prod ? prod.category : 'Roti';
        const unit = prod ? prod.unit : 'pcs';
        const costAtSale = it.costAtSale || (prod ? prod.latestHpp : 0);
        const subtotal = it.quantity * it.priceAtSale;
        const lineCost = it.quantity * costAtSale;
        const lineGrossProfit = subtotal - lineCost;

        totalGross += subtotal;
        totalCost += lineCost;

        // Deduct finished goods stock from recipeService
        if (prod) {
          const newStock = Math.max(0, prod.currentStock - it.quantity);
          recipeService.updateProduct(prod.id, { currentStock: newStock }).catch(() => {});
        }

        return {
          id: `si-${Date.now()}-${idx}`,
          saleId,
          productId: it.productId,
          productName,
          category,
          unit,
          quantity: it.quantity,
          priceAtSale: it.priceAtSale,
          costAtSale,
          subtotal,
          totalCost: lineCost,
          grossProfit: lineGrossProfit,
        };
      });

      const discount = input.discountAmount || 0;
      const tax = input.taxAmount || 0;
      const netTotal = Math.max(0, totalGross - discount + tax);
      const grossProfit = netTotal - totalCost;
      const profitMarginPct = netTotal > 0 ? (grossProfit / netTotal) * 100 : 0;

      const newSale: Sale = {
        id: saleId,
        storeId: input.storeId || '1',
        invoiceNumber,
        customerName: input.customerName?.trim() || 'Pelanggan Umum',
        totalAmount: netTotal,
        totalCost,
        grossProfit,
        profitMarginPct: Number(profitMarginPct.toFixed(2)),
        discountAmount: discount,
        taxAmount: tax,
        paymentMethod: input.paymentMethod,
        cashReceived: input.cashReceived,
        cashChange: input.cashReceived ? Math.max(0, input.cashReceived - netTotal) : 0,
        paymentReference: input.paymentReference,
        notes: input.notes,
        transactionDate: now.toISOString(),
        createdAt: now.toISOString(),
        status: 'COMPLETED',
        items,
      };

      LOCAL_SALES = [newSale, ...LOCAL_SALES];
      saveLocalSales(LOCAL_SALES);
      return newSale;
    }
  },

  getSummary: async (): Promise<SalesSummary> => {
    const sales = await salesService.getSales();
    const completed = sales.filter((s) => s.status === 'COMPLETED');
    const totalRevenue = completed.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalHpp = completed.reduce((acc, curr) => acc + curr.totalCost, 0);
    const totalGrossProfit = totalRevenue - totalHpp;
    const averageMarginPct = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalTransactions: completed.length,
      totalHpp,
      totalGrossProfit,
      averageMarginPct: Number(averageMarginPct.toFixed(2)),
    };
  },
};

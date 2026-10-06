import apiClient from '@/lib/api-client';
import type {
  Stock,
  StockDetail,
  CreateStockInput,
  UpdateStockInput,
  RecordPurchaseInput,
  RecordAdjustmentInput,
  StockQuery,
  PaginatedStocks,
} from '../types';

export interface MaterialOption {
  id: string;
  name: string;
  baseUnit: string;
  currentStock?: number;
  latestPrice?: number;
}

export const stockService = {
  getStocks: async (query?: StockQuery): Promise<PaginatedStocks> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.search) params.append('search', query.search);
    if (query?.inventory_method) params.append('inventory_method', query.inventory_method);

    const queryString = params.toString();
    const url = queryString ? `/stocks?${queryString}` : '/stocks';
    const response = await apiClient.get<PaginatedStocks>(url);
    return response.data;
  },

  getAllStocks: async (): Promise<Stock[]> => {
    const res = await stockService.getStocks({ page: 1, limit: 1000 });
    return res.items || [];
  },

  getMaterials: async (): Promise<MaterialOption[]> => {
    try {
      const stocks = await stockService.getAllStocks();
      return stocks.map((s) => ({
        id: s.id,
        name: s.name,
        baseUnit: s.base_unit,
        currentStock: Number(s.current_stock) || 0,
      }));
    } catch {
      return [];
    }
  },

  getStockDetail: async (id: string): Promise<StockDetail> => {
    const response = await apiClient.get<StockDetail>(`/stocks/${id}`);
    return response.data;
  },

  createStock: async (data: CreateStockInput): Promise<Stock> => {
    const response = await apiClient.post<Stock>('/stocks', data);
    return response.data;
  },

  updateStock: async (id: string, data: UpdateStockInput): Promise<Stock> => {
    const response = await apiClient.put<Stock>(`/stocks/${id}`, data);
    return response.data;
  },

  deleteStock: async (id: string): Promise<void> => {
    await apiClient.delete(`/stocks/${id}`);
  },

  recordPurchase: async (data: RecordPurchaseInput): Promise<unknown> => {
    const response = await apiClient.post('/stocks/purchases', data);
    return response.data;
  },

  recordAdjustment: async (data: RecordAdjustmentInput): Promise<unknown> => {
    const response = await apiClient.post('/stocks/adjustments', data);
    return response.data;
  },
};

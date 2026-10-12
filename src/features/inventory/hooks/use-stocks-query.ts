import { useQuery } from '@tanstack/react-query';
import { stockService } from '../services/stock-service';
import type { StockQuery } from '../types';

export const stockKeys = {
  all: ['stocks'] as const,
  lists: () => [...stockKeys.all, 'list'] as const,
  list: (query?: StockQuery) => [...stockKeys.lists(), query] as const,
  allItems: () => [...stockKeys.all, 'all-items'] as const,
  summary: () => [...stockKeys.all, 'summary'] as const,
  detail: (id: string) => [...stockKeys.all, 'detail', id] as const,
};

export function useStocksQuery(query?: StockQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: stockKeys.list(query),
    queryFn: () => stockService.getStocks(query),
    enabled: options?.enabled ?? true,
  });
}

export function useAllStocksQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: stockKeys.allItems(),
    queryFn: () => stockService.getAllStocks(),
    enabled: options?.enabled ?? true,
  });
}

export function useStockSummaryQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: stockKeys.summary(),
    queryFn: () => stockService.getStockSummary(),
    enabled: options?.enabled ?? true,
  });
}

export function useStockDetailQuery(id?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: stockKeys.detail(id || ''),
    queryFn: () => stockService.getStockDetail(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}

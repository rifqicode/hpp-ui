import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { stockService } from '../services/stock-service';
import { supplierService } from '@/features/suppliers/services/supplier-service';
import { stockKeys, useAllStocksQuery } from './use-stocks-query';
import type { Stock, RecordPurchaseInput, CreateStockInput } from '../types';
import type { Supplier } from '@/features/suppliers/types';

export const supplierKeys = {
  all: ['suppliers'] as const,
  allItems: () => [...supplierKeys.all, 'all-items'] as const,
};

export function usePurchaseStock(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const isEnabled = options?.enabled ?? true;

  const {
    data: stocks = [],
    isLoading: stocksLoading,
    error: stocksError,
    refetch: refetchStocks,
  } = useAllStocksQuery({ enabled: isEnabled });

  const {
    data: suppliers = [],
    isLoading: suppliersLoading,
    error: suppliersError,
    refetch: refetchSuppliers,
  } = useQuery<Supplier[]>({
    queryKey: supplierKeys.allItems(),
    queryFn: () => supplierService.getAllSuppliers(),
    enabled: isEnabled,
  });

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [mutationError, setMutationError] = React.useState<string>('');

  const loading = stocksLoading || suppliersLoading;
  const rawError = mutationError || stocksError || suppliersError;
  const error = rawError instanceof Error ? rawError.message : rawError ? String(rawError) : '';

  const loadDependencies = React.useCallback(async () => {
    await Promise.all([refetchStocks(), refetchSuppliers()]);
  }, [refetchStocks, refetchSuppliers]);

  const handleCreateStock = async (payload: CreateStockInput): Promise<Stock> => {
    setMutationError('');
    try {
      const newStock = await stockService.createStock(payload);
      await queryClient.invalidateQueries({ queryKey: stockKeys.all });
      return newStock;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create new material';
      setMutationError(msg);
      throw err;
    }
  };

  const handleRecordPurchase = async (payload: RecordPurchaseInput): Promise<unknown> => {
    setIsSubmitting(true);
    setMutationError('');
    try {
      const result = await stockService.recordPurchase(payload);
      await queryClient.invalidateQueries({ queryKey: stockKeys.all });
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record purchase';
      setMutationError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    stocks,
    suppliers,
    loading,
    isSubmitting,
    error,
    loadDependencies,
    handleCreateStock,
    handleRecordPurchase,
  };
}

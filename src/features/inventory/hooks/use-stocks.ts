import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { stockService } from '../services/stock-service';
import { stockKeys, useStocksQuery } from './use-stocks-query';
import type { Stock, CreateStockInput, UpdateStockInput, StockQuery } from '../types';

export function useStocks(initialQuery?: StockQuery) {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState<number>(initialQuery?.page || 1);
  const [limit, setLimit] = React.useState<number>(initialQuery?.limit || 10);
  const [search, setSearch] = React.useState<string>(initialQuery?.search || '');
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>(initialQuery?.search || '');
  const [inventoryMethod, setInventoryMethod] = React.useState<StockQuery['inventory_method']>(initialQuery?.inventory_method);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [mutationError, setMutationError] = React.useState<string>('');

  // Debounce search input
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const activeQuery: StockQuery = React.useMemo(() => ({
    page,
    limit,
    search: debouncedSearch.trim() || undefined,
    inventory_method: inventoryMethod,
  }), [page, limit, debouncedSearch, inventoryMethod]);

  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useStocksQuery(activeQuery);

  const stocks = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;
  const error = mutationError || (queryError instanceof Error ? queryError.message : queryError ? 'Failed to load stocks' : '');

  const loadStocks = React.useCallback(async (overrideQuery?: StockQuery) => {
    if (overrideQuery) {
      if (overrideQuery.page !== undefined) setPage(overrideQuery.page);
      if (overrideQuery.limit !== undefined) setLimit(overrideQuery.limit);
      if (overrideQuery.search !== undefined) {
        setSearch(overrideQuery.search);
        setDebouncedSearch(overrideQuery.search);
      }
      if (overrideQuery.inventory_method !== undefined) setInventoryMethod(overrideQuery.inventory_method);
    }
    await refetch();
  }, [refetch]);

  const handleCreateStock = async (payload: CreateStockInput): Promise<Stock> => {
    setIsSubmitting(true);
    setMutationError('');
    try {
      const newStock = await stockService.createStock(payload);
      await queryClient.invalidateQueries({ queryKey: stockKeys.all });
      return newStock;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create stock';
      setMutationError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStock = async (id: string, payload: UpdateStockInput): Promise<Stock> => {
    setIsSubmitting(true);
    setMutationError('');
    try {
      const updated = await stockService.updateStock(id, payload);
      await queryClient.invalidateQueries({ queryKey: stockKeys.all });
      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update stock';
      setMutationError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStock = async (id: string): Promise<void> => {
    setIsSubmitting(true);
    setMutationError('');
    try {
      await stockService.deleteStock(id);
      await queryClient.invalidateQueries({ queryKey: stockKeys.all });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete stock';
      setMutationError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    stocks,
    total,
    page,
    limit,
    totalPages,
    search,
    setSearch,
    setPage,
    inventoryMethod,
    setInventoryMethod,
    loading,
    error,
    isSubmitting,
    loadStocks,
    handleCreateStock,
    handleUpdateStock,
    handleDeleteStock,
  };
}

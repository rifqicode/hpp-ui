import * as React from 'react';
import { stockService } from '../services/stock-service';
import type { Stock, CreateStockInput, UpdateStockInput, StockQuery } from '../types';

export function useStocks(initialQuery?: StockQuery) {
  const [stocks, setStocks] = React.useState<Stock[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [page, setPage] = React.useState<number>(initialQuery?.page || 1);
  const [limit, setLimit] = React.useState<number>(initialQuery?.limit || 10);
  const [totalPages, setTotalPages] = React.useState<number>(1);
  const [search, setSearch] = React.useState<string>(initialQuery?.search || '');
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>(initialQuery?.search || '');
  const [inventoryMethod, setInventoryMethod] = React.useState<StockQuery['inventory_method']>(initialQuery?.inventory_method);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  // Debounce search input
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadStocks = React.useCallback(async (overrideQuery?: StockQuery) => {
    setLoading(true);
    setError('');
    try {
      const q: StockQuery = {
        page: overrideQuery?.page !== undefined ? overrideQuery.page : page,
        limit: overrideQuery?.limit !== undefined ? overrideQuery.limit : limit,
        search: overrideQuery?.search !== undefined ? overrideQuery.search : debouncedSearch.trim() || undefined,
        inventory_method: overrideQuery?.inventory_method !== undefined ? overrideQuery.inventory_method : inventoryMethod,
      };
      const data = await stockService.getStocks(q);
      setStocks(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setLimit(data.limit || 10);
      setTotalPages(data.total_pages || 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load stocks';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, inventoryMethod]);

  React.useEffect(() => {
    let ignore = false;
    stockService
      .getStocks({
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        inventory_method: inventoryMethod,
      })
      .then((data) => {
        if (!ignore) {
          setStocks(data.items || []);
          setTotal(data.total || 0);
          setPage(data.page || 1);
          setLimit(data.limit || 10);
          setTotalPages(data.total_pages || 1);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Failed to load stocks';
          setError(msg);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [page, limit, debouncedSearch, inventoryMethod]);

  const handleCreateStock = async (payload: CreateStockInput): Promise<Stock> => {
    setIsSubmitting(true);
    setError('');
    try {
      const newStock = await stockService.createStock(payload);
      await loadStocks();
      return newStock;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create stock';
      setError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStock = async (id: string, payload: UpdateStockInput): Promise<Stock> => {
    setIsSubmitting(true);
    setError('');
    try {
      const updated = await stockService.updateStock(id, payload);
      await loadStocks();
      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update stock';
      setError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStock = async (id: string): Promise<void> => {
    setIsSubmitting(true);
    setError('');
    try {
      await stockService.deleteStock(id);
      await loadStocks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete stock';
      setError(msg);
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

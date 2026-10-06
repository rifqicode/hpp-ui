import * as React from 'react';
import { stockService } from '../services/stock-service';
import { supplierService } from '@/features/suppliers/services/supplier-service';
import type { Stock, RecordPurchaseInput, CreateStockInput } from '../types';
import type { Supplier } from '@/features/suppliers/types';

export function usePurchaseStock() {
  const [stocks, setStocks] = React.useState<Stock[]>([]);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');

  const loadDependencies = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [stocksData, suppliersData] = await Promise.all([
        stockService.getAllStocks(),
        supplierService.getAllSuppliers(),
      ]);
      setStocks(stocksData);
      setSuppliers(suppliersData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load options';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let ignore = false;
    Promise.all([
      stockService.getAllStocks(),
      supplierService.getAllSuppliers(),
    ])
      .then(([stocksData, suppliersData]) => {
        if (!ignore) {
          setStocks(stocksData);
          setSuppliers(suppliersData);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Failed to load options';
          setError(msg);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateStock = async (payload: CreateStockInput): Promise<Stock> => {
    try {
      const newStock = await stockService.createStock(payload);
      setStocks((prev) => [...prev, newStock]);
      return newStock;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create new material';
      setError(msg);
      throw err;
    }
  };

  const handleRecordPurchase = async (payload: RecordPurchaseInput): Promise<unknown> => {
    setIsSubmitting(true);
    setError('');
    try {
      const result = await stockService.recordPurchase(payload);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record purchase';
      setError(msg);
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

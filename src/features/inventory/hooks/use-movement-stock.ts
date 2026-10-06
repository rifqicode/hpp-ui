import * as React from 'react';
import { stockService } from '../services/stock-service';
import type { Stock, RecordAdjustmentInput } from '../types';

export function useMovementStock() {
  const [stocks, setStocks] = React.useState<Stock[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');

  const loadStocks = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await stockService.getAllStocks();
      setStocks(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load materials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let ignore = false;
    stockService
      .getAllStocks()
      .then((data) => {
        if (!ignore) {
          setStocks(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Failed to load materials';
          setError(msg);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleRecordAdjustment = async (payload: RecordAdjustmentInput): Promise<unknown> => {
    setIsSubmitting(true);
    setError('');
    try {
      const result = await stockService.recordAdjustment(payload);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record stock adjustment';
      setError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    stocks,
    loading,
    isSubmitting,
    error,
    loadStocks,
    handleRecordAdjustment,
  };
}

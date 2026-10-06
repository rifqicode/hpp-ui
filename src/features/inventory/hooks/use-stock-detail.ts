import * as React from 'react';
import { stockService } from '../services/stock-service';
import type { StockDetail } from '../types';

export function useStockDetail(id?: string) {
  const [detail, setDetail] = React.useState<StockDetail | null>(null);
  const [loading, setLoading] = React.useState<boolean>(Boolean(id));
  const [error, setError] = React.useState<string>('');

  const loadDetail = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await stockService.getStockDetail(id);
      setDetail(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load stock details';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    if (!id) return;
    let ignore = false;
    stockService
      .getStockDetail(id)
      .then((data) => {
        if (!ignore) {
          setDetail(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Failed to load stock details';
          setError(msg);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  return {
    detail,
    loading,
    error,
    loadDetail,
  };
}

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { stockService } from '../services/stock-service';
import { stockKeys, useAllStocksQuery } from './use-stocks-query';
import type { RecordAdjustmentInput } from '../types';

export function useMovementStock(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const isEnabled = options?.enabled ?? true;

  const {
    data: stocks = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useAllStocksQuery({ enabled: isEnabled });

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [mutationError, setMutationError] = React.useState<string>('');

  const rawError = mutationError || queryError;
  const error = rawError instanceof Error ? rawError.message : rawError ? String(rawError) : '';

  const loadStocks = React.useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleRecordAdjustment = async (payload: RecordAdjustmentInput): Promise<unknown> => {
    setIsSubmitting(true);
    setMutationError('');
    try {
      const result = await stockService.recordAdjustment(payload);
      await queryClient.invalidateQueries({ queryKey: stockKeys.all });
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record stock adjustment';
      setMutationError(msg);
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

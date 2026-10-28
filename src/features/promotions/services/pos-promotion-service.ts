import apiClient from '@/lib/api-client';
import type { POSPromotion, PromotionPreviewRequest } from '../types/pos';

export const posPromotionService = {
  async preview(storeId: string, input: PromotionPreviewRequest, signal?: AbortSignal): Promise<POSPromotion[]> {
    return (await apiClient.post<POSPromotion[]>(`/stores/${encodeURIComponent(storeId)}/promotions/preview`, input, {
      headers: { 'X-Store-ID': storeId }, signal, skipLoading: true,
    })).data;
  },
};

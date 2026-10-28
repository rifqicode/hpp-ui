import apiClient from '@/lib/api-client';
import type { CompleteGuidancePayload, GuidanceItem } from '../types';

const config = (storeId: string, signal?: AbortSignal) => ({
  headers: { 'X-Store-ID': storeId },
  signal,
});

export const guidanceService = {
  list: async (storeId: string, signal?: AbortSignal): Promise<GuidanceItem[]> => {
    const response = await apiClient.get<GuidanceItem[]>('/onboarding/guidances', config(storeId, signal));
    return response.data ?? [];
  },

  complete: async (
    storeId: string,
    key: string,
    payload?: CompleteGuidancePayload
  ): Promise<GuidanceItem> => {
    const response = await apiClient.patch<GuidanceItem>(
      `/onboarding/guidances/${encodeURIComponent(key)}/complete`,
      payload ?? {},
      config(storeId)
    );
    return response.data;
  },
};

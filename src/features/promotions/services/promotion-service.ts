import apiClient from '@/lib/api-client';
import type { PromotionListFilters } from '../lib/promotion-list';
import type { Promotion, PromotionInput, PromotionList, PromotionOptions, PromotionSimulation } from '../types';

const path = (storeId: string) => `/stores/${encodeURIComponent(storeId)}/promotions`;
const config = (storeId: string, signal?: AbortSignal) => ({ headers: { 'X-Store-ID': storeId }, signal, skipLoading: true });

export const promotionService = {
  async list(storeId: string, page: number, search: string, signal?: AbortSignal, filters: Partial<PromotionListFilters> = {}): Promise<PromotionList> {
    return (await apiClient.get<PromotionList>(path(storeId), { ...config(storeId, signal), params: { page, per_page: 12, search, ...filters } })).data;
  },
  async options(storeId: string, page: number, search: string, signal?: AbortSignal): Promise<PromotionOptions> {
    return (await apiClient.get<PromotionOptions>(`${path(storeId)}/options`, { ...config(storeId, signal), params: { page, per_page: 50, search } })).data;
  },
  async get(storeId: string, id: string): Promise<Promotion> {
    return (await apiClient.get<Promotion>(`${path(storeId)}/${encodeURIComponent(id)}`, config(storeId))).data;
  },
  async simulate(storeId: string, input: PromotionInput, signal?: AbortSignal): Promise<PromotionSimulation> {
    return (await apiClient.post<PromotionSimulation>(`${path(storeId)}/simulate`, input, config(storeId, signal))).data;
  },
  async save(storeId: string, input: PromotionInput, id?: string): Promise<Promotion> {
    const response = id
      ? await apiClient.put<Promotion>(`${path(storeId)}/${encodeURIComponent(id)}`, input, config(storeId))
      : await apiClient.post<Promotion>(path(storeId), input, config(storeId));
    return response.data;
  },
  async setActive(storeId: string, promotion: Promotion, isActive: boolean, confirmed = false): Promise<Promotion> {
    return (await apiClient.patch<Promotion>(`${path(storeId)}/${encodeURIComponent(promotion.id)}/status`, {
      is_active: isActive, version: promotion.version, loss_leader_confirmed: confirmed,
    }, config(storeId))).data;
  },
  async archive(storeId: string, id: string): Promise<void> {
    await apiClient.delete(`${path(storeId)}/${encodeURIComponent(id)}`, config(storeId));
  },
};

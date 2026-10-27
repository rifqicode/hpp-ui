import apiClient from '@/lib/api-client';
import { productPayload, transformProductFromApi, type ApiProduct } from '@/features/recipes/services/recipe-service';
import type { OnboardingAction, OnboardingData, OnboardingDraft, OnboardingMaterial, OnboardingState, MaterialDraft } from '../types';

interface ApiOnboarding { state: OnboardingState | null; should_start: boolean; dismissed?: boolean; product?: ApiProduct; stock?: OnboardingMaterial }
function normalize(data: ApiOnboarding): OnboardingData {
  return { ...data, product: data.product ? transformProductFromApi(data.product) : undefined };
}
const config = (storeId: string, signal?: AbortSignal) => ({ headers: { 'X-Store-ID': storeId }, signal });

export const onboardingService = {
  get: async (storeId: string, signal?: AbortSignal) => normalize((await apiClient.get<ApiOnboarding>('/onboarding', config(storeId, signal))).data),
  save: async (storeId: string, revision: number, step: number, draft: OnboardingDraft, action: OnboardingAction) =>
    normalize((await apiClient.put<ApiOnboarding>('/onboarding', { revision, step, draft, action }, config(storeId))).data),
  saveMaterial: async (storeId: string, material: MaterialDraft) => {
    const response = await apiClient.post<ApiOnboarding>('/onboarding/materials', {
      operation_key: material.key, name: material.name, base_unit: material.baseUnit,
      stock_id: material.stockId || undefined,
      price: material.price, package_quantity: material.packageQuantity,
    }, config(storeId));
    return { ...normalize(response.data), stock: response.data.stock! };
  },
  saveProduct: async (storeId: string, draft: OnboardingDraft, linkedProductId?: string | null) => {
    const p = draft.product;
    return normalize((await apiClient.post<ApiOnboarding>('/onboarding/product', {
      operation_key: p.key, product: productPayload(p.form),
      existing_product_id: p.existingProductId || linkedProductId || undefined,
      update_existing: !p.existingProductId && Boolean(linkedProductId),
    }, config(storeId))).data);
  },
  materials: async (storeId: string, signal?: AbortSignal) => {
    const result: OnboardingMaterial[] = [];
    let page = 1;
    let totalPages: number;
    do {
      const { data } = await apiClient.get<{ items: OnboardingMaterial[]; total_pages: number }>('/stocks', { ...config(storeId, signal), params: { page, limit: 100 } });
      if (!Array.isArray(data.items)) throw new Error('Daftar bahan tidak dapat dibaca.');
      result.push(...data.items); totalPages = data.total_pages || 1;
      if (!data.items.length && page < totalPages) throw new Error('Daftar bahan belum lengkap. Coba muat ulang.');
      page++;
    } while (page <= totalPages);
    return result;
  },
  products: async (storeId: string, signal?: AbortSignal) => {
    const products: ApiProduct[] = [];
    let page = 1;
    let totalPages: number;
    do {
      const { data } = await apiClient.get<{ items: ApiProduct[]; total_pages: number }>('/products', { ...config(storeId, signal), params: { page, limit: 100 } });
      if (!Array.isArray(data.items)) throw new Error('Daftar produk tidak dapat dibaca.');
      products.push(...data.items); totalPages = data.total_pages || 1;
      if (!data.items.length && page < totalPages) throw new Error('Daftar produk belum lengkap. Coba muat ulang.');
      page++;
    } while (page <= totalPages);
    return products.map(transformProductFromApi);
  },
};

import apiClient from '@/lib/api-client'
import type {
  ProductDetailParams,
  ProductDetailReport,
  ProductProfitabilityParams,
  ProductProfitabilityReport,
} from '../types'

export const reportsApi = {
  getProductProfitability: async (
    storeId: string,
    params: ProductProfitabilityParams,
    signal?: AbortSignal,
  ): Promise<ProductProfitabilityReport> => {
    const query = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== ''))
    const response = await apiClient.get<ProductProfitabilityReport>(
      `/stores/${storeId}/reports/product-profitability`,
      { params: query, signal, headers: { 'X-Store-ID': storeId } },
    )
    return response.data
  },

  getProductDetail: async (
    storeId: string,
    variantId: string,
    params: ProductDetailParams,
    signal?: AbortSignal,
  ): Promise<ProductDetailReport> => {
    const query = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
    )
    const response = await apiClient.get<ProductDetailReport>(
      `/stores/${storeId}/reports/products/${variantId}`,
      { params: query, signal, headers: { 'X-Store-ID': storeId } },
    )
    return response.data
  },
}

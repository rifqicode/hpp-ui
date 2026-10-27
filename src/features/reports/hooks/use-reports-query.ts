import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { reportsApi } from '../api/reports-api'
import type { ProductDetailParams, ProductProfitabilityParams } from '../types'

export const reportsKeys = {
  all: ['reports'] as const,
  productProfitability: (storeId: string | null, params: ProductProfitabilityParams) =>
    [...reportsKeys.all, 'product-profitability', storeId, params] as const,
  productDetail: (storeId: string | null, variantId: string | undefined, params: ProductDetailParams) =>
    [...reportsKeys.all, 'product-detail', storeId, variantId, params] as const,
}

/** Fetches the product profitability report only while its tab is active. */
export function useProductProfitabilityQuery(
  storeId: string | null,
  params: ProductProfitabilityParams,
  enabled: boolean,
) {
  return useQuery({
    queryKey: reportsKeys.productProfitability(storeId, params),
    queryFn: ({ signal }) => reportsApi.getProductProfitability(storeId as string, params, signal),
    enabled: enabled && !!storeId,
    placeholderData: keepPreviousData,
  })
}

/** Fetches the product detail report for one variant. */
export function useProductDetailQuery(
  storeId: string | null,
  variantId: string | undefined,
  params: ProductDetailParams,
  enabled: boolean,
) {
  return useQuery({
    queryKey: reportsKeys.productDetail(storeId, variantId, params),
    queryFn: ({ signal }) =>
      reportsApi.getProductDetail(storeId as string, variantId as string, params, signal),
    enabled: enabled && !!storeId && !!variantId,
    placeholderData: keepPreviousData,
  })
}

import { useQuery } from '@tanstack/react-query';
import { recipeService } from '../services/recipe-service';

export const recipeKeys = {
  all: ['recipes'] as const,
  products: ['products'] as const,
  productList: (query?: { search?: string; category?: string }) => [...recipeKeys.products, 'list', query] as const,
  productSummary: () => [...recipeKeys.products, 'summary'] as const,
  productDetail: (id: string) => [...recipeKeys.products, 'detail', id] as const,
  productEstimate: (id: string) => [...recipeKeys.products, 'estimate', id] as const,
  categories: () => [...recipeKeys.products, 'categories'] as const,
};

export function useProductsQuery(query?: { search?: string; category?: string }, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: recipeKeys.productList(query),
    queryFn: () => recipeService.getProducts(query),
    enabled: options?.enabled ?? true,
  });
}

export function useProductSummaryQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: recipeKeys.productSummary(),
    queryFn: () => recipeService.getProductSummary(),
    enabled: options?.enabled ?? true,
  });
}

export function useProductDetailQuery(id?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: recipeKeys.productDetail(id || ''),
    queryFn: () => recipeService.getProductById(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}

export function useProductCategoriesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: recipeKeys.categories(),
    queryFn: () => recipeService.getCategories(),
    enabled: options?.enabled ?? true,
  });
}

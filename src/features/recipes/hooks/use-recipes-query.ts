import { useAuthStore } from '@/store/use-auth-store';
import { useQuery } from '@tanstack/react-query';
import { recipeService } from '../services/recipe-service';

export const recipeKeys = {
  all: ['products'] as const,
  products: ['products'] as const,
  productList: (query?: { search?: string; category?: string; sort?: string }, storeId?: string | null) => [...recipeKeys.products, 'list', storeId, query] as const,
  productSummary: () => [...recipeKeys.products, 'summary'] as const,
  productDetail: (id: string) => [...recipeKeys.products, 'detail', id] as const,
  productEstimate: (id: string) => [...recipeKeys.products, 'estimate', id] as const,
  categories: () => [...recipeKeys.products, 'categories'] as const,
};

export function useProductsQuery(query?: { search?: string; category?: string; sort?: string }, options?: { enabled?: boolean }) {
  const storeId = useAuthStore((state) => state.activeStoreId);
  return useQuery({
    queryKey: recipeKeys.productList(query, storeId),
    queryFn: ({ signal }) => recipeService.getProducts(query, { storeId: storeId!, signal }),
    enabled: Boolean(storeId) && (options?.enabled ?? true),
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

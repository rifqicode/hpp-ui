import { useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useProductsQuery } from './use-recipes-query';
import { useDeleteProduct } from './use-products';
import { useSubscriptionGuards } from '@/features/subscription';
import { usePermission } from '@/hooks/use-permission';
import { filterProducts, getProductMetrics, PRODUCT_SORTS, type ProductAttentionFilter, type ProductSort } from '../lib/product-list';
import type { Product } from '../types';

export function useProductList() {
  const [params, setParams] = useSearchParams();
  const paramsRef = useRef(params);
  useLayoutEffect(() => { paramsRef.current = params; }, [params]);
  const location = useLocation();
  const navigate = useNavigate();
  const query = useProductsQuery();
  const deletion = useDeleteProduct();
  const { can } = usePermission();
  const { isQuotaReached } = useSubscriptionGuards();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [reviewProductState, setReviewProductState] = useState<{ product: Product; variantId?: string } | null>(null);
  const products = query.data || [];
  const search = params.get('q') || '';
  const category = params.get('category') || '';
  const attentionValue = params.get('attention') || 'all';
  const attention: ProductAttentionFilter = ['needs-attention', 'low-stock', 'no-hpp', 'loss', 'price-review'].includes(attentionValue) ? attentionValue as ProductAttentionFilter : 'all';
  const sortValue = params.get('sort') || 'name-asc';
  const sort: ProductSort = Object.hasOwn(PRODUCT_SORTS, sortValue) ? sortValue as ProductSort : 'name-asc';
  const view = params.get('view') === 'grid' ? 'grid' : 'table';
  const filtered = filterProducts(products, search, category, attention, sort);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageValue = Number(params.get('page') || 1);
  const page = Math.min(totalPages, Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1);
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'id-ID'));
  const metrics = products.map(getProductMetrics);
  const stats = { total: products.length, attention: metrics.filter(m => m.needsAttention).length, lowStock: metrics.filter(m => m.lowStock).length, noHpp: metrics.filter(m => !m.hasActualHpp).length, loss: metrics.filter(m => m.loss).length, priceReview: metrics.filter(m => m.priceReview).length };

  function update(values: Record<string, string | undefined>, resetPage = true) {
    // Preserve rapid successive edits while router navigation is still rendering.
    const next = new URLSearchParams(paramsRef.current);
    if (resetPage) next.delete('page');
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    paramsRef.current = next;
    setParams(next, { replace: true });
  }

  function requestUpgrade() {
    window.dispatchEvent(new CustomEvent('open-upgrade-modal', { detail: { message: 'Tingkatkan paket Anda untuk menambah kapasitas produk dan bahan baku.' } }));
  }

  function createProduct() {
    if (isQuotaReached('products')) requestUpgrade();
    else navigate('/production/products/new');
  }

  function selectDelete(product: Product) {
    deletion.reset();
    setProductToDelete(product);
  }

  function closeDelete() {
    if (!deletion.isPending) setProductToDelete(null);
  }

  async function confirmDelete() {
    if (!productToDelete || deletion.isPending) return;
    try {
      await deletion.mutateAsync(productToDelete.id);
      setProductToDelete(null);
    } catch { /* The mutation error remains visible in the confirmation dialog. */ }
  }

  function openPriceReview(product: Product, variantId?: string) {
    setReviewProductState({ product, variantId });
  }

  function closePriceReview() {
    setReviewProductState(null);
  }

  return {
    ...query, search, category, attention, sort, view, categories, stats, page, pageSize, totalPages,
    total: filtered.length, items: filtered.slice((page - 1) * pageSize, page * pageSize),
    hasFilters: Boolean(search || category || attention !== 'all'), update,
    resetFilters: () => update({ q: undefined, category: undefined, attention: undefined }),
    createProduct, requestUpgrade, canCreate: can('products:write'), canDelete: can('products:delete'),
    productToDelete, selectDelete, closeDelete, confirmDelete,
    isDeleting: deletion.isPending, deleteError: deletion.error,
    returnTo: location.pathname + location.search,
    reviewProductState, openPriceReview, closePriceReview,
  };
}

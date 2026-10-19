import type { Product } from '../types';

export type ProductAttentionFilter = 'all' | 'needs-attention' | 'low-stock' | 'no-hpp';
export const PRODUCT_SORTS = {
  'name-asc': 'Nama A–Z',
  'name-desc': 'Nama Z–A',
  'price-asc': 'Harga terendah',
  'price-desc': 'Harga tertinggi',
  'margin-asc': 'Margin terendah',
  'margin-desc': 'Margin tertinggi',
  'stock-asc': 'Stok paling sedikit',
} as const;
export type ProductSort = keyof typeof PRODUCT_SORTS;

export function getProductMetrics(product: Product) {
  const hasActualHpp = product.latestHpp > 0;
  const ingredientCost = product.ingredients.reduce((total, item) => total + item.subtotalCost, 0);
  const estimate = product.estimatedHpp ?? (ingredientCost / (product.yieldQty > 0 ? product.yieldQty : 1)) * (1 + product.wastePct);
  const actualHpp = hasActualHpp ? product.latestHpp : null;
  const estimatedHpp = estimate > 0 ? estimate : null;
  const cost = hasActualHpp ? product.latestHpp : (estimate > 0 ? estimate : null);
  const margin = cost !== null && product.sellingPrice > 0 ? Math.round(((product.sellingPrice - cost) / product.sellingPrice) * 1000) / 10 : null;
  const lowStock = product.mode === 'MAKE_TO_STOCK' && product.currentStock <= product.minStock;
  return {
    cost,
    actualHpp,
    estimatedHpp,
    margin,
    lowStock,
    hasActualHpp,
    needsAttention: lowStock || !hasActualHpp || (margin !== null && margin < 0)
  };
}

export function filterProducts(products: Product[], search: string, category: string, attention: ProductAttentionFilter, sort: ProductSort) {
  const term = search.trim().toLocaleLowerCase('id-ID');
  const result = products.filter((product) => {
    const metrics = getProductMetrics(product);
    const matchesSearch = !term || [product.name, product.category, ...product.ingredients.map((item) => item.stockName)].some((value) => value.toLocaleLowerCase('id-ID').includes(term));
    const matchesAttention = attention === 'all' || (attention === 'needs-attention' && metrics.needsAttention) || (attention === 'low-stock' && metrics.lowStock) || (attention === 'no-hpp' && !metrics.hasActualHpp);
    return matchesSearch && (!category || product.category === category) && matchesAttention;
  });
  return result.sort((a, b) => {
    let order = 0;
    if (sort === 'price-asc') order = a.sellingPrice - b.sellingPrice;
    else if (sort === 'price-desc') order = b.sellingPrice - a.sellingPrice;
    else if (sort === 'stock-asc') order = a.currentStock - b.currentStock;
    else if (sort === 'margin-asc' || sort === 'margin-desc') {
      const left = getProductMetrics(a).margin;
      const right = getProductMetrics(b).margin;
      if (left === null && right !== null) return 1;
      if (right === null && left !== null) return -1;
      order = left === null || right === null ? 0 : sort === 'margin-asc' ? left - right : right - left;
    } else if (sort === 'name-desc') order = b.name.localeCompare(a.name, 'id-ID');
    return order || a.name.localeCompare(b.name, 'id-ID') || a.id.localeCompare(b.id);
  });
}

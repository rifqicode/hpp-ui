import type { Product, ProductVariant } from '../types';
import { suggestPriceFromCost } from './product-form';

export type ProductAttentionFilter = 'all' | 'needs-attention' | 'low-stock' | 'no-hpp' | 'loss' | 'price-review';
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

export function getVariantMetrics(variant: ProductVariant) {
  const hasActual = variant.latestHpp > 0;
  const hasEstimated = variant.estimatedHpp > 0;
  const cost = hasActual ? variant.latestHpp : (hasEstimated ? variant.estimatedHpp : null);
  const isCostHigher = hasActual && hasEstimated && variant.estimatedHpp > variant.latestHpp;
  return {
    hasActual,
    hasEstimated,
    actual: hasActual, // backwards-compatible
    cost,
    isCostHigher,
    margin: cost !== null && variant.sellingPrice > 0 ? ((variant.sellingPrice - cost) / variant.sellingPrice) * 100 : null,
  };
}

export function getPriceReviewReason(variant: ProductVariant) {
  if (!variant.isActive) return null;
  const { hasActual, hasEstimated, isCostHigher, cost } = getVariantMetrics(variant);
  if (hasActual && cost !== null && variant.sellingPrice < cost) return 'below-production-cost';
  if (hasEstimated && variant.sellingPrice < variant.estimatedHpp) return 'below-material-estimate';
  if (isCostHigher) return 'higher-estimate';
  const suggestion = suggestPriceFromCost(hasEstimated ? variant.estimatedHpp : null, variant.targetMargin);
  if (suggestion !== null && suggestion > variant.sellingPrice) return 'higher-suggestion';
  return null;
}

export function needsPriceReview(variant: ProductVariant) {
  return getPriceReviewReason(variant) !== null;
}

export function getProductMetrics(product: Product) {
 const active=product.variants.filter(v=>v.isActive);
 const metrics=active.map(v=>({...getVariantMetrics(v),low:product.mode==='MAKE_TO_STOCK'&&v.currentStock<=v.minStock}));
 const margins=metrics.flatMap(m=>m.margin===null?[]:[m.margin]);
 const hasActualHpp=active.length>0&&active.every(v=>v.latestHpp>0);
 const lowStock=metrics.some(m=>m.low);
 const loss=metrics.some(m=>m.margin!==null&&m.margin<0);
 const priceReview=active.some(needsPriceReview);
 return {hasActualHpp,lowStock,loss,priceReview,margin:margins.length?Math.min(...margins):null,needsAttention:lowStock||!hasActualHpp||loss||priceReview};
}
export function filterProducts(products: Product[], search: string, category: string, attention: ProductAttentionFilter, sort: ProductSort) {
 const term=search.trim().toLocaleLowerCase('id-ID');
 const result=products.filter(p=>{const m=getProductMetrics(p);return (!term||[p.name,p.category,...p.variants.flatMap(v=>[v.variantName,v.sku,...v.ingredients.map(i=>i.stockName)])].some(v=>v.toLocaleLowerCase('id-ID').includes(term)))&&(!category||p.category===category)&&(attention==='all'||attention==='needs-attention'&&m.needsAttention||attention==='low-stock'&&m.lowStock||attention==='no-hpp'&&!m.hasActualHpp||attention==='loss'&&m.loss||attention==='price-review'&&m.priceReview);});
 const price=(p:Product)=>Math.min(...p.variants.filter(v=>v.isActive).map(v=>v.sellingPrice),Infinity);
 const stock=(p:Product)=>Math.min(...p.variants.filter(v=>v.isActive).map(v=>v.currentStock),Infinity);
 return result.sort((a,b)=>{let order=0;
 if(sort==='price-asc')order=price(a)-price(b);else if(sort==='price-desc')order=price(b)-price(a);else if(sort==='stock-asc')order=stock(a)-stock(b);else if(sort==='margin-asc'||sort==='margin-desc'){const left=getProductMetrics(a).margin,right=getProductMetrics(b).margin;if(left===null&&right!==null)return 1;if(right===null&&left!==null)return -1;if(left!==null&&right!==null)order=sort==='margin-asc'?left-right:right-left;}else if(sort==='name-desc')order=b.name.localeCompare(a.name,'id-ID');return order||a.name.localeCompare(b.name,'id-ID')||a.id.localeCompare(b.id);});
}

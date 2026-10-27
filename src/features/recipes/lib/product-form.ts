import type { CreateProductInput, RawMaterialStock, VariantInput } from '../types';

export function isTargetMarginValid(margin: number) {
  return Number.isFinite(margin) && margin >= 0 && margin < 1;
}

export function getRecipeEstimate(variant: VariantInput, materials?: RawMaterialStock[]) {
  if (!materials || !variant.ingredients.length) return null;
  let total = 0;
  for (const line of variant.ingredients) {
    const material = materials.find(item => item.id === line.stockId);
    if (!material || !(line.quantity > 0) || !Number.isFinite(line.quantity) || !Number.isFinite(material.avgCostPerUnit)) return null;
    total += line.quantity * material.avgCostPerUnit;
  }
  return Number.isFinite(total) ? total : null;
}

export function getSuggestedSellingPrice(variant: VariantInput, materials?: RawMaterialStock[]) {
  return suggestPriceFromCost(getRecipeEstimate(variant, materials), variant.targetMargin);
}

export function suggestPriceFromCost(cost: number | null, targetMargin: number) {
  if (cost === null || !Number.isFinite(cost) || cost < 0 || !isTargetMarginValid(targetMargin)) return null;
  if (targetMargin === 0) return cost;
  const price = cost / (1 - targetMargin);
  return Number.isFinite(price) ? Number(price.toFixed(4)) : null;
}

export function newVariant(name: string): VariantInput {
  return { variantName: name, sku: '', unit: 'pcs', sellingPrice: 0, targetMargin: 0, minStock: 0, isActive: true, isDefault: name === 'Regular', ingredients: [] };
}

export function newProductForm(): CreateProductInput {
  return { name: '', category: '', mode: 'MAKE_TO_STOCK', variants: [newVariant('Regular')], modifierGroupIds: [] };
}

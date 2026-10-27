export type ProductMode = 'MAKE_TO_STOCK' | 'MAKE_TO_ORDER';

export interface RawMaterialStock {
  id: string;
  name: string;
  baseUnit: string;
  currentStock: number;
  avgCostPerUnit: number;
}

export interface RecipeIngredient {
  id: string;
  variantId: string;
  stockId: string;
  stockName: string;
  baseUnit: string;
  quantity: number; // Jumlah yang dibutuhkan per 1 unit produk
  unitCost: number; // Biaya per baseUnit bahan baku
  subtotalCost: number; // quantity * unitCost
  availableStock: number; // Stok bahan baku yang ada saat ini
}

export interface ProductBatchLot {
  id: string;
  batchNumber: string;
  initialQuantity: number;
  remainingQuantity: number;
  hppAtProduction: number;
  productionDate: string;
  status: 'active' | 'depleted';
}

export interface PresignedUploadRequest {
  filename: string;
  contentType: string;
  fileSize: number;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export interface ProductEstimateBomItem {
  stockId: string;
  stockName: string;
  quantity: number;
  unitCost: number;
  subtotalCost: number;
}

export interface ProductEstimate {
  variantId: string;
  productName: string;
  sellingPrice: number;
  targetMargin: number;
  rawMaterialTotal: number;
  bomCostPerUnit: number;
  bomItems: ProductEstimateBomItem[];
  estimatedHpp: number;
  recommendedPrice: number;
  actualMargin: number;
  actualMarkup: number;
}

export interface ProductVariant {
 id: string;
 productId: string;
 variantName: string;
 sku: string;
 unit: string;
 sellingPrice: number;
 targetMargin: number;
 currentStock: number;
 latestHpp: number;
 estimatedHpp: number;
 minStock: number;
 isDefault: boolean;
 isActive: boolean;
 ingredients: RecipeIngredient[];
 batches: ProductBatchLot[];
}

export interface Product {
 modifierGroups: ModifierGroup[];
 id: string;
 storeId?: string;
 name: string;
 category: string;
 categoryId?: string;
 mode: ProductMode;
 imageUrl: string | null;
 description: string;
 createdAt: string;
 updatedAt?: string;
 variants: ProductVariant[];
}

// A selected operational variant, enriched with its catalog identity for pickers.
export interface ProductVariantView extends ProductVariant {
 name: string;
 productName: string;
 category: string;
 mode: ProductMode;
 imageUrl: string | null;
 createdAt: string;
}
export interface VariantInput {
 id?: string;
 variantName: string;
 sku: string;
 unit: string;
 sellingPrice: number;
 targetMargin: number;
 minStock: number;
 isDefault: boolean;
 isActive: boolean;
 ingredients: {stockId: string; quantity: number; unit?: string}[];
}
export interface CreateProductInput {
 modifierGroupIds?: string[];
 name: string;
 category: string;
 categoryId?: string;
 mode: ProductMode;
 imageUrl?: string | null;
 description?: string;
 variants: VariantInput[];
}
export type UpdateProductInput = Partial<CreateProductInput>;

export interface ModifierOption {
 id: string;
 name: string;
 price: number;
 stockId: string | null;
 quantity: number;
 unit: string;
 isActive: boolean;
}
export interface ModifierGroup {
 id: string;
 name: string;
 minSelection: number;
 maxSelection: number;
 isActive: boolean;
 productCount: number;
 options: ModifierOption[];
}
export type ModifierGroupInput = Omit<ModifierGroup,'id'|'productCount'|'options'> & {
 options: (Omit<ModifierOption,'id'> & {id?: string})[];
};

export interface AddIngredientInput {
  stockId: string;
  quantity: number;
}

export interface ProductCategory {
  id: string;
  storeId?: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface ProductSummary {
  total_products: number;
  active_products: number;
  low_stock_count: number;
}

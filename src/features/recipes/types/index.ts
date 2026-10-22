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
  productId: string;
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
  productId: string;
  productName: string;
  sellingPrice: number;
  targetMargin: number;
  yieldQty: number;
  wastePct: number;
  rawMaterialTotal: number;
  bomCostPerUnit: number;
  bomItems: ProductEstimateBomItem[];
  estimatedHpp: number;
  recommendedPrice: number;
  actualMargin: number;
  actualMarkup: number;
}

export interface Product {
  id: string;
  storeId?: string;
  sku: string;
  name: string;
  category: string; // e.g. "Roti", "Pastry & Cake", "Donat", "Minuman"
  categoryId?: string;
  categoryName?: string;
  unit: string; // e.g. "pcs", "box", "loyang"
  mode: ProductMode;
  yieldQty: number;
  wastePct: number;
  imageUrl: string | null;
  sellingPrice: number;
  targetMargin?: number;
  currentStock: number;
  latestHpp: number;
  estimatedHpp?: number;
  minStock: number;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  ingredients: RecipeIngredient[];
  batches?: ProductBatchLot[];
}

export interface CreateProductInput {
  sku: string;
  name: string;
  category: string;
  categoryId?: string;
  unit: string;
  mode?: ProductMode;
  yieldQty?: number;
  wastePct?: number;
  imageUrl?: string | null;
  sellingPrice?: number;
  targetMargin?: number;
  minStock?: number;
  description?: string;
  initialIngredients?: { stockId: string; quantity: number }[];
}

export interface UpdateProductInput {
  sku?: string;
  name?: string;
  category?: string;
  categoryId?: string;
  unit?: string;
  mode?: ProductMode;
  yieldQty?: number;
  wastePct?: number;
  imageUrl?: string | null;
  sellingPrice?: number;
  targetMargin?: number;
  currentStock?: number;
  minStock?: number;
  description?: string;
}

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

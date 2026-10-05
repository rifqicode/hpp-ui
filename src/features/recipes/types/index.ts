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

export interface Product {
  id: string;
  storeId?: string;
  name: string;
  category: string; // e.g. "Roti", "Pastry & Cake", "Donat", "Minuman"
  unit: string; // e.g. "pcs", "box", "loyang"
  sellingPrice: number;
  targetMargin?: number;
  currentStock: number;
  latestHpp: number;
  minStock: number;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  ingredients: RecipeIngredient[];
  batches?: ProductBatchLot[];
}

export interface CreateProductInput {
  name: string;
  category: string;
  unit: string;
  sellingPrice?: number;
  targetMargin?: number;
  minStock?: number;
  description?: string;
  initialIngredients?: { stockId: string; quantity: number }[];
}

export interface UpdateProductInput {
  name?: string;
  category?: string;
  unit?: string;
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

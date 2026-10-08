import apiClient from '../../../lib/api-client';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  AddIngredientInput,
  RawMaterialStock,
  RecipeIngredient,
  ProductBatchLot,
  ProductCategory,
} from '../types';

export const AVAILABLE_MATERIALS: RawMaterialStock[] = [];

let LOCAL_PRODUCTS: Product[] = [];

function parseNumber(val: unknown, fallback = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

interface RawRecipeIngredient {
  id: string;
  product_id?: string;
  productId?: string;
  stock_id?: string;
  stockId?: string;
  stock_name?: string;
  stockName?: string;
  base_unit?: string;
  baseUnit?: string;
  quantity: number | string;
  unit_cost?: number | string;
  unitCost?: number | string;
  subtotal_cost?: number | string;
  subtotalCost?: number | string;
  available_stock?: number | string;
  availableStock?: number | string;
}

interface RawProductBatch {
  id: string;
  batch_number?: string;
  batchNumber?: string;
  initial_quantity?: number | string;
  initialQuantity?: number | string;
  remaining_quantity?: number | string;
  remainingQuantity?: number | string;
  hpp_at_production?: number | string;
  hppAtProduction?: number | string;
  production_date?: string;
  productionDate?: string;
  status?: 'active' | 'depleted';
}

interface RawProduct {
  id: string;
  store_id?: string;
  storeId?: string;
  name: string;
  category?: string;
  unit?: string;
  selling_price?: number | string;
  sellingPrice?: number | string;
  target_margin?: number | string;
  targetMargin?: number | string;
  min_stock?: number | string;
  minStock?: number | string;
  description?: string;
  current_stock?: number | string;
  currentStock?: number | string;
  latest_hpp?: number | string;
  latestHpp?: number | string;
  estimated_hpp?: number | string;
  estimatedHpp?: number | string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  ingredients?: RawRecipeIngredient[];
  batches?: RawProductBatch[];
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface RawStockItem {
  id: string;
  name: string;
  base_unit?: string;
  baseUnit?: string;
  current_stock?: number | string;
  currentStock?: number | string;
  cost_per_unit?: number | string;
  costPerUnit?: number | string;
  avgCostPerUnit?: number | string;
}

export function transformProductFromApi(raw: RawProduct): Product {
  const ingredients: RecipeIngredient[] = (raw.ingredients || []).map((ing) => {
    const qty = parseNumber(ing.quantity);
    const unitCost = parseNumber(ing.unit_cost ?? ing.unitCost);
    const subtotal = parseNumber(ing.subtotal_cost ?? ing.subtotalCost, qty * unitCost);
    return {
      id: ing.id,
      productId: ing.product_id || ing.productId || raw.id,
      stockId: ing.stock_id || ing.stockId || '',
      stockName: ing.stock_name || ing.stockName || 'Bahan Baku',
      baseUnit: ing.base_unit || ing.baseUnit || 'satuan',
      quantity: qty,
      unitCost,
      subtotalCost: subtotal,
      availableStock: parseNumber(ing.available_stock ?? ing.availableStock),
    };
  });

  const batches: ProductBatchLot[] = (raw.batches || []).map((b) => ({
    id: b.id,
    batchNumber: b.batch_number || b.batchNumber || `LOT-${b.id.substring(0, 6)}`,
    initialQuantity: parseNumber(b.initial_quantity ?? b.initialQuantity),
    remainingQuantity: parseNumber(b.remaining_quantity ?? b.remainingQuantity),
    hppAtProduction: parseNumber(b.hpp_at_production ?? b.hppAtProduction),
    productionDate: b.production_date || b.productionDate || new Date().toISOString(),
    status: (b.status || (parseNumber(b.remaining_quantity ?? b.remainingQuantity) > 0 ? 'active' : 'depleted')) as 'active' | 'depleted',
  }));

  const sellingPrice = parseNumber(raw.selling_price ?? raw.sellingPrice);
  const targetMargin = parseNumber(raw.target_margin ?? raw.targetMargin);
  const minStock = parseNumber(raw.min_stock ?? raw.minStock);
  const currentStock = parseNumber(raw.current_stock ?? raw.currentStock);
  const latestHpp = parseNumber(raw.latest_hpp ?? raw.latestHpp);

  return {
    id: raw.id,
    storeId: raw.store_id || raw.storeId,
    name: raw.name,
    category: raw.category || 'Roti',
    unit: raw.unit || 'pcs',
    sellingPrice,
    targetMargin,
    minStock,
    description: raw.description || '',
    currentStock,
    latestHpp,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt,
    ingredients,
    batches,
  };
}

export const recipeService = {
  getProducts: async (query?: { search?: string; category?: string }): Promise<Product[]> => {
    try {
      const params = new URLSearchParams();
      if (query?.search) params.append('search', query.search);
      if (query?.category && query.category !== 'All') params.append('category', query.category);
      params.append('limit', '1000');
      const queryString = params.toString();
      const url = queryString ? `/products?${queryString}` : '/products?limit=1000';
      const response = await apiClient.get<PaginatedResponse<RawProduct> | RawProduct[]>(url);

      let rawItems: RawProduct[] = [];
      if (Array.isArray(response.data)) {
        rawItems = response.data;
      } else if (response.data && Array.isArray(response.data.items)) {
        rawItems = response.data.items;
      }

      if (rawItems.length > 0 || (response.data && 'items' in response.data)) {
        const transformed = rawItems.map(transformProductFromApi);
        LOCAL_PRODUCTS = transformed;
        return transformed;
      }
      return [...LOCAL_PRODUCTS];
    } catch {
      return [...LOCAL_PRODUCTS];
    }
  },

  getProductById: async (id: string): Promise<Product> => {
    try {
      const response = await apiClient.get<RawProduct>(`/products/${id}`);
      if (response.data && response.data.id) {
        const transformed = transformProductFromApi(response.data);
        const idx = LOCAL_PRODUCTS.findIndex((p) => p.id === id);
        if (idx >= 0) {
          LOCAL_PRODUCTS[idx] = transformed;
        } else {
          LOCAL_PRODUCTS.push(transformed);
        }
        return transformed;
      }
      throw new Error('Produk tidak ditemukan');
    } catch {
      const found = LOCAL_PRODUCTS.find((p) => p.id === id);
      if (!found) {
        throw new Error('Produk/Resep tidak ditemukan');
      }
      return found;
    }
  },

  createProduct: async (data: CreateProductInput): Promise<Product> => {
    try {
      const payload = {
        name: data.name,
        category: data.category || 'Roti',
        unit: data.unit || 'pcs',
        selling_price: data.sellingPrice !== undefined ? Number(data.sellingPrice) : 0,
        target_margin: data.targetMargin !== undefined ? Number(data.targetMargin) : 0,
        min_stock: data.minStock !== undefined ? Number(data.minStock) : 0,
        description: data.description || '',
        initial_ingredients: (data.initialIngredients || []).map((item) => ({
          stock_id: item.stockId,
          quantity: Number(item.quantity),
        })),
      };

      const response = await apiClient.post<RawProduct>('/products', payload);
      const transformed = transformProductFromApi(response.data);
      LOCAL_PRODUCTS = [transformed, ...LOCAL_PRODUCTS];
      return transformed;
    } catch {
      // Local fallback simulation
      const newIngredients: RecipeIngredient[] = [];
      if (data.initialIngredients && data.initialIngredients.length > 0) {
        for (const item of data.initialIngredients) {
          const mat = AVAILABLE_MATERIALS.find((m) => m.id === item.stockId);
          if (mat) {
            newIngredients.push({
              id: `ing-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              productId: `prod-${Date.now()}`,
              stockId: mat.id,
              stockName: mat.name,
              baseUnit: mat.baseUnit,
              quantity: item.quantity,
              unitCost: mat.avgCostPerUnit,
              subtotalCost: item.quantity * mat.avgCostPerUnit,
              availableStock: mat.currentStock,
            });
          }
        }
      }

      const totalIngCost = newIngredients.reduce((acc, curr) => acc + curr.subtotalCost, 0);
      const estHpp = totalIngCost > 0 ? totalIngCost * 1.15 : 0;
      const margin = data.targetMargin || 50;
      const calculatedSellingPrice = data.sellingPrice && data.sellingPrice > 0
        ? Number(data.sellingPrice)
        : (estHpp > 0 && margin < 100 ? Math.ceil((estHpp / (1 - margin / 100)) / 500) * 500 : 10000);

      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: data.name,
        category: data.category || "Roti",
        unit: data.unit || "pcs",
        sellingPrice: calculatedSellingPrice,
        targetMargin: margin,
        currentStock: 0,
        latestHpp: estHpp,
        minStock: Number(data.minStock) || 10,
        description: data.description || "",
        createdAt: new Date().toISOString(),
        ingredients: newIngredients,
        batches: [],
      };

      LOCAL_PRODUCTS = [newProduct, ...LOCAL_PRODUCTS];
      return newProduct;
    }
  },

  updateProduct: async (id: string, data: UpdateProductInput): Promise<Product> => {
    try {
      const payload: Record<string, unknown> = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.category !== undefined) payload.category = data.category;
      if (data.unit !== undefined) payload.unit = data.unit;
      if (data.sellingPrice !== undefined) payload.selling_price = Number(data.sellingPrice);
      if (data.targetMargin !== undefined) payload.target_margin = Number(data.targetMargin);
      if (data.minStock !== undefined) payload.min_stock = Number(data.minStock);
      if (data.description !== undefined) payload.description = data.description;

      const response = await apiClient.put<RawProduct>(`/products/${id}`, payload);
      const transformed = transformProductFromApi(response.data);
      const index = LOCAL_PRODUCTS.findIndex((p) => p.id === id);
      if (index >= 0) {
        LOCAL_PRODUCTS[index] = transformed;
      }
      return transformed;
    } catch {
      const index = LOCAL_PRODUCTS.findIndex((p) => p.id === id);
      if (index === -1) {
        throw new Error('Produk tidak ditemukan');
      }

      const existing = LOCAL_PRODUCTS[index];
      const updated: Product = {
        ...existing,
        ...data,
        sellingPrice: data.sellingPrice !== undefined ? Number(data.sellingPrice) : existing.sellingPrice,
        minStock: data.minStock !== undefined ? Number(data.minStock) : existing.minStock,
        currentStock: data.currentStock !== undefined ? Number(data.currentStock) : existing.currentStock,
        updatedAt: new Date().toISOString(),
      };

      LOCAL_PRODUCTS[index] = updated;
      return updated;
    }
  },

  deleteProduct: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/products/${id}`);
    } finally {
      LOCAL_PRODUCTS = LOCAL_PRODUCTS.filter((p) => p.id !== id);
    }
  },

  addIngredient: async (productId: string, data: AddIngredientInput): Promise<Product> => {
    try {
      const payload = {
        stock_id: data.stockId,
        quantity: Number(data.quantity),
      };
      const response = await apiClient.post<RawProduct>(`/products/${productId}/recipe`, payload);
      const transformed = transformProductFromApi(response.data);
      const prodIndex = LOCAL_PRODUCTS.findIndex((p) => p.id === productId);
      if (prodIndex >= 0) {
        LOCAL_PRODUCTS[prodIndex] = transformed;
      }
      return transformed;
    } catch {
      const prodIndex = LOCAL_PRODUCTS.findIndex((p) => p.id === productId);
      if (prodIndex === -1) throw new Error('Produk tidak ditemukan');

      const mat = AVAILABLE_MATERIALS.find((m) => m.id === data.stockId);
      if (!mat) throw new Error('Bahan baku tidak valid');

      const prod = { ...LOCAL_PRODUCTS[prodIndex] };
      const existingIngIndex = prod.ingredients.findIndex((ing) => ing.stockId === data.stockId);

      const qty = Number(data.quantity);
      if (existingIngIndex > -1) {
        const existing = prod.ingredients[existingIngIndex];
        const newQty = existing.quantity + qty;
        prod.ingredients[existingIngIndex] = {
          ...existing,
          quantity: newQty,
          subtotalCost: newQty * existing.unitCost,
        };
      } else {
        prod.ingredients = [
          ...prod.ingredients,
          {
            id: `ing-${Date.now()}`,
            productId,
            stockId: mat.id,
            stockName: mat.name,
            baseUnit: mat.baseUnit,
            quantity: qty,
            unitCost: mat.avgCostPerUnit,
            subtotalCost: qty * mat.avgCostPerUnit,
            availableStock: mat.currentStock,
          },
        ];
      }

      LOCAL_PRODUCTS[prodIndex] = prod;
      return prod;
    }
  },

  updateIngredientQuantity: async (productId: string, ingredientId: string, quantity: number): Promise<Product> => {
    try {
      const payload = {
        quantity: Number(quantity),
      };
      const response = await apiClient.put<RawProduct>(`/products/${productId}/recipe/${ingredientId}`, payload);
      const transformed = transformProductFromApi(response.data);
      const prodIndex = LOCAL_PRODUCTS.findIndex((p) => p.id === productId);
      if (prodIndex >= 0) {
        LOCAL_PRODUCTS[prodIndex] = transformed;
      }
      return transformed;
    } catch {
      const prodIndex = LOCAL_PRODUCTS.findIndex((p) => p.id === productId);
      if (prodIndex === -1) throw new Error('Produk tidak ditemukan');

      const prod = { ...LOCAL_PRODUCTS[prodIndex] };
      const ingIndex = prod.ingredients.findIndex((ing) => ing.id === ingredientId);
      if (ingIndex === -1) throw new Error('Bahan resep tidak ditemukan');

      const ing = prod.ingredients[ingIndex];
      prod.ingredients[ingIndex] = {
        ...ing,
        quantity,
        subtotalCost: quantity * ing.unitCost,
      };

      LOCAL_PRODUCTS[prodIndex] = prod;
      return prod;
    }
  },

  removeIngredient: async (productId: string, ingredientId: string): Promise<Product> => {
    try {
      const response = await apiClient.delete<RawProduct>(`/products/${productId}/recipe/${ingredientId}`);
      if (response.data && response.data.id) {
        const transformed = transformProductFromApi(response.data);
        const prodIndex = LOCAL_PRODUCTS.findIndex((p) => p.id === productId);
        if (prodIndex >= 0) {
          LOCAL_PRODUCTS[prodIndex] = transformed;
        }
        return transformed;
      }
    } catch {
      // Local fallback
    }

    const prodIndex = LOCAL_PRODUCTS.findIndex((p) => p.id === productId);
    if (prodIndex === -1) throw new Error('Produk tidak ditemukan');

    const prod = { ...LOCAL_PRODUCTS[prodIndex] };
    prod.ingredients = prod.ingredients.filter((ing) => ing.id !== ingredientId);
    LOCAL_PRODUCTS[prodIndex] = prod;
    return prod;
  },

  getAvailableMaterials: async (): Promise<RawMaterialStock[]> => {
    try {
      const response = await apiClient.get<{ items: RawStockItem[] }>('/stocks?page=1&limit=1000');
      const items = response.data?.items || [];
      if (Array.isArray(items) && items.length > 0) {
        return items.map((s) => ({
          id: s.id,
          name: s.name,
          baseUnit: s.base_unit || s.baseUnit || 'satuan',
          currentStock: parseNumber(s.current_stock ?? s.currentStock),
          avgCostPerUnit: parseNumber(s.cost_per_unit ?? s.costPerUnit ?? s.avgCostPerUnit ?? 0),
        }));
      }
      return [...AVAILABLE_MATERIALS];
    } catch {
      return [...AVAILABLE_MATERIALS];
    }
  },

  getCategories: async (): Promise<ProductCategory[]> => {
    try {
      const response = await apiClient.get<ProductCategory[]>('/products/categories');
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch {
      return [];
    }
  },

  createCategory: async (name: string, description?: string): Promise<ProductCategory> => {
    const response = await apiClient.post<ProductCategory>('/products/categories', {
      name,
      description: description || '',
    });
    return response.data;
  },

  deleteCategory: async (categoryId: string): Promise<void> => {
    await apiClient.delete(`/products/categories/${categoryId}`);
  },
};

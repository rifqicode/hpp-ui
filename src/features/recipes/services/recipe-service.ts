import apiClient from '../../../lib/api-client';
import type {
  Product,
  ProductSummary,
  ProductMode,
  CreateProductInput,
  UpdateProductInput,
  AddIngredientInput,
  RawMaterialStock,
  RecipeIngredient,
  ProductBatchLot,
  ProductCategory,
  PresignedUploadRequest,
  PresignedUploadResponse,
  ProductEstimate,
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
  sku?: string;
  name: string;
  category?: string;
  category_id?: string;
  categoryId?: string;
  category_name?: string;
  categoryName?: string;
  unit?: string;
  mode?: ProductMode | string;
  yield_qty?: number | string;
  yieldQty?: number | string;
  waste_pct?: number | string;
  wastePct?: number | string;
  image_url?: string | null;
  imageUrl?: string | null;
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
  const yieldQty = parseNumber(raw.yield_qty ?? raw.yieldQty, 1);
  const wastePct = parseNumber(raw.waste_pct ?? raw.wastePct, 0);
  const mode: ProductMode = (raw.mode === 'MAKE_TO_ORDER' ? 'MAKE_TO_ORDER' : 'MAKE_TO_STOCK');
  const imageUrl = raw.image_url ?? raw.imageUrl ?? null;
  const categoryId = raw.category_id || raw.categoryId || '';
  const categoryName = raw.category_name || raw.categoryName || raw.category || '';

  return {
    id: raw.id,
    storeId: raw.store_id || raw.storeId,
    sku: raw.sku || '',
    name: raw.name,
    category: categoryName || 'Roti',
    categoryId,
    categoryName,
    unit: raw.unit || 'pcs',
    mode,
    yieldQty: yieldQty > 0 ? yieldQty : 1,
    wastePct,
    imageUrl,
    sellingPrice,
    targetMargin,
    minStock,
    description: raw.description || '',
    currentStock,
    latestHpp,
    estimatedHpp: raw.estimated_hpp != null || raw.estimatedHpp != null ? parseNumber(raw.estimated_hpp ?? raw.estimatedHpp) : undefined,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt,
    ingredients,
    batches,
  };
}

export const recipeService = {
  getProducts: async (query?: { search?: string; category?: string; sort?: string }, options?: { storeId?: string; signal?: AbortSignal }): Promise<Product[]> => {
    const products: Product[] = [];
    let page = 1;
    let totalPages: number;
    do {
      const response = await apiClient.get<PaginatedResponse<RawProduct> | RawProduct[]>('/products', {
        params: {
          search: query?.search,
          category: query?.category !== 'All' ? query?.category : undefined,
          sort_by: query?.sort,
          sortBy: query?.sort,
          page,
          limit: 100,
        },
        headers: options?.storeId ? { 'X-Store-ID': options.storeId } : undefined,
        signal: options?.signal,
      });
      if (Array.isArray(response.data)) {
        products.push(...response.data.map(transformProductFromApi));
        break;
      }
      if (!response.data || !Array.isArray(response.data.items)) throw new Error('Invalid product list response');
      products.push(...response.data.items.map(transformProductFromApi));
      totalPages = response.data.total_pages || 1;
      if (page < totalPages && response.data.items.length === 0) throw new Error('Incomplete product list response');
      page++;
    } while (page <= totalPages);
    LOCAL_PRODUCTS = products;
    return products;
  },

  getProductSummary: async (): Promise<ProductSummary> => {
    const response = await apiClient.get<ProductSummary>('/products/summary');
    return response.data;
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
      const payload: Record<string, unknown> = {
        sku: data.sku,
        name: data.name,
        category: data.category || 'Roti',
        unit: data.unit || 'pcs',
        mode: data.mode || 'MAKE_TO_STOCK',
        yield_qty: data.yieldQty !== undefined ? Number(data.yieldQty) : 1,
        waste_pct: data.wastePct !== undefined ? Number(data.wastePct) : 0,
        selling_price: data.sellingPrice !== undefined ? Number(data.sellingPrice) : 0,
        target_margin: data.targetMargin !== undefined ? Number(data.targetMargin) : 0,
        min_stock: data.minStock !== undefined ? Number(data.minStock) : 0,
        description: data.description || '',
        initial_ingredients: (data.initialIngredients || []).map((item) => ({
          stock_id: item.stockId,
          quantity: Number(item.quantity),
        })),
      };

      if (data.categoryId) payload.category_id = data.categoryId;
      if (data.imageUrl !== undefined) payload.image_url = data.imageUrl;

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
      const yieldQty = data.yieldQty && data.yieldQty > 0 ? Number(data.yieldQty) : 1;
      const wastePct = data.wastePct ? Number(data.wastePct) : 0;
      const estHpp = totalIngCost > 0 ? (totalIngCost / yieldQty) * (1 + wastePct / 100) : 0;
      const margin = data.targetMargin || 50;
      const calculatedSellingPrice = data.sellingPrice && data.sellingPrice > 0
        ? Number(data.sellingPrice)
        : (estHpp > 0 && margin < 100 ? Math.ceil((estHpp / (1 - margin / 100)) / 500) * 500 : 10000);

      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        sku: data.sku || `SKU-${Date.now()}`,
        name: data.name,
        category: data.category || "Roti",
        categoryId: data.categoryId || '',
        categoryName: data.category || 'Roti',
        unit: data.unit || "pcs",
        mode: data.mode || "MAKE_TO_STOCK",
        yieldQty: yieldQty,
        wastePct: wastePct,
        imageUrl: data.imageUrl ?? null,
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
      if (data.sku !== undefined) payload.sku = data.sku;
      if (data.name !== undefined) payload.name = data.name;
      if (data.category !== undefined) payload.category = data.category;
      if (data.categoryId !== undefined) payload.category_id = data.categoryId;
      if (data.unit !== undefined) payload.unit = data.unit;
      if (data.mode !== undefined) payload.mode = data.mode;
      if (data.yieldQty !== undefined) payload.yield_qty = Number(data.yieldQty);
      if (data.wastePct !== undefined) payload.waste_pct = Number(data.wastePct);
      if (data.imageUrl !== undefined) payload.image_url = data.imageUrl;
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
        yieldQty: data.yieldQty !== undefined ? Number(data.yieldQty) : existing.yieldQty,
        wastePct: data.wastePct !== undefined ? Number(data.wastePct) : existing.wastePct,
        mode: data.mode !== undefined ? data.mode : existing.mode,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl,
        categoryId: data.categoryId !== undefined ? data.categoryId : existing.categoryId,
        updatedAt: new Date().toISOString(),
      };

      LOCAL_PRODUCTS[index] = updated;
      return updated;
    }
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
    LOCAL_PRODUCTS = LOCAL_PRODUCTS.filter((product) => product.id !== id);
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
        const result = await Promise.all(
          items.map(async (s) => {
            let cost = parseNumber(s.cost_per_unit ?? s.costPerUnit ?? s.avgCostPerUnit ?? 0);
            if (cost === 0) {
              try {
                const detail = await apiClient.get<{
                  active_batches?: { price_per_unit: number; remaining_quantity: number }[];
                  stock?: { cost_per_unit?: number };
                }>(`/stocks/${s.id}`);
                if (detail.data?.stock?.cost_per_unit) {
                  cost = parseNumber(detail.data.stock.cost_per_unit);
                } else {
                  const batches = detail.data?.active_batches || [];
                  let totalQty = 0;
                  let totalVal = 0;
                  for (const b of batches) {
                    const q = Number(b.remaining_quantity) || 0;
                    const p = Number(b.price_per_unit) || 0;
                    if (q > 0) {
                      totalQty += q;
                      totalVal += q * p;
                    }
                  }
                  if (totalQty > 0) {
                    cost = totalVal / totalQty;
                  } else if (batches.length > 0) {
                    cost = Number(batches[0].price_per_unit) || 0;
                  }
                }
              } catch {
                // ignore fallback error
              }
            }
            return {
              id: s.id,
              name: s.name,
              baseUnit: s.base_unit || s.baseUnit || 'satuan',
              currentStock: parseNumber(s.current_stock ?? s.currentStock),
              avgCostPerUnit: cost,
            };
          })
        );
        return result;
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

  getPresignedUploadUrl: async (data: PresignedUploadRequest): Promise<PresignedUploadResponse> => {
    const response = await apiClient.post<{
      upload_url?: string;
      uploadUrl?: string;
      public_url?: string;
      publicUrl?: string;
      key?: string;
    }>('/products/upload-presigned-url', {
      filename: data.filename,
      content_type: data.contentType,
      file_size: data.fileSize,
    });

    const res = response.data;
    return {
      uploadUrl: res.upload_url || res.uploadUrl || '',
      publicUrl: res.public_url || res.publicUrl || '',
      key: res.key || '',
    };
  },

  uploadProductImage: async (file: File): Promise<string> => {
    const presigned = await recipeService.getPresignedUploadUrl({
      filename: file.name,
      contentType: file.type || 'image/jpeg',
      fileSize: file.size,
    });

    if (!presigned?.uploadUrl) {
      throw new Error('Gagal mendapatkan izin upload S3 dari server');
    }

    const uploadRes = await fetch(presigned.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'image/jpeg',
      },
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload gambar ke S3 gagal (HTTP ${uploadRes.status})`);
    }

    return presigned.publicUrl;
  },

  getProductEstimate: async (productId: string): Promise<ProductEstimate> => {
    try {
      const response = await apiClient.get<Record<string, unknown>>(`/products/${productId}/estimate`);
      const data = response.data;

      const rawBomItems = (data.bom_items || data.bomItems || []) as Array<Record<string, unknown>>;

      return {
        productId: String(data.product_id || data.productId || productId),
        productName: String(data.product_name || data.productName || ''),
        sellingPrice: parseNumber(data.selling_price ?? data.sellingPrice),
        targetMargin: parseNumber(data.target_margin ?? data.targetMargin),
        yieldQty: parseNumber(data.yield_qty ?? data.yieldQty, 1),
        wastePct: parseNumber(data.waste_pct ?? data.wastePct, 0),
        rawMaterialTotal: parseNumber(data.raw_material_total ?? data.rawMaterialTotal),
        bomCostPerUnit: parseNumber(data.bom_cost_per_unit ?? data.bomCostPerUnit),
        bomItems: rawBomItems.map((b) => ({
          stockId: String(b.stock_id || b.stockId || ''),
          stockName: String(b.stock_name || b.stockName || ''),
          quantity: parseNumber(b.quantity),
          unitCost: parseNumber(b.unit_cost ?? b.unitCost),
          subtotalCost: parseNumber(b.subtotal_cost ?? b.subtotalCost),
        })),
        estimatedHpp: parseNumber(data.estimated_hpp ?? data.estimatedHpp),
        recommendedPrice: parseNumber(data.recommended_price ?? data.recommendedPrice),
        actualMargin: parseNumber(data.actual_margin ?? data.actualMargin),
        actualMarkup: parseNumber(data.actual_markup ?? data.actualMarkup),
      };
    } catch {
      // Mock / fallback calculation if estimate endpoint is offline
      const prod = LOCAL_PRODUCTS.find((p) => p.id === productId);
      const yieldQty = prod?.yieldQty && prod.yieldQty > 0 ? prod.yieldQty : 1;
      const wastePct = prod?.wastePct || 0;
      const sellingPrice = prod?.sellingPrice || 0;
      const targetMargin = prod?.targetMargin || 0;

      const bomItems = (prod?.ingredients || []).map((ing) => ({
        stockId: ing.stockId,
        stockName: ing.stockName,
        quantity: ing.quantity,
        unitCost: ing.unitCost,
        subtotalCost: ing.subtotalCost,
      }));
      const rawMaterialTotal = bomItems.reduce((acc, curr) => acc + curr.subtotalCost, 0);
      const bomCostPerUnit = (rawMaterialTotal / yieldQty) * (1 + wastePct / 100);

      const estimatedHpp = bomCostPerUnit;
      const recommendedPrice = estimatedHpp > 0 && targetMargin < 100
        ? Math.ceil((estimatedHpp / (1 - targetMargin / 100)) / 500) * 500
        : estimatedHpp * 1.5;
      const actualMargin = sellingPrice > 0 ? ((sellingPrice - estimatedHpp) / sellingPrice) * 100 : 0;
      const actualMarkup = estimatedHpp > 0 ? ((sellingPrice - estimatedHpp) / estimatedHpp) * 100 : 0;

      return {
        productId,
        productName: prod?.name || 'Produk',
        sellingPrice,
        targetMargin,
        yieldQty,
        wastePct,
        rawMaterialTotal,
        bomCostPerUnit,
        bomItems,
        estimatedHpp,
        recommendedPrice,
        actualMargin,
        actualMarkup,
      };
    }
  },
};

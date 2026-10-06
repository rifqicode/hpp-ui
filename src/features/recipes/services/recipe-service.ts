import apiClient from '../../../lib/api-client';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  AddIngredientInput,
  RawMaterialStock,
  RecipeIngredient,
} from '../types';

export const AVAILABLE_MATERIALS: RawMaterialStock[] = [];

let LOCAL_PRODUCTS: Product[] = [];

export const recipeService = {
  getProducts: async (): Promise<Product[]> => {
    try {
      const response = await apiClient.get<Product[]>('/products');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return [...LOCAL_PRODUCTS];
    } catch {
      return [...LOCAL_PRODUCTS];
    }
  },

  getProductById: async (id: string): Promise<Product> => {
    try {
      const response = await apiClient.get<Product>(`/products/${id}`);
      return response.data;
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
      const response = await apiClient.post<Product>('/products', data);
      return response.data;
    } catch {
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
        latestHpp: estHpp, // Estimasi awal HPP (+15% overhead)
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
      const response = await apiClient.put<Product>(`/products/${id}`, data);
      return response.data;
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
    } catch {
      LOCAL_PRODUCTS = LOCAL_PRODUCTS.filter((p) => p.id !== id);
    }
  },

  addIngredient: async (productId: string, data: AddIngredientInput): Promise<Product> => {
    try {
      const response = await apiClient.post<Product>(`/products/${productId}/recipe`, data);
      return response.data;
    } catch {
      const prodIndex = LOCAL_PRODUCTS.findIndex((p) => p.id === productId);
      if (prodIndex === -1) throw new Error('Produk tidak ditemukan');

      const mat = AVAILABLE_MATERIALS.find((m) => m.id === data.stockId);
      if (!mat) throw new Error('Bahan baku tidak valid');

      const prod = { ...LOCAL_PRODUCTS[prodIndex] };
      const existingIngIndex = prod.ingredients.findIndex((ing) => ing.stockId === data.stockId);

      const qty = Number(data.quantity);
      if (existingIngIndex > -1) {
        // Update existing ingredient
        const existing = prod.ingredients[existingIngIndex];
        const newQty = existing.quantity + qty;
        prod.ingredients[existingIngIndex] = {
          ...existing,
          quantity: newQty,
          subtotalCost: newQty * existing.unitCost,
        };
      } else {
        // Add new ingredient
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
  },

  removeIngredient: async (productId: string, ingredientId: string): Promise<Product> => {
    try {
      await apiClient.delete(`/products/${productId}/recipe/${ingredientId}`);
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
    return [...AVAILABLE_MATERIALS];
  },
};

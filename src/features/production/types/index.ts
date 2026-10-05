export type ProductionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ConsumedIngredient {
  stockId: string;
  stockName: string;
  baseUnit: string;
  quantity: number;
  cost: number;
}

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  storeId?: string;
  productId: string;
  productName: string;
  productCategory: string;
  productUnit: string;
  sellingPrice: number;
  status: ProductionStatus;
  targetQuantity: number;
  goodQuantity?: number;
  wasteQuantity?: number;
  stockCost: number;
  overheadCost?: number;
  overheadBreakdown?: {
    labor: number;
    energy: number;
    packaging: number;
    other?: number;
  };
  totalCost?: number;
  hppPerUnit?: number;
  startedAt: string;
  completedAt?: string;
  notes?: string;
  ingredients: ConsumedIngredient[];
}

export interface StartProductionInput {
  productId: string;
  targetQuantity: number;
  notes?: string;
  customIngredients?: { stockId: string; quantity: number }[];
}

export interface CompleteProductionInput {
  goodQuantity: number;
  wasteQuantity: number;
  overheadLabor?: number;
  overheadEnergy?: number;
  overheadPackaging?: number;
  overheadOther?: number;
  notes?: string;
}

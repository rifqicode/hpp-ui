import type { CreateProductInput, Product } from '@/features/recipes/types';

export interface MaterialDraft {
  key: string;
  stockId: string;
  savedKey?: string;
  name: string;
  baseUnit: 'g' | 'ml' | 'pcs';
  price: string;
  packageQuantity: string;
}
export interface OnboardingProductDraft {
  key: string;
  existingProductId: string;
  builderStep: number;
  builderVariantIndex: number;
  form: CreateProductInput;
}
export interface OnboardingDraft {
  completedSteps?: number[];
  materials: MaterialDraft[];
  product: OnboardingProductDraft;
}
export interface OnboardingState {
  id: string; store_id: string; status: 'IN_PROGRESS' | 'SKIPPED' | 'COMPLETED'; step: number;
  revision: number; draft: Partial<OnboardingDraft>; product_id: string | null;
}
export interface OnboardingData { state: OnboardingState | null; should_start: boolean; dismissed?: boolean; product?: Product }
export interface OnboardingMaterial { id: string; name: string; base_unit: string; cost_per_unit: string | number; reference_unit_cost: string | number }
export type OnboardingAction = 'start' | 'save' | 'skip' | 'complete';

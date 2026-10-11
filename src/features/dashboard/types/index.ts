export interface ActiveProductionBatch {
  id: string;
  batch_number: string;
  product_id: string;
  product_name: string;
  product_unit: string;
  category: string;
  target_quantity: string;
  started_at: string;
  elapsed_minutes: number;
}

export interface WasteScrapSummary {
  total_target_quantity: string;
  total_good_quantity: string;
  total_waste_quantity: string;
  scrap_rate_pct: string;
  completed_batches: number;
}

export interface LowStockAlertItem {
  stock_id: string;
  stock_name: string;
  base_unit: string;
  current_stock: string;
  min_stock: string;
  status: 'OUT' | 'LOW';
}

export interface ExpiringStockBatchItem {
  batch_id: string;
  stock_id: string;
  stock_name: string;
  base_unit: string;
  remaining_quantity: string;
  price_per_unit: string;
  expired_at: string;
  days_until_expiry: number;
}

export interface OperationalDashboardData {
  active_batches: ActiveProductionBatch[];
  active_batch_count: number;
  waste_scrap_summary: WasteScrapSummary;
  low_stock_alerts: LowStockAlertItem[];
  expiring_batches: ExpiringStockBatchItem[];
  pending_po_count: number;
  total_inventory_valuation: string;
}

export interface CostBreakdown {
  bom_cost: string;
  labor_cost: string;
  overhead_cost: string;
  total_cost: string;
  bom_share_pct: string;
  labor_share_pct: string;
  overhead_share_pct: string;
}

export interface ProductMarginItem {
  product_id: string;
  product_name: string;
  category: string;
  selling_price: string;
  hpp: string;
  target_margin: string;
  margin_pct: string;
  profit_unit: string;
}

export interface RecipeVsRealizedItem {
  product_id: string;
  product_name: string;
  category: string;
  recipe_hpp: string;
  realized_hpp: string;
  variance_amount: string;
  variance_pct: string;
}

export interface DashboardSalesSummary {
  total_revenue: string;
  total_cost: string;
  gross_profit: string;
  profit_margin_pct: string;
  total_transactions: number;
}

export interface HPPDashboardData {
  period: 'today' | 'week' | 'month';
  cost_breakdown: CostBreakdown;
  average_product_margin: string;
  star_products: ProductMarginItem[];
  atRisk_products?: ProductMarginItem[];
  at_risk_products?: ProductMarginItem[];
  realized_vs_recipe_hpp: RecipeVsRealizedItem[];
  sales_summary: DashboardSalesSummary;
}

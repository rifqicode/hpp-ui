// Decimal values are serialized as strings by the backend (shopspring/decimal).
export type ProfitabilitySort = 'profit' | 'revenue' | 'margin'

export interface ReportRange {
  start_date: string
  end_date: string
  days: number
}

export interface ProductProfitabilitySummary {
  net_sales: string
  cogs: string
  gross_profit: string
  margin_pct: string
  quantity_sold: string
}

export interface ProductProfitabilityItem {
  product_id: string
  variant_id: string
  product_name: string
  variant_name: string
  display_name: string
  category: string
  unit: string
  selling_price: string
  quantity_sold: string
  net_sales: string
  cogs: string
  gross_profit: string
  margin_pct: string
}

export interface ProductProfitabilityReport {
  range: ReportRange
  categories: string[]
  summary: ProductProfitabilitySummary
  items: ProductProfitabilityItem[]
}

export interface ProductProfitabilityParams {
  start_date: string
  end_date: string
  /** Category name; empty string means all categories. */
  category: string
  search: string
  sort: ProfitabilitySort
}

export interface ProductWeeklyTrend {
  week_index: number
  label: string
  start_date: string
  end_date: string
  quantity_sold: string
  net_sales: string
  cogs: string
  gross_profit: string
  unit_cost: string
}

export interface ProductUnitCostBreakdown {
  cost_source: 'REALIZED_BATCH' | 'RECIPE_ESTIMATE'
  selling_price: string
  material_cost: string
  labor_cost: string
  overhead_cost: string
  total_hpp: string
  unit_gross_profit: string
}

export interface ProductProfitReconciliation {
  gross_sales: string
  discount_amount: string
  return_amount: string
  net_sales: string
  cogs: string
  gross_profit: string
}

export interface ProductDailyDetailRow {
  date: string
  quantity_sold: string
  net_sales: string
  cogs: string
  gross_profit: string
}

export interface ProductDetailReport {
  product_id: string
  variant_id: string
  product_name: string
  variant_name: string
  display_name: string
  category: string
  unit: string
  selling_price: string
  target_margin_pct: string
  current_hpp: string
  previous_hpp: string
  hpp_change_pct: string
  range: ReportRange
  quantity_sold: string
  avg_daily_quantity: string
  net_sales: string
  cogs: string
  gross_profit: string
  margin_pct: string
  unit_gross_profit: string
  revenue_growth_pct: string | null
  best_day_date: string | null
  best_day_quantity: string
  note: string
  selected_week_index: number | null
  weeks: ProductWeeklyTrend[]
  unit_cost_breakdown: ProductUnitCostBreakdown
  reconciliation: ProductProfitReconciliation
  daily_rows: ProductDailyDetailRow[]
}

export interface ProductDetailParams {
  start_date?: string
  end_date?: string
  week?: number
}

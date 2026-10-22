export type SectionStatus = 'ok' | 'unavailable' | 'forbidden' | 'upgrade_required';
export interface Section<T> { status: SectionStatus; data?: T }
export interface OverviewRange { start_date: string; end_date: string }
export interface OverviewSummary {
  net_sales: string; transactions: number; average_order: string | null;
  gross_profit?: string; margin_pct?: string;
}
export interface OverviewDay { date: string; net_sales: string; transactions: number }
export interface OverviewProduct { product_id: string; name: string; unit: string; quantity: string; net_sales: string }
export interface OverviewAlert { id: string; name: string; kind: string; quantity: string; unit: string; date?: string }
export interface OverviewAttention { count: number; items: OverviewAlert[] }
export interface DashboardOverview {
  store_id: string; timezone: string; currency: string; as_of: string;
  range: OverviewRange; comparison_range: OverviewRange | null; profit_status: SectionStatus;
  sales: Section<{ current: OverviewSummary; previous: OverviewSummary | null; trend: OverviewDay[] }>;
  products: Section<OverviewProduct[]>;
  inventory: Section<OverviewAttention>; purchases: Section<OverviewAttention>; production: Section<OverviewAttention>;
}

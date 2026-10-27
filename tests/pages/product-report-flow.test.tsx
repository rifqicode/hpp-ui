import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ReportsPage from '@/pages/reports/reports-page'
import ProductReportPage from '@/pages/reports/product-report-page'
import { useAuthStore } from '@/store/use-auth-store'
import { reportsApi } from '@/features/reports/api/reports-api'
import type { ProductDetailReport, ProductProfitabilityReport } from '@/features/reports/types'

const mockProfitabilityReport: ProductProfitabilityReport = {
  range: { start_date: '2026-10-17', end_date: '2026-10-23', days: 7 },
  categories: ['Bakery', 'Minuman'],
  summary: {
    net_sales: '1200000',
    cogs: '600000',
    gross_profit: '600000',
    margin_pct: '50',
    quantity_sold: '40',
  },
  items: [
    {
      product_id: 'prod-1',
      variant_id: 'var-1',
      product_name: 'Croissant Butter',
      variant_name: 'Regular',
      display_name: 'Croissant Butter',
      category: 'Bakery',
      unit: 'pcs',
      selling_price: '30000',
      quantity_sold: '31',
      net_sales: '930000',
      cogs: '465000',
      gross_profit: '465000',
      margin_pct: '50',
    },
  ],
}

const mockDetailReport: ProductDetailReport = {
  product_id: 'prod-1',
  variant_id: 'var-1',
  product_name: 'Croissant Butter',
  variant_name: 'Regular',
  display_name: 'Croissant Butter',
  category: 'Bakery',
  unit: 'pcs',
  selling_price: '30000',
  target_margin_pct: '40',
  current_hpp: '15000',
  previous_hpp: '15000',
  hpp_change_pct: '0',
  range: { start_date: '2026-10-17', end_date: '2026-10-23', days: 7 },
  quantity_sold: '31',
  avg_daily_quantity: '4.4',
  net_sales: '930000',
  cogs: '465000',
  gross_profit: '465000',
  margin_pct: '50',
  unit_gross_profit: '15000',
  revenue_growth_pct: '12.5',
  best_day_date: '2026-10-23',
  best_day_quantity: '10',
  note: 'Margin is healthy and on or above target.',
  selected_week_index: null,
  weeks: [
    {
      week_index: 0,
      label: '17–23 Okt',
      start_date: '2026-10-17',
      end_date: '2026-10-23',
      quantity_sold: '31',
      net_sales: '930000',
      cogs: '465000',
      gross_profit: '465000',
      unit_cost: '15000',
    },
    {
      week_index: 1,
      label: '10–16 Okt',
      start_date: '2026-10-10',
      end_date: '2026-10-16',
      quantity_sold: '28',
      net_sales: '840000',
      cogs: '420000',
      gross_profit: '420000',
      unit_cost: '15000',
    },
    {
      week_index: 2,
      label: '3–9 Okt',
      start_date: '2026-10-03',
      end_date: '2026-10-09',
      quantity_sold: '25',
      net_sales: '750000',
      cogs: '375000',
      gross_profit: '375000',
      unit_cost: '15000',
    },
    {
      week_index: 3,
      label: '26 Sep–2 Okt',
      start_date: '2026-09-26',
      end_date: '2026-10-02',
      quantity_sold: '20',
      net_sales: '600000',
      cogs: '300000',
      gross_profit: '300000',
      unit_cost: '15000',
    },
  ],
  unit_cost_breakdown: {
    cost_source: 'REALIZED_BATCH',
    selling_price: '30000',
    material_cost: '10500',
    labor_cost: '3000',
    overhead_cost: '1500',
    total_hpp: '15000',
    unit_gross_profit: '15000',
  },
  reconciliation: {
    gross_sales: '950000',
    discount_amount: '20000',
    return_amount: '0',
    net_sales: '930000',
    cogs: '465000',
    gross_profit: '465000',
  },
  daily_rows: [
    {
      date: '2026-10-23',
      quantity_sold: '31',
      net_sales: '930000',
      cogs: '465000',
      gross_profit: '465000',
    },
  ],
}

function mount(path = '/reports') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/products/:variantId" element={<ProductReportPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  useAuthStore.setState({
    permissions: ['menu:reports'],
    activeStoreId: 'store-1',
  })
  vi.spyOn(reportsApi, 'getProductProfitability').mockResolvedValue(mockProfitabilityReport)
  vi.spyOn(reportsApi, 'getProductDetail').mockResolvedValue(mockDetailReport)
})

it('opens product detail with the selected period and restores list filters', async () => {
  const user = userEvent.setup()
  mount()

  const productLink = await screen.findByRole('link', { name: 'Croissant Butter' })
  expect(productLink).toBeInTheDocument()
  await user.click(productLink)

  expect(await screen.findByRole('heading', { name: 'Croissant Butter' })).toBeVisible()
  const daily = screen.getByRole('table', { name: 'Rincian penjualan harian' })
  expect(within(daily).getByText('31 pcs', { selector: 'tbody td' })).toBeVisible()
  expect(within(daily).getByText(/23 Okt 2026/)).toBeVisible()

  await user.click(screen.getByRole('link', { name: 'Kembali ke laporan' }))
  expect(await screen.findByRole('link', { name: 'Croissant Butter' })).toBeInTheDocument()
})

it('selects a week from the trend section and toggles selection', async () => {
  const user = userEvent.setup()
  mount('/reports/products/var-1')

  expect(await screen.findByRole('heading', { name: 'Croissant Butter' })).toBeVisible()

  const weekBtn = screen.getByRole('button', { name: /10–16 Okt/i })
  await user.click(weekBtn)
  expect(weekBtn).toHaveAttribute('aria-pressed', 'true')
})

it('handles denied report access and error state', async () => {
  useAuthStore.setState({ permissions: [] })
  mount('/reports/products/var-1')
  expect(screen.getByText('Akses laporan belum diberikan untuk akun ini.')).toBeVisible()

  useAuthStore.setState({ permissions: ['menu:reports'] })
  vi.spyOn(reportsApi, 'getProductDetail').mockRejectedValueOnce(new Error('Product not found'))
  mount('/reports/products/unknown-var')
  expect(await screen.findByText('Product not found')).toBeVisible()
})

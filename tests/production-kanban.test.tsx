import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ProductionKanban } from '@/features/production/components/production-kanban'
import BatchListPage from '@/pages/production/batch-list-page'
import type { ProductionBatch } from '@/features/production/types'
import { mockPageServices, resetSession } from './support/page-services'
import { mockPopulatedPages } from './support/populated-pages'
import { renderPage } from './support/render'

const mockBatches: ProductionBatch[] = [
  {
    id: 'batch-1',
    batchNumber: 'BATCH-20261024-001',
    variantId: 'var-1',
    productId: 'prod-1',
    productName: 'Kopi Susu Gula Aren',
    productCategory: 'Minuman',
    productUnit: 'Cup',
    sellingPrice: 18000,
    status: 'QUEUED',
    targetQuantity: 5,
    stockCost: 25000,
    startedAt: '2026-10-24T10:00:00Z',
    notes: 'Online MTO Order #INV-20261024-0001',
    ingredients: [],
    recipeSnapshot: {
      variant_id: 'var-1',
      variant_name: 'Regular',
      product_name: 'Kopi Susu Gula Aren',
      modifiers: [
        { id: 'mod-1', name: 'Less Sugar', price: 0, stock_id: null, ingredient_quantity: 0, unit: '' },
        { id: 'mod-2', name: 'Extra Shot', price: 3000, stock_id: null, ingredient_quantity: 0, unit: '' },
      ],
    },
  },
  {
    id: 'batch-2',
    batchNumber: 'BATCH-20261024-002',
    variantId: 'var-2',
    productId: 'prod-2',
    productName: 'Croissant Butter',
    productCategory: 'Pastry',
    productUnit: 'Pcs',
    sellingPrice: 24000,
    status: 'IN_PROGRESS',
    targetQuantity: 12,
    stockCost: 72000,
    startedAt: '2026-10-24T10:15:00Z',
    notes: 'Meja 3 Dine-In',
    ingredients: [],
    recipeSnapshot: {
      variant_id: 'var-2',
      variant_name: 'Standard',
      product_name: 'Croissant Butter',
    },
  },
  {
    id: 'batch-3',
    batchNumber: 'BATCH-20261024-003',
    variantId: 'var-3',
    productId: 'prod-3',
    productName: 'Sourdough Loaf',
    productCategory: 'Bakery',
    productUnit: 'Loaf',
    sellingPrice: 45000,
    status: 'COMPLETED',
    targetQuantity: 4,
    goodQuantity: 4,
    wasteQuantity: 0,
    stockCost: 60000,
    startedAt: '2026-10-24T09:00:00Z',
    completedAt: '2026-10-24T10:30:00Z',
    ingredients: [],
    recipeSnapshot: {
      variant_id: 'var-3',
      variant_name: 'Large',
      product_name: 'Sourdough Loaf',
    },
  },
]

describe('ProductionKanban component', () => {
  it('renders all 3 core columns and displays batch cards correctly', () => {
    render(
      <MemoryRouter>
        <ProductionKanban
          batches={mockBatches}
          onPickup={vi.fn()}
          onComplete={vi.fn()}
        />
      </MemoryRouter>
    )

    // Verify 3 columns
    expect(screen.getByRole('heading', { name: 'Antrean' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sedang Diproduksi' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Selesai' })).toBeInTheDocument()

    // Verify Batch Numbers
    expect(screen.getByText('BATCH-20261024-001')).toBeInTheDocument()
    expect(screen.getByText('BATCH-20261024-002')).toBeInTheDocument()
    expect(screen.getByText('BATCH-20261024-003')).toBeInTheDocument()

    // Verify Product Names
    expect(screen.getByText('Kopi Susu Gula Aren')).toBeInTheDocument()
    expect(screen.getByText('Croissant Butter')).toBeInTheDocument()
    expect(screen.getByText('Sourdough Loaf')).toBeInTheDocument()

    // Verify Modifiers
    expect(screen.getByText('+ Less Sugar')).toBeInTheDocument()
    expect(screen.getByText('+ Extra Shot')).toBeInTheDocument()

    // Verify Notes prominently displayed
    expect(screen.getByText('Online MTO Order #INV-20261024-0001')).toBeInTheDocument()
    expect(screen.getByText('Meja 3 Dine-In')).toBeInTheDocument()

    // Verify Action Buttons
    expect(screen.getByRole('button', { name: /Mulai Produksi/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Selesai Produksi/i })).toBeInTheDocument()
  })

  it('triggers onPickup when clicking Mulai Produksi button', async () => {
    const user = userEvent.setup()
    const onPickup = vi.fn()
    const onComplete = vi.fn()

    render(
      <MemoryRouter>
        <ProductionKanban
          batches={mockBatches}
          onPickup={onPickup}
          onComplete={onComplete}
        />
      </MemoryRouter>
    )

    const pickupBtn = screen.getByRole('button', { name: /Mulai Produksi/i })
    await user.click(pickupBtn)
    expect(onPickup).toHaveBeenCalledWith('batch-1')
  })

  it('triggers onComplete when clicking Selesai Produksi button', async () => {
    const user = userEvent.setup()
    const onPickup = vi.fn()
    const onComplete = vi.fn()

    render(
      <MemoryRouter>
        <ProductionKanban
          batches={mockBatches}
          onPickup={onPickup}
          onComplete={onComplete}
        />
      </MemoryRouter>
    )

    const completeBtn = screen.getByRole('button', { name: /Selesai Produksi/i })
    await user.click(completeBtn)
    expect(onComplete).toHaveBeenCalledWith(mockBatches[1])
  })
})

describe('BatchListPage with Kanban default', () => {
  beforeEach(() => {
    resetSession()
    mockPageServices()
    mockPopulatedPages()
  })

  it('defaults to kanban view when no tab query parameter is provided', async () => {
    renderPage(<BatchListPage />, '/production/batches')
    // Kanban board should be visible by default
    expect(await screen.findByRole('tab', { name: 'Papan Kanban' })).toHaveAttribute('data-state', 'active')
    expect(screen.getByLabelText('Papan Kanban Dapur Produksi')).toBeInTheDocument()
  })
})

import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ProductionKanban } from '@/features/production/components/production-kanban';
import BatchListPage from '@/pages/production/batch-list-page';
import type { ProductionBatch } from '@/features/production/types';
import { mockPageServices, resetSession } from './support/page-services';
import { mockPopulatedPages } from './support/populated-pages';
import { renderPage } from './support/render';

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
        {
          id: 'mod-1',
          name: 'Less Sugar',
          price: 0,
          stock_id: null,
          ingredient_quantity: 0,
          unit: '',
        },
        {
          id: 'mod-2',
          name: 'Extra Shot',
          price: 3000,
          stock_id: null,
          ingredient_quantity: 0,
          unit: '',
        },
      ],
    },
  },
  {
    id: 'batch-2',
    batchNumber: 'BATCH-20261024-002',
    source: 'POS',
    orderContext: { table_number: '3', invoice_number: 'INV-20261024-0002' },
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
];

describe('ProductionKanban tickets', () => {
  function board(
    batches = mockBatches,
    props: Partial<ComponentProps<typeof ProductionKanban>> = {},
  ) {
    return render(
      <MemoryRouter>
        <ProductionKanban batches={batches} onPickup={vi.fn()} onComplete={vi.fn()} {...props} />
      </MemoryRouter>,
    );
  }

  function variant(
    id: string,
    name: string,
    overrides: Partial<ProductionBatch> = {},
  ): ProductionBatch {
    return {
      ...mockBatches[1],
      id,
      productId: 'brownies',
      productName: 'Brownies - ' + name,
      productUnit: 'pcs',
      recipeSnapshot: { variant_id: id, product_name: 'Brownies', variant_name: name },
      ...overrides,
    };
  }

  it('shows products, quantities, sources, modifiers, notes and the three core columns', () => {
    board();
    for (const name of ['Antrian', 'Sedang Diproduksi', 'Selesai']) {
      expect(screen.getByRole('heading', { name })).toBeVisible();
    }
    for (const batch of mockBatches) {
      expect(screen.getByText(batch.batchNumber)).toBeVisible();
      expect(
        screen.getByRole('heading', { name: batch.recipeSnapshot!.product_name }),
      ).toBeVisible();
    }
    expect(screen.getByText('POS · Meja 3')).toBeVisible();
    expect(screen.getAllByText('Manual')).toHaveLength(2);
    expect(screen.getByText('+ Less Sugar')).toBeVisible();
    expect(screen.getByText('+ Extra Shot')).toBeVisible();
    expect(screen.getByText('Online MTO Order #INV-20261024-0001')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Mulai produksi' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Selesaikan' })).toBeVisible();
    expect(screen.queryByText('Tersimpan')).not.toBeInTheDocument();
  });

  it('groups the same product once and previews three variants while counting the entire batch', () => {
    const batch: ProductionBatch = {
      ...mockBatches[1],
      id: 'multi',
      productName: '5 varian produksi',
      productionItems: [
        variant('one', 'Original'),
        variant('two', 'Keju'),
        variant('three', 'Almond'),
        variant('four', 'Matcha', { status: 'COMPLETED' }),
        variant('five', 'Nutella', { status: 'COMPLETED' }),
      ],
    };
    board([batch]);
    expect(screen.getAllByRole('heading', { name: 'Brownies' })).toHaveLength(1);
    for (const name of ['Original', 'Keju', 'Almond'])
      expect(screen.getByRole('link', { name })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Matcha' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+2 varian lainnya' })).toHaveAttribute(
      'href',
      '/production/batches/multi',
    );
    expect(screen.getByText('2/5 varian selesai')).toBeVisible();
  });

  it('keeps different products and units separate', () => {
    board([
      {
        ...mockBatches[1],
        productionItems: [
          variant('one', 'Original', { targetQuantity: 10, productUnit: 'pcs' }),
          variant('two', 'Keju', { targetQuantity: 4, productUnit: 'box' }),
          { ...mockBatches[0], id: 'coffee' },
        ],
      },
    ]);
    const brownies = screen.getByRole('region', { name: 'Brownies' });
    expect(within(brownies).getByText('10')).toBeVisible();
    expect(within(brownies).getByText('pcs')).toBeVisible();
    expect(within(brownies).getByText('4')).toBeVisible();
    expect(within(brownies).getByText('box')).toBeVisible();
    expect(screen.getByRole('region', { name: 'Kopi Susu Gula Aren' })).toBeVisible();
  });

  it('starts and completes the selected batch using its primary button', async () => {
    const user = userEvent.setup(),
      onPickup = vi.fn(),
      onComplete = vi.fn();
    board(mockBatches, { onPickup, onComplete });
    await user.click(screen.getByRole('button', { name: 'Mulai produksi' }));
    expect(onPickup).toHaveBeenCalledWith('batch-1');
    await user.click(screen.getByRole('button', { name: 'Selesaikan' }));
    expect(onComplete).toHaveBeenCalledWith(mockBatches[1]);
  });

  it('keeps completed variant names readable and links each variant to its detail', () => {
    board([
      {
        ...mockBatches[1],
        id: 'multi',
        productionItems: [
          variant('done', 'Original', {
            status: 'COMPLETED',
            goodQuantity: 9,
            targetQuantity: 10,
            wasteQuantity: 1,
          }),
          variant('active', 'Keju', { targetQuantity: 8 }),
          variant('cancelled', 'Almond', { status: 'CANCELLED' }),
        ],
      },
    ]);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Original' })).not.toHaveClass('line-through');
    expect(screen.getByRole('link', { name: 'Keju' })).toHaveAttribute(
      'href',
      '/production/batches/multi?variant=active',
    );
    expect(screen.getByText('9/10')).toBeVisible();
    expect(screen.getByText('1 afkir')).toBeVisible();
    expect(screen.getByText('1/2 varian selesai')).toBeVisible();
    expect(screen.getByText('Almond · Dibatalkan')).toBeVisible();
  });

  it('opens completion for only the checked variant and waits for confirmation before marking it done', async () => {
    const user = userEvent.setup();
    const onCompleteItem = vi.fn();
    const onComplete = vi.fn();
    const batch: ProductionBatch = {
      ...mockBatches[1],
      id: 'multi',
      productionItems: [
        variant('done', 'Original', { status: 'COMPLETED' }),
        variant('active', 'Keju'),
      ],
    };
    board([batch], { onCompleteItem, onComplete });
    const done = screen.getByRole('checkbox', { name: 'Selesaikan Brownies - Original' });
    expect(done).toBeChecked();
    expect(done).toBeDisabled();
    const active = screen.getByRole('checkbox', { name: 'Selesaikan Brownies - Keju' });
    expect(active).not.toBeChecked();
    await user.click(active);
    expect(onCompleteItem).toHaveBeenCalledWith(batch, 'active');
    expect(onComplete).not.toHaveBeenCalled();
    expect(active).not.toBeChecked();
    expect(screen.getByRole('link', { name: 'Original' })).not.toHaveClass('line-through');
  });

  it.each([{ canAct: false }, { isPickingUp: 'busy' }])(
    'disables variant completion when unavailable: %j',
    props => {
      board(mockBatches, { ...props, onCompleteItem: vi.fn() });
      expect(
        screen.getByRole('checkbox', { name: 'Selesaikan Croissant Butter - Standard' }),
      ).toBeDisabled();
      expect(
        screen.getByRole('checkbox', { name: 'Selesaikan Kopi Susu Gula Aren - Regular' }),
      ).toBeDisabled();
    },
  );

  it('hides write controls for read-only users and disables both process controls while busy', () => {
    const view = board(mockBatches, { canAct: false });
    expect(screen.queryByRole('button', { name: 'Mulai produksi' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Selesaikan' })).not.toBeInTheDocument();
    view.unmount();
    board(mockBatches, { isPickingUp: 'busy' });
    expect(screen.getByRole('button', { name: 'Mulai produksi' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Selesaikan' })).toBeDisabled();
  });

  it('blinks only the overdue label, leaves warnings steady, and opens details from the card body', async () => {
    const user = userEvent.setup(),
      now = Date.now();
    const late = {
      ...mockBatches[1],
      id: 'late',
      targetCompletedAt: new Date(now - 15 * 60000).toISOString(),
      timerAlert: { enabled: true, warningLeadMinutes: 3 },
    };
    const warning = {
      ...mockBatches[0],
      id: 'warning',
      targetCompletedAt: new Date(now + 2 * 60000).toISOString(),
      timerAlert: { enabled: true, warningLeadMinutes: 3 },
    };
    renderPage(
      <ProductionKanban
        batches={[late, warning, mockBatches[2]]}
        onPickup={vi.fn()}
        onComplete={vi.fn()}
      />,
      '/production/batches',
    );
    expect(screen.getByText('Terlambat 15 menit')).toHaveClass('animate-late-blink');
    expect(screen.getByText('Sisa 2 menit')).not.toHaveClass('animate-late-blink');
    expect(screen.getAllByText(/Terlambat/)).toHaveLength(1);
    await user.click(screen.getByText('Meja 3 Dine-In'));
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/production/batches/late');
  });

  it('preserves valid drag transitions and ignores invalid jumps', () => {
    const onPickup = vi.fn(),
      onComplete = vi.fn();
    const { container } = board(mockBatches, { onPickup, onComplete });
    const queued = container.querySelector('[data-batch-id="batch-1"]') as HTMLElement;
    const running = container.querySelector('[data-batch-id="batch-2"]') as HTMLElement;
    const runningColumn = container.querySelector('[data-column-id="IN_PROGRESS"]') as HTMLElement;
    const completedColumn = container.querySelector('[data-column-id="COMPLETED"]') as HTMLElement;
    fireEvent.dragStart(queued);
    fireEvent.dragOver(completedColumn);
    fireEvent.drop(completedColumn);
    fireEvent.dragEnd(queued);
    expect(onPickup).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.dragStart(queued);
    expect(screen.getByText('Lepas di sini untuk mulai produksi')).toBeVisible();
    fireEvent.dragOver(runningColumn);
    fireEvent.drop(runningColumn);
    fireEvent.dragEnd(queued);
    expect(onPickup).toHaveBeenCalledWith('batch-1');
    fireEvent.dragStart(running);
    expect(screen.getByText('Lepas di sini untuk isi hasil & selesaikan')).toBeVisible();
    fireEvent.dragOver(completedColumn);
    fireEvent.drop(completedColumn);
    fireEvent.dragEnd(running);
    expect(onComplete).toHaveBeenCalledWith(mockBatches[1]);
  });
});

describe('BatchListPage with Kanban default', () => {
  beforeEach(() => {
    resetSession();
    mockPageServices();
    mockPopulatedPages();
  });

  it('defaults to kanban view when no tab query parameter is provided', async () => {
    renderPage(<BatchListPage />, '/production/batches');
    // Kanban board should be visible by default
    expect(await screen.findByRole('tab', { name: 'Papan Kanban' })).toHaveAttribute(
      'data-state',
      'active',
    );
    expect(await screen.findByLabelText('Papan Kanban Dapur Produksi')).toBeVisible();
  });
});

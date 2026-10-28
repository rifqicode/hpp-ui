import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/features/guidance/config/guidance-registry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/guidance/config/guidance-registry')>();
  return {
    ...actual,
    GUIDANCE_UI_ENABLED: true,
  };
});

import {
  GUIDANCE_REGISTRY,
  ORDERED_GUIDANCE_KEYS,
  StoreGuidanceChecklist,
  StoreGuidanceSidebarCard,
  StoreGuidanceNavbarButton,
  FeatureGuidanceTour,
  GuidanceTourTrigger,
} from '@/features/guidance';
import StoreGuidancePage from '@/pages/guidance/store-guidance-page';
import * as guidanceHooks from '@/features/guidance/hooks/use-guidance';
import { useAuthStore } from '@/store/use-auth-store';
import { TooltipProvider } from '@/components/ui/tooltip';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

describe('Guidance Registry & Components', () => {
  it('registers all required guidance features', () => {
    expect(ORDERED_GUIDANCE_KEYS).toContain('first_product');
    expect(ORDERED_GUIDANCE_KEYS).toContain('stock');
    expect(ORDERED_GUIDANCE_KEYS).toContain('store_profile');
    expect(ORDERED_GUIDANCE_KEYS).toContain('payment_config');
    expect(ORDERED_GUIDANCE_KEYS).toContain('receipt_config');
    expect(ORDERED_GUIDANCE_KEYS).toContain('production');
    expect(ORDERED_GUIDANCE_KEYS).toContain('pos');

    expect(GUIDANCE_REGISTRY.first_product.title).toBeDefined();
    expect(GUIDANCE_REGISTRY.stock.steps.length).toBeGreaterThan(0);
    expect(GUIDANCE_REGISTRY.store_profile.steps.length).toBeGreaterThan(0);
    expect(GUIDANCE_REGISTRY.payment_config.steps.length).toBeGreaterThan(0);
    expect(GUIDANCE_REGISTRY.receipt_config.steps.length).toBeGreaterThan(0);
    expect(GUIDANCE_REGISTRY.production.steps.length).toBeGreaterThan(0);
    expect(GUIDANCE_REGISTRY.pos.steps.length).toBeGreaterThan(0);
  });

  it('renders StoreGuidanceChecklist with progress and active step', () => {
    vi.spyOn(guidanceHooks, 'useGuidanceProgress').mockReturnValue({
      items: [
        {
          key: 'first_product',
          config: GUIDANCE_REGISTRY.first_product,
          isCompleted: true,
          isSkipped: false,
          completedAt: '2026-10-28T10:00:00Z',
        },
        {
          key: 'stock',
          config: GUIDANCE_REGISTRY.stock,
          isCompleted: false,
          isSkipped: false,
        },
        {
          key: 'receipt_config',
          config: GUIDANCE_REGISTRY.receipt_config,
          isCompleted: false,
          isSkipped: false,
        },
      ],
      total: 3,
      completed: 1,
      percent: 33,
      isAllCompleted: false,
      nextGuidance: {
        key: 'stock',
        config: GUIDANCE_REGISTRY.stock,
        isCompleted: false,
        isSkipped: false,
      },
      isLoading: false,
    });

    renderWithProviders(<StoreGuidanceChecklist />);

    expect(screen.getByText(/Panduan Penyiapan Toko/i)).toBeInTheDocument();
    expect(screen.getByText(/1\/3 Selesai \(33%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Sudah Selesai/i)).toBeInTheDocument();
    expect(screen.getByText(/Mulai Sekarang/i)).toBeInTheDocument();
  });

  it('renders StoreGuidanceSidebarCard and shows progress', () => {
    vi.spyOn(guidanceHooks, 'useGuidanceProgress').mockReturnValue({
      items: [],
      total: 3,
      completed: 1,
      percent: 33,
      isAllCompleted: false,
      nextGuidance: {
        key: 'stock',
        config: GUIDANCE_REGISTRY.stock,
        isCompleted: false,
        isSkipped: false,
      },
      isLoading: false,
    });

    renderWithProviders(<StoreGuidanceSidebarCard />);

    expect(screen.getByText(/Panduan Toko/i)).toBeInTheDocument();
    expect(screen.getByText(/1\/3/i)).toBeInTheDocument();
    expect(screen.getByText(/Bahan Baku & Stok Gudang/i)).toBeInTheDocument();
  });

  it('hides StoreGuidanceSidebarCard when all steps are completed', () => {
    vi.spyOn(guidanceHooks, 'useGuidanceProgress').mockReturnValue({
      items: [],
      total: 3,
      completed: 3,
      percent: 100,
      isAllCompleted: true,
      nextGuidance: null,
      isLoading: false,
    });

    const { container } = renderWithProviders(<StoreGuidanceSidebarCard />);
    expect(container.firstChild).toBeNull();
  });

  it('allows skipping a tour via the Lewati button', () => {
    const mutateMock = vi.fn();
    vi.spyOn(guidanceHooks, 'useGuidancesQuery').mockReturnValue({
      data: [{ guidance: 'stock', is_completed: false }],
      isLoading: false,
    } as any);

    vi.spyOn(guidanceHooks, 'useCompleteGuidanceMutation').mockReturnValue({
      mutate: mutateMock,
    } as any);

    renderWithProviders(<FeatureGuidanceTour feature="stock" forceOpen />);

    const skipButton = screen.getByTitle('Lewati panduan');
    fireEvent.click(skipButton);

    expect(mutateMock).toHaveBeenCalledWith({
      key: 'stock',
      payload: { action: 'skip', skipped: true },
    });
    // Tour popover and backdrop should immediately disappear from DOM
    expect(screen.queryByTitle('Lewati panduan')).not.toBeInTheDocument();
  });

  it('allows GuidanceTourTrigger to open tour via event without duplicate instances', () => {
    vi.spyOn(guidanceHooks, 'useGuidancesQuery').mockReturnValue({
      data: [{ guidance: 'stock', is_completed: true }],
      isLoading: false,
    } as any);

    renderWithProviders(
      <div>
        <GuidanceTourTrigger feature="stock" />
        <FeatureGuidanceTour feature="stock" />
      </div>
    );

    // Tour is not active initially because is_completed: true
    expect(screen.queryByTitle('Lewati panduan')).not.toBeInTheDocument();

    // Click "Lihat Panduan" trigger
    fireEvent.click(screen.getByRole('button', { name: /Lihat Panduan/i }));

    // Now exactly ONE tour instance is open
    expect(screen.getAllByTitle('Lewati panduan')).toHaveLength(1);
    expect(screen.getByText(/Daftar (Stok )?Bahan Baku/i)).toBeInTheDocument();
  });

  it('elevates active target stacking context and restores upon closing tour', () => {
    const targetDiv = document.createElement('div');
    targetDiv.setAttribute('data-guidance', 'stock-table');
    targetDiv.style.zIndex = '2';
    document.body.appendChild(targetDiv);

    vi.spyOn(guidanceHooks, 'useGuidancesQuery').mockReturnValue({
      data: [{ guidance: 'stock', is_completed: false }],
      isLoading: false,
    } as any);

    const { unmount } = renderWithProviders(<FeatureGuidanceTour feature="stock" forceOpen />);

    expect(targetDiv.classList.contains('data-guidance-active-target')).toBe(true);
    expect(targetDiv.style.zIndex).toBe('51');
    expect(targetDiv.style.pointerEvents).toBe('auto');

    // When tour is skipped/closed, styles must be restored
    fireEvent.click(screen.getByTitle('Lewati panduan'));
    expect(targetDiv.classList.contains('data-guidance-active-target')).toBe(false);
    expect(targetDiv.style.zIndex).toBe('2');

    unmount();
    if (document.body.contains(targetDiv)) {
      document.body.removeChild(targetDiv);
    }
  });

  it('elevates modal dialog and portal when target is inside or is a modal dialog', () => {
    const portalDiv = document.createElement('div');
    portalDiv.setAttribute('data-radix-portal', '');
    const modalDiv = document.createElement('div');
    modalDiv.setAttribute('role', 'dialog');
    modalDiv.setAttribute('data-guidance', 'stock-create-modal');
    modalDiv.style.zIndex = '50';
    const inputEl = document.createElement('input');
    modalDiv.appendChild(inputEl);
    portalDiv.appendChild(modalDiv);
    document.body.appendChild(portalDiv);

    vi.spyOn(guidanceHooks, 'useGuidancesQuery').mockReturnValue({
      data: [{ guidance: 'stock', is_completed: false }],
      isLoading: false,
    } as any);

    // Mock stock step 3 by starting directly on stock
    const { unmount } = renderWithProviders(<FeatureGuidanceTour feature="stock" forceOpen />);

    // Advance to step 3 (which targets stock-create-modal)
    fireEvent.click(screen.getByRole('button', { name: /Selanjutnya/i })); // to step 2
    fireEvent.click(screen.getByRole('button', { name: /Selanjutnya/i })); // to step 3

    expect(screen.getByText(/Lengkapi Formulir Bahan Baku/i)).toBeInTheDocument();
    expect(modalDiv.classList.contains('data-guidance-active-target')).toBe(true);
    expect(modalDiv.style.zIndex).toBe('51');
    expect(modalDiv.style.pointerEvents).toBe('auto');
    expect(portalDiv.classList.contains('data-guidance-active-target')).toBe(true);
    expect(portalDiv.style.zIndex).toBe('51');

    unmount();
    if (document.body.contains(portalDiv)) {
      document.body.removeChild(portalDiv);
    }
  });

  it('automatically advances to next step when advanceOn click trigger is activated', () => {
    const tableDiv = document.createElement('div');
    tableDiv.setAttribute('data-guidance', 'stock-table');
    document.body.appendChild(tableDiv);

    const addBtn = document.createElement('button');
    addBtn.setAttribute('data-guidance', 'add-stock-btn');
    document.body.appendChild(addBtn);

    vi.spyOn(guidanceHooks, 'useGuidancesQuery').mockReturnValue({
      data: [{ guidance: 'stock', is_completed: false }],
      isLoading: false,
    } as any);

    const { unmount } = renderWithProviders(<FeatureGuidanceTour feature="stock" forceOpen />);

    // Initially on Step 1 (stock-table)
    expect(screen.getByText(/Daftar (Stok )?Bahan Baku/i)).toBeInTheDocument();

    // Move to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Selanjutnya/i }));
    expect(screen.getByText(/Tambah Bahan Baku Baru/i)).toBeInTheDocument();

    // Step 2 has advanceOn: { type: 'click' }. Clicking add-stock-btn should advance to Step 3!
    fireEvent.click(addBtn);

    expect(screen.getByText(/Lengkapi Formulir Bahan Baku/i)).toBeInTheDocument();

    unmount();
    if (document.body.contains(tableDiv)) {
      document.body.removeChild(tableDiv);
    }
    if (document.body.contains(addBtn)) {
      document.body.removeChild(addBtn);
    }
  });

  it('automatically advances to next step when advanceOn custom-event trigger is activated', () => {
    GUIDANCE_REGISTRY['custom_test'] = {
      key: 'custom_test',
      title: 'Custom Event Test',
      description: 'Testing custom-event advance',
      route: '/test',
      steps: [
        {
          target: '[data-guidance="custom-step-1"]',
          title: 'Custom Step 1',
          content: 'Step 1 description',
          advanceOn: { type: 'custom-event', event: 'custom-step-advanced' },
        },
        {
          target: '[data-guidance="custom-step-2"]',
          title: 'Custom Step 2',
          content: 'Step 2 description',
        },
      ],
    };

    vi.spyOn(guidanceHooks, 'useGuidancesQuery').mockReturnValue({
      data: [{ guidance: 'custom_test', is_completed: false }],
      isLoading: false,
    } as any);

    const { unmount } = renderWithProviders(<FeatureGuidanceTour feature="custom_test" forceOpen />);

    expect(screen.getByText(/Custom Step 1/i)).toBeInTheDocument();

    // Dispatch the custom event
    act(() => {
      window.dispatchEvent(new CustomEvent('custom-step-advanced'));
    });

    expect(screen.getByText(/Custom Step 2/i)).toBeInTheDocument();

    unmount();
    delete GUIDANCE_REGISTRY['custom_test'];
  });

  it('completes tour and shows celebration toast when guidance-task-success event is dispatched', () => {
    const mutateMock = vi.fn();
    vi.spyOn(guidanceHooks, 'useGuidancesQuery').mockReturnValue({
      data: [{ guidance: 'stock', is_completed: false }],
      isLoading: false,
    } as any);

    vi.spyOn(guidanceHooks, 'useCompleteGuidanceMutation').mockReturnValue({
      mutate: mutateMock,
    } as any);

    const { unmount } = renderWithProviders(<FeatureGuidanceTour feature="stock" forceOpen />);

    // Dispatch guidance-task-success
    act(() => {
      window.dispatchEvent(
        new CustomEvent('guidance-task-success', { detail: { feature: 'stock' } })
      );
    });

    expect(mutateMock).toHaveBeenCalledWith({
      key: 'stock',
      payload: { action: 'complete' },
    });
    expect(screen.getByText(/Panduan Selesai! 🎉/i)).toBeInTheDocument();

    unmount();
  });

  it('automatically activates the tour when loaded and uncompleted', () => {
    vi.spyOn(guidanceHooks, 'useGuidancesQuery').mockReturnValue({
      data: [{ guidance: 'pos', is_completed: false }],
      isLoading: false,
    } as any);

    vi.spyOn(guidanceHooks, 'useCompleteGuidanceMutation').mockReturnValue({
      mutate: vi.fn(),
    } as any);

    renderWithProviders(<FeatureGuidanceTour feature="pos" />);

    expect(screen.getByText(/Katalog Produk Siap Jual/i)).toBeInTheDocument();
    expect(screen.getByTitle('Lewati panduan')).toBeInTheDocument();
  });

  describe('StoreGuidanceNavbarButton', () => {
    it('renders badge with remaining count when steps are pending', () => {
      useAuthStore.setState({ activeStoreId: 'store-123' });
      vi.spyOn(guidanceHooks, 'useGuidanceProgress').mockReturnValue({
        items: [],
        total: 7,
        completed: 3,
        percent: 43,
        isAllCompleted: false,
        nextGuidance: null,
        isLoading: false,
      });

      renderWithProviders(<StoreGuidanceNavbarButton />);

      const button = screen.getByTestId('store-guidance-navbar-btn');
      expect(button).toBeInTheDocument();
      expect(button.closest('a')).toHaveAttribute('href', '/guidance');
      const badge = screen.getByTestId('store-guidance-badge-remaining');
      expect(badge).toHaveTextContent('4');
    });

    it('renders checkmark badge when all steps are completed', () => {
      useAuthStore.setState({ activeStoreId: 'store-123' });
      vi.spyOn(guidanceHooks, 'useGuidanceProgress').mockReturnValue({
        items: [],
        total: 7,
        completed: 7,
        percent: 100,
        isAllCompleted: true,
        nextGuidance: null,
        isLoading: false,
      });

      renderWithProviders(<StoreGuidanceNavbarButton />);

      expect(screen.getByTestId('store-guidance-badge-completed')).toBeInTheDocument();
    });

    it('returns null if no active store is selected', () => {
      useAuthStore.setState({ activeStoreId: null });
      const { container } = renderWithProviders(<StoreGuidanceNavbarButton />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('StoreGuidancePage', () => {
    it('renders all 7 guidance cards, progress bar, and handles mark complete / skip actions', () => {
      useAuthStore.setState({ activeStoreId: 'store-123', activeStoreName: 'Resto Berkah' });
      const mutateMock = vi.fn();
      vi.spyOn(guidanceHooks, 'useCompleteGuidanceMutation').mockReturnValue({
        mutate: mutateMock,
        isPending: false,
        variables: undefined,
      } as any);

      const items = ORDERED_GUIDANCE_KEYS.map((key, idx) => ({
        key,
        config: GUIDANCE_REGISTRY[key],
        isCompleted: idx === 0,
        isSkipped: false,
      }));

      vi.spyOn(guidanceHooks, 'useGuidanceProgress').mockReturnValue({
        items,
        total: 7,
        completed: 1,
        percent: 14,
        isAllCompleted: false,
        nextGuidance: items[1],
        isLoading: false,
      });

      renderWithProviders(<StoreGuidancePage />);

      expect(screen.getByRole('heading', { name: /Panduan Penyiapan Toko/i })).toBeInTheDocument();
      expect(screen.getByText(/1\/7 Selesai \(14%\)/i)).toBeInTheDocument();

      // Check all 7 guidance cards are rendered
      ORDERED_GUIDANCE_KEYS.forEach((key) => {
        expect(screen.getByTestId(`guidance-card-${key}`)).toBeInTheDocument();
      });

      // Completed card (first_product) should NOT have "Buka & Mulai Panduan" button
      const firstProductCard = screen.getByTestId('guidance-card-first_product');
      expect(firstProductCard.querySelector('a')).not.toBeInTheDocument();
      expect(firstProductCard).toHaveTextContent(/Panduan telah diselesaikan/i);

      // Stock card should have "Tandai Selesai" and "Lewati" buttons
      const completeBtn = screen.getByTestId('complete-btn-stock');
      fireEvent.click(completeBtn);
      expect(mutateMock).toHaveBeenCalledWith({
        key: 'stock',
        payload: { action: 'complete', skipped: false },
      });

      const skipBtn = screen.getByTestId('skip-btn-stock');
      fireEvent.click(skipBtn);
      expect(mutateMock).toHaveBeenCalledWith({
        key: 'stock',
        payload: { action: 'skip', skipped: true },
      });
    });

    it('renders empty prompt when no store is selected', () => {
      useAuthStore.setState({ activeStoreId: null, activeStoreName: null });
      renderWithProviders(<StoreGuidancePage />);
      expect(screen.getByText(/Pilih Toko Terlebih Dahulu/i)).toBeInTheDocument();
    });
  });
});

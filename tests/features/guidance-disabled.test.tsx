import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  GUIDANCE_UI_ENABLED,
  StoreGuidanceChecklist,
  StoreGuidanceSidebarCard,
  StoreGuidanceNavbarButton,
  FeatureGuidanceTour,
  GuidanceTourTrigger,
} from '@/features/guidance';
import * as guidanceHooks from '@/features/guidance/hooks/use-guidance';
import { useAuthStore } from '@/store/use-auth-store';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Guidance UI Disabled Mode (GUIDANCE_UI_ENABLED = false)', () => {
  it('has GUIDANCE_UI_ENABLED flag set to false by default', () => {
    expect(GUIDANCE_UI_ENABLED).toBe(false);
  });

  it('renders null for StoreGuidanceChecklist when disabled', () => {
    vi.spyOn(guidanceHooks, 'useGuidanceProgress').mockReturnValue({
      items: [],
      total: 3,
      completed: 1,
      percent: 33,
      isAllCompleted: false,
      nextGuidance: null,
      isLoading: false,
    });
    const { container } = renderWithProviders(<StoreGuidanceChecklist />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null for StoreGuidanceSidebarCard when disabled', () => {
    vi.spyOn(guidanceHooks, 'useGuidanceProgress').mockReturnValue({
      items: [],
      total: 3,
      completed: 1,
      percent: 33,
      isAllCompleted: false,
      nextGuidance: { key: 'stock' } as any,
      isLoading: false,
    });
    const { container } = renderWithProviders(<StoreGuidanceSidebarCard />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null for StoreGuidanceNavbarButton when disabled', () => {
    useAuthStore.setState({ activeStoreId: 'store-123' });
    vi.spyOn(guidanceHooks, 'useGuidanceProgress').mockReturnValue({
      items: [],
      total: 3,
      completed: 1,
      percent: 33,
      isAllCompleted: false,
      nextGuidance: null,
      isLoading: false,
    });
    const { container } = renderWithProviders(<StoreGuidanceNavbarButton />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null for FeatureGuidanceTour when disabled', () => {
    vi.spyOn(guidanceHooks, 'useGuidancesQuery').mockReturnValue({
      data: [{ guidance: 'stock', is_completed: false }],
      isLoading: false,
    } as any);
    const { container } = renderWithProviders(<FeatureGuidanceTour feature="stock" forceOpen />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null for GuidanceTourTrigger when disabled', () => {
    const { container } = renderWithProviders(<GuidanceTourTrigger feature="stock" />);
    expect(container.firstChild).toBeNull();
  });

  it('redirects /guidance to /dashboard when disabled', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/guidance']}>
          <Routes>
            <Route
              path="/guidance"
              element={
                GUIDANCE_UI_ENABLED ? (
                  <div>Guidance Page</div>
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.queryByText('Guidance Page')).not.toBeInTheDocument();
  });
});

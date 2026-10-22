import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from '@/pages/dashboard/dashboard-page';
import { dashboardService } from '@/features/dashboard/services/dashboard-service';
import { useAuthStore } from '@/store/use-auth-store';
import { dashboardFixture } from '../support/dashboard-fixture';
import { mockPageServices, resetSession } from '../support/page-services';
import { deferred, renderPage } from '../support/render';
import type { DashboardOverview } from '@/features/dashboard/types/overview';

beforeEach(() => {
  resetSession(); mockPageServices();
  useAuthStore.setState({ permissions: ['menu:dashboard', 'orders:read', 'stocks:read'] });
});

describe('owner dashboard', () => {
  it('shows actual sales, current alerts, and accessible daily data', async () => {
    const user = userEvent.setup(); renderPage(<DashboardPage />, '/dashboard');
    await screen.findByRole('heading', { name: 'Penjualan Bersih' });
    expect(screen.getByRole('heading', { name: 'Laba Kotor' })).toBeVisible();
    expect(screen.getByText('Roti Coklat')).toBeVisible();
    expect(screen.getByRole('link', { name: /Tepung/ })).toHaveAttribute('href', '/inventory/stocks/stock-1');
    await user.click(screen.getByText('Lihat data harian'));
    expect(screen.getByRole('table')).toBeVisible();
    expect(screen.getByText(/Kondisi saat ini/)).toBeVisible();
    expect(screen.queryByText('Real-Time')).not.toBeInTheDocument();
  });

  it('keeps date drafts local and validates before applying to the URL and request', async () => {
    const user = userEvent.setup(); renderPage(<DashboardPage />, '/dashboard');
    await screen.findByRole('heading', { name: 'Penjualan Bersih' });
    const calls = vi.mocked(dashboardService.getOverview).mock.calls.length;
    await user.click(screen.getByRole('button', { name: 'Pilih tanggal' }));
    fireEvent.change(screen.getByLabelText('Dari tanggal'), { target: { value: '2026-09-20' } });
    fireEvent.change(screen.getByLabelText('Sampai tanggal'), { target: { value: '2026-09-10' } });
    expect(screen.getByRole('button', { name: 'Terapkan' })).toBeDisabled();
    expect(dashboardService.getOverview).toHaveBeenCalledTimes(calls);
    fireEvent.change(screen.getByLabelText('Sampai tanggal'), { target: { value: '2026-09-21' } });
    await user.click(screen.getByRole('button', { name: 'Terapkan' }));
    await waitFor(() => expect(dashboardService.getOverview).toHaveBeenLastCalledWith(expect.any(String), { start_date: '2026-09-20', end_date: '2026-09-21' }, expect.any(AbortSignal)));
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('period=custom');
  });

  it('shows a failed section separately from healthy operations and a package restriction', async () => {
    const fixture = dashboardFixture(); fixture.sales = { status: 'unavailable' }; fixture.products = { status: 'unavailable' };
    vi.mocked(dashboardService.getOverview).mockResolvedValue(fixture);
    renderPage(<DashboardPage />, '/dashboard');
    await screen.findByText('Tepung');
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Rp\s*0/)).not.toBeInTheDocument();
  });

  it('keeps basic sales visible when profit requires another package', async () => {
    const fixture = dashboardFixture(); fixture.profit_status = 'upgrade_required'; delete fixture.sales.data!.current.gross_profit;
    vi.mocked(dashboardService.getOverview).mockResolvedValue(fixture);
    renderPage(<DashboardPage />, '/dashboard');
    expect(await screen.findByText('Tersedia di paket dengan analytics.')).toBeVisible();
    expect(screen.getByText('Roti Coklat')).toBeVisible();
  });

  it('ignores a late response from the previous store', async () => {
    const old = deferred<DashboardOverview>();
    vi.mocked(dashboardService.getOverview).mockReturnValueOnce(old.promise);
    renderPage(<DashboardPage />, '/dashboard');
    const fresh = dashboardFixture(); fresh.store_id = 'store-2'; fresh.products.data![0].name = 'Produk Toko Dua';
    vi.mocked(dashboardService.getOverview).mockResolvedValue(fresh);
    act(() => useAuthStore.setState({ activeStoreId: 'store-2' }));
    await screen.findByText('Produk Toko Dua');
    await act(async () => old.resolve(dashboardFixture()));
    expect(screen.queryByText('Roti Coklat')).not.toBeInTheDocument();
    expect(screen.getByText('Produk Toko Dua')).toBeVisible();
  });

  it('does not request data without dashboard access', () => {
    useAuthStore.setState({ permissions: ['orders:read'] });
    renderPage(<DashboardPage />, '/dashboard');
    expect(screen.getByText('Akses dashboard belum diberikan.')).toBeVisible();
    expect(dashboardService.getOverview).not.toHaveBeenCalled();
  });
});

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import PromotionsPage from '@/pages/sales/promotions-page';
import { promotionService } from '@/features/promotions/services/promotion-service';
import { useAuthStore } from '@/store/use-auth-store';
import { renderPage } from '../support/render';
import { promotionFixture, promotionStoreId } from '../support/promotion-fixtures';

beforeEach(() => {
  vi.spyOn(promotionService, 'summary').mockResolvedValue({ active_count: 1, inactive_count: 12 });
  useAuthStore.setState({ activeStoreId: promotionStoreId, permissions: ['promotions:read'] });
  const promotions = Array.from({ length: 13 }, (_, i) => promotionFixture({
    id: `promotion-${i}`, name: `Promotion ${String(i + 1).padStart(2, '0')}`,
    is_active: i === 12,
  }));
  vi.spyOn(promotionService, 'list').mockImplementation(async (_, page, search, _signal, filters) => {
    let data = promotions.filter(row => row.name.includes(search));
    if (filters?.status === 'active' || filters?.attention === 'active') data = data.filter(row => row.is_active);
    if (filters?.sort === 'name-desc') data = [...data].reverse();
    return { data: data.slice((page - 1) * 12, page * 12), total: data.length, page, per_page: 12, active_count: 1, max_active_promotions: 5 };
  });
});

it('requests subsequent API pages and returns to the previous page with the API total', async () => {
  const user = userEvent.setup();
  renderPage(<PromotionsPage />);
  expect(await screen.findByText('Promotion 01')).toBeVisible();
  expect(screen.queryByText('Promotion 13')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Next' }));
  expect(await screen.findByText('Promotion 13')).toBeVisible();
  expect(screen.getByText('Menampilkan 1 dari 13 promosi')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  expect(promotionService.list).toHaveBeenLastCalledWith(promotionStoreId, 2, '', expect.any(AbortSignal), expect.any(Object));
  await user.click(screen.getByRole('button', { name: 'Prev' }));
  expect(await screen.findByText('Promotion 01')).toBeVisible();
});

it('filters and sorts through the API before pagination and resets the page', async () => {
  const user = userEvent.setup();
  renderPage(<PromotionsPage />);
  await user.click(await screen.findByRole('button', { name: 'Next' }));
  await screen.findByText('Promotion 13');
  await user.selectOptions(screen.getByLabelText('Status promosi'), 'active');
  await waitFor(() => expect(promotionService.list).toHaveBeenLastCalledWith(promotionStoreId, 1, '', expect.any(AbortSignal), expect.objectContaining({ status: 'active' })));
  expect(await screen.findByText('Promotion 13')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('Status promosi'), 'all');
  await user.click(await screen.findByRole('button', { name: 'Next' }));
  await screen.findByText('Promotion 13');
  await user.click(screen.getByRole('button', { name: 'Urutkan: Terbaru' }));
  await user.click(screen.getByRole('menuitem', { name: 'Nama Z–A' }));
  await waitFor(() => expect(promotionService.list).toHaveBeenLastCalledWith(promotionStoreId, 1, '', expect.any(AbortSignal), expect.objectContaining({ sort: 'name-desc' })));
  const rows = within(screen.getByRole('table', { name: 'Tabel promosi' })).getAllByRole('row');
  expect(rows[1]).toHaveTextContent('Promotion 13');
});

it('resets the API page when a new search is entered', async () => {
  const user = userEvent.setup();
  renderPage(<PromotionsPage />);
  await user.click(await screen.findByRole('button', { name: 'Next' }));
  await screen.findByText('Promotion 13');
  await user.type(screen.getByRole('searchbox', { name: 'Cari promosi' }), 'Promotion 13');
  await waitFor(() => expect(promotionService.list).toHaveBeenLastCalledWith(promotionStoreId, 1, 'Promotion 13', expect.any(AbortSignal), expect.any(Object)));
  expect(await screen.findByText('Promotion 13')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
});

it('restores URL filters and preserves an unrelated query parameter while resetting pagination', async () => {
  const user = userEvent.setup();
  renderPage(<PromotionsPage />, '/sales/promotions?status=active&type=DIRECT_DISCOUNT&sort=name-desc&view=grid&campaign=season');
  expect(await screen.findByRole('article', { name: 'Promotion 13' })).toBeVisible();
  expect(promotionService.list).toHaveBeenLastCalledWith(promotionStoreId, 1, '', expect.any(AbortSignal), expect.objectContaining({ status: 'active', type: 'DIRECT_DISCOUNT', sort: 'name-desc' }));
  await user.click(screen.getByRole('button', { name: 'Reset filter' }));
  expect(await screen.findByRole('article', { name: 'Promotion 12' })).toBeVisible();
  expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('campaign=season');
  expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('view=grid');
});

it('keeps the list page when returning from detail and clears it for a status filter', async () => {
  const user = userEvent.setup();
  vi.spyOn(promotionService, 'get').mockResolvedValue(promotionFixture({ id: 'promotion-12', name: 'Promotion 13' }));
  renderPage(<PromotionsPage />, '/sales/promotions?page=2&campaign=season', '/sales/promotions/:promotionId?');
  await screen.findByRole('link', { name: 'Promotion 13' });
  await user.click(screen.getByRole('button', { name: 'Tampilan kartu' }));
  expect(await screen.findByRole('article', { name: 'Promotion 13' })).toBeVisible();
  await user.click(await screen.findByRole('link', { name: 'Promotion 13' }));
  await screen.findByRole('heading', { name: 'Promotion 13' });
  await user.click(screen.getByRole('button', { name: 'Kembali ke promosi' }));
  expect(await screen.findByRole('link', { name: 'Promotion 13' })).toBeVisible();
  expect(promotionService.list).toHaveBeenLastCalledWith(promotionStoreId, 2, '', expect.any(AbortSignal), expect.any(Object));
  await user.selectOptions(screen.getByLabelText('Status promosi'), 'active');
  await waitFor(() => expect(promotionService.list).toHaveBeenLastCalledWith(promotionStoreId, 1, '', expect.any(AbortSignal), expect.objectContaining({ status: 'active' })));
  expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('campaign=season');
  expect(screen.getByLabelText('Lokasi halaman')).not.toHaveTextContent('page=2');
});

it('shows store-wide active and inactive summaries independently of pagination and filters', async () => {
  const user = userEvent.setup();
  renderPage(<PromotionsPage />);
  await screen.findByText('Promotion 01');
  const summary = screen.getByRole('region', { name: 'Ringkasan promosi' });
  expect(within(summary).getByText('1')).toBeVisible();
  expect(within(summary).getByText('12')).toBeVisible();
  expect(screen.queryByRole('group', { name: 'Filter cepat promosi' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await screen.findByText('Promotion 13');
  await user.selectOptions(screen.getByLabelText('Status promosi'), 'active');
  await waitFor(() => expect(promotionService.list).toHaveBeenLastCalledWith(promotionStoreId, 1, '', expect.any(AbortSignal), expect.objectContaining({ status: 'active' })));
  expect(within(summary).getByText('12')).toBeVisible();
  expect(promotionService.summary).toHaveBeenCalledTimes(1);
});

it('uses cards on compact screens and keeps reader actions restricted', async () => {
  vi.mocked(window.matchMedia).mockImplementation(query => ({
    matches: query.includes('1279'), media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  }));
  const user = userEvent.setup();
  renderPage(<PromotionsPage />);
  const card = await screen.findByRole('article', { name: 'Promotion 01' });
  expect(card).toBeVisible();
  expect(screen.queryByRole('table', { name: 'Tabel promosi' })).not.toBeInTheDocument();
  await user.click(within(card).getByRole('button', { name: 'Aksi untuk Promotion 01' }));
  expect(screen.getByRole('menuitem', { name: 'Lihat detail' })).toBeVisible();
  expect(screen.queryByRole('menuitem', { name: 'Ubah' })).not.toBeInTheDocument();
});

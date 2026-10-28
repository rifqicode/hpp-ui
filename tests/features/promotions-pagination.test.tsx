import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import PromotionsPage from '@/pages/sales/promotions-page';
import { promotionService } from '@/features/promotions/services/promotion-service';
import { useAuthStore } from '@/store/use-auth-store';
import { renderPage } from '../support/render';
import { promotionFixture, promotionStoreId } from '../support/promotion-fixtures';

beforeEach(() => {
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
  await user.type(screen.getByRole('textbox', { name: 'Cari promosi' }), 'Promotion 13');
  await waitFor(() => expect(promotionService.list).toHaveBeenLastCalledWith(promotionStoreId, 1, 'Promotion 13', expect.any(AbortSignal), expect.any(Object)));
  expect(await screen.findByText('Promotion 13')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
});

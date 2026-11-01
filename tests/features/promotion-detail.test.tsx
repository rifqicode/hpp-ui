import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PromotionsPage from '@/pages/sales/promotions-page';
import { promotionService } from '@/features/promotions/services/promotion-service';
import { useAuthStore } from '@/store/use-auth-store';
import type { Promotion } from '@/features/promotions/types';
import { deferred, renderPage } from '../support/render';
import {
  promotionFixture,
  promotionOptions,
  promotionStoreId,
  simulationFixture,
} from '../support/promotion-fixtures';

const path = '/sales/promotions/:promotionId?';
const url = `/sales/promotions/${promotionFixture().id}`;

beforeEach(() => {
  useAuthStore.setState({
    activeStoreId: promotionStoreId,
    permissions: ['promotions:read', 'promotions:write'],
  });
  vi.spyOn(promotionService, 'get').mockResolvedValue(
    promotionFixture({ usage_count: 7, budget_spent: '14000' }),
  );
  vi.spyOn(promotionService, 'list').mockResolvedValue({
    data: [promotionFixture()],
    total: 1,
    page: 1,
    per_page: 12,
    active_count: 0,
    max_active_promotions: 5,
  });
  vi.spyOn(promotionService, 'options').mockResolvedValue(promotionOptions);
  vi.spyOn(promotionService, 'summary').mockResolvedValue({ active_count: 0, inactive_count: 1 });
  vi.spyOn(promotionService, 'simulate').mockResolvedValue(simulationFixture());
});

describe('promotion detail', () => {
  it('opens by URL without fetching the list or catalog and separates usage from simulation', async () => {
    renderPage(<PromotionsPage />, url, path);
    expect(await screen.findByRole('heading', { name: 'Sarapan Hemat' })).toBeVisible();
    expect(screen.getByText('Potongan 10% untuk total tagihan.')).toBeVisible();
    expect(screen.getByText('7')).toBeVisible();
    expect(screen.getByText('Estimasi laba kotor')).toBeVisible();
    expect(screen.getByText(/Ini bukan hasil penjualan aktual/)).toBeVisible();
    expect(screen.queryByLabelText('Nama promosi')).not.toBeInTheDocument();
    expect(promotionService.get).toHaveBeenCalledWith(promotionStoreId, promotionFixture().id);
    expect(promotionService.list).not.toHaveBeenCalled();
    expect(promotionService.summary).not.toHaveBeenCalled();
    expect(promotionService.options).not.toHaveBeenCalled();
    expect(promotionService.simulate).not.toHaveBeenCalled();
    const user = userEvent.setup();
    await user.click(screen.getByText('Lihat contoh transaksi dan rincian HPP'));
    expect(screen.getByText('Roti / Regular × 1')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Kembali ke promosi' }));
    expect(await screen.findByRole('table', { name: 'Tabel promosi' })).toBeVisible();
  });

  it('opens detail from the promotion name even for a writer, then explicitly enters edit', async () => {
    const user = userEvent.setup();
    renderPage(<PromotionsPage />, '/sales/promotions', path);
    await user.click(await screen.findByRole('link', { name: 'Sarapan Hemat' }));
    await screen.findByRole('heading', { name: 'Sarapan Hemat' });
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent(url);
    await user.click(screen.getByRole('button', { name: 'Ubah promosi' }));
    expect(await screen.findByLabelText('Nama promosi')).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Kembali ke promosi' }));
    expect(await screen.findByRole('heading', { name: 'Sarapan Hemat' })).toBeVisible();
  });

  it('denies direct access without read permission and hides editing from readers', async () => {
    useAuthStore.setState({ permissions: ['promotions:write'] });
    renderPage(<PromotionsPage />, url, path);
    expect(screen.getByRole('alert')).toHaveTextContent('tidak memiliki izin');
    expect(promotionService.get).not.toHaveBeenCalled();
    act(() => useAuthStore.setState({ permissions: ['promotions:read'] }));
    await screen.findByRole('heading', { name: 'Sarapan Hemat' });
    expect(screen.queryByRole('button', { name: 'Ubah promosi' })).not.toBeInTheDocument();
  });

  it('shows loading, allows retry after a missing promotion, and supports an empty simulation', async () => {
    const pending = deferred<Promotion>();
    vi.mocked(promotionService.get).mockImplementationOnce(() => pending.promise);
    renderPage(<PromotionsPage />, url, path);
    expect(screen.getByRole('status', { name: 'Memuat detail promosi' })).toHaveTextContent('Memuat aturan');
    await act(async () => pending.reject(new Error('Promotion not found')));
    expect(await screen.findByRole('alert')).toHaveTextContent('Promotion not found');
    vi.mocked(promotionService.get).mockResolvedValue(
      promotionFixture({ planning_snapshot: null, promo_budget: '0', usage_limit: 0 }),
    );
    await userEvent.setup().click(screen.getByRole('button', { name: 'Coba lagi' }));
    expect(await screen.findByText('Belum ada simulasi tersimpan.')).toBeVisible();
    expect(screen.getByText('Tanpa batas anggaran.')).toBeVisible();
  });

  it('discards the previous store detail while loading the new store', async () => {
    renderPage(<PromotionsPage />, url, path);
    await screen.findByRole('heading', { name: 'Sarapan Hemat' });
    const pending = deferred<Promotion>();
    vi.mocked(promotionService.get).mockReturnValueOnce(pending.promise);
    act(() => useAuthStore.setState({ activeStoreId: 'other-store' }));
    await waitFor(() =>
      expect(promotionService.get).toHaveBeenLastCalledWith('other-store', promotionFixture().id),
    );
    expect(screen.queryByRole('heading', { name: 'Sarapan Hemat' })).not.toBeInTheDocument();
    await act(async () => pending.reject(new Error('Promotion not found')));
    expect(await screen.findByRole('alert')).toHaveTextContent('Promotion not found');
  });

  it.each([
    {
      promo_type: 'BUY_X_GET_Y',
      heading: 'Menu bonus',
      summary: 'Beli menu persyaratan, dapatkan menu bonus gratis.',
    },
    { promo_type: 'BUNDLE', heading: 'Isi paket', summary: 'Menu dalam satu paket seharga' },
    {
      promo_type: 'SPECIAL_PRICE',
      heading: 'Menu tebus murah',
      summary: 'lalu tebus menu dengan harga khusus',
    },
  ] as const)(
    'shows $promo_type rules with resolved item names',
    async ({ promo_type, heading, summary }) => {
      vi.mocked(promotionService.get).mockResolvedValue(
        promotionFixture({
          promo_type,
          scope: 'ITEM',
          bundle_price: promo_type === 'BUNDLE' ? '15000' : null,
          min_purchase_amount: promo_type === 'SPECIAL_PRICE' ? '50000' : '0',
          items: [
            {
              variant_id: null,
              product_id: null,
              category_id: 'category-1',
              selector_name: 'Minuman',
              item_role: 'TRIGGER',
              required_quantity: '2',
              reward_price: '0',
            },
            ...(promo_type === 'BUNDLE'
              ? []
              : [
                  {
                    variant_id: 'reward-1',
                    product_id: null,
                    category_id: null,
                    selector_name: 'Donat Cokelat',
                    item_role: 'REWARD' as const,
                    required_quantity: '1',
                    reward_price: promo_type === 'SPECIAL_PRICE' ? '5000' : '0',
                  },
                ]),
          ],
        }),
      );
      renderPage(<PromotionsPage />, url, path);
      await screen.findByRole('heading', { name: 'Sarapan Hemat' });
      expect(screen.getByRole('heading', { name: heading })).toBeVisible();
      expect(screen.getByText('Minuman')).toBeVisible();
      expect(screen.getByText(text => text.includes(summary))).toBeVisible();
    },
  );
});

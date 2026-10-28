import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PromotionsPage from '@/pages/sales/promotions-page';
import { promotionService } from '@/features/promotions/services/promotion-service';
import { useAuthStore } from '@/store/use-auth-store';
import { renderPage, deferred } from '../support/render';
import { promotionFixture, promotionOptions, promotionStoreId, promotionVariantId, simulationFixture } from '../support/promotion-fixtures';
import type { PromotionSimulation } from '@/features/promotions/types';

beforeEach(() => {
  useAuthStore.setState({ activeStoreId: promotionStoreId, permissions: ['menu:promotions', 'promotions:read', 'promotions:write', 'promotions:delete'] });
  vi.spyOn(promotionService, 'list').mockResolvedValue({ data: [promotionFixture()], total: 1, page: 1, per_page: 12, active_count: 0, max_active_promotions: 5 });
  vi.spyOn(promotionService, 'options').mockResolvedValue(promotionOptions);
  vi.spyOn(promotionService, 'get').mockResolvedValue(promotionFixture());
  vi.spyOn(promotionService, 'simulate').mockResolvedValue(simulationFixture());
  vi.spyOn(promotionService, 'save').mockResolvedValue(promotionFixture());
  vi.spyOn(promotionService, 'setActive').mockResolvedValue(promotionFixture({ is_active: true }));
  vi.spyOn(promotionService, 'archive').mockResolvedValue(undefined);
});

async function openCreate() {
  const user = userEvent.setup();
  renderPage(<PromotionsPage />);
  await user.click(await screen.findByRole('button', { name: 'Buat promosi' }));
  await user.type(screen.getByLabelText('Nama promosi'), 'Promo Baru');
  return user;
}

describe('promotion master', () => {
  it('requires read permission and makes no catalog or master requests without it', () => {
    useAuthStore.setState({ permissions: ['menu:promotions'] });
    renderPage(<PromotionsPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('tidak memiliki izin');
    expect(promotionService.list).not.toHaveBeenCalled();
    expect(promotionService.options).not.toHaveBeenCalled();
  });

  it('loads the list and quota, opens stored details, and hides mutations from a reader', async () => {
    useAuthStore.setState({ permissions: ['promotions:read'] });
    const user = userEvent.setup(); renderPage(<PromotionsPage />);
    expect(await screen.findByText('Sarapan Hemat')).toBeVisible();
    expect(screen.getByText('0 / 5')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Buat promosi' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aktifkan' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Lihat' }));
    expect(screen.getByLabelText('Nama promosi')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /simulasi & terbitkan/i }));
    expect(await screen.findByText('Simulasi tersimpan')).toBeVisible();
    expect(promotionService.simulate).not.toHaveBeenCalled();
  });

  it('requires an explicit cost basis and saves decimal inputs without leaking client financial totals', async () => {
    const user = await openCreate();
    await user.click(screen.getByRole('button', { name: 'Lanjut' }));
    expect(promotionService.simulate).not.toHaveBeenCalled();
    await user.click(screen.getByRole('radio', { name: /Harga Bahan Baku Sekarang/i }));
    await user.click(screen.getByRole('button', { name: 'Lanjut' }));
    expect(screen.getByRole('button', { name: 'Simpan promosi' })).toBeDisabled();
    await user.selectOptions(screen.getByLabelText('Varian simulasi 1'), promotionVariantId);
    await screen.findByText('Aman & Menguntungkan');
    await user.click(screen.getByRole('button', { name: 'Simpan promosi' }));
    await screen.findByText('Promosi berhasil disimpan.');
    expect(promotionService.save).toHaveBeenCalledWith(promotionStoreId, expect.objectContaining({ name: 'Promo Baru', cost_basis: 'CURRENT_RECIPE', discount_value: '10', is_active: false, loss_leader_confirmed: false }), undefined);
    expect(vi.mocked(promotionService.save).mock.calls[0][1]).not.toHaveProperty('unit_economics');
  });

  it('switches the four strategy forms and permits category triggers without changing reward selectors', async () => {
    const user = await openCreate();
    await user.click(screen.getByRole('radio', { name: /Beli X Gratis Y/i }));
    expect(screen.getByText(/Belum ada menu persyaratan/i)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Tambah Persyaratan' }));
    await user.click(screen.getByRole('button', { name: 'Tambah Menu Bonus / Hadiah' }));
    expect(screen.getByLabelText('Pilihan menu bonus / hadiah 2')).toBeVisible();
    await user.selectOptions(screen.getByLabelText('Jenis pilihan 1'), 'category');
    await user.selectOptions(screen.getByLabelText('Pilihan persyaratan 1'), 'category-1');
    expect(screen.getByLabelText('Jenis pilihan 1')).toHaveValue('category');
    await user.click(screen.getByRole('radio', { name: /Paket Kombo Hemat/i }));
    expect(screen.getByLabelText('Harga satu paket (Rp)')).toBeVisible();
    expect(screen.queryByLabelText('Pilihan menu bonus / hadiah 2')).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Tebus Murah/i }));
    await user.click(screen.getByRole('button', { name: 'Tambah Menu Bonus / Hadiah' }));
    expect(screen.getByLabelText('Harga tebus 1 (Rp)')).toBeVisible();
    await user.click(screen.getByRole('radio', { name: /Potongan Harga/i }));
    expect(screen.getByLabelText('Jenis diskon')).toBeVisible();
  });

  it('discards an outdated simulation response after the form changes', async () => {
    const old = deferred<PromotionSimulation>();
    vi.mocked(promotionService.simulate).mockImplementationOnce(() => old.promise);
    const user = await openCreate();
    await user.click(screen.getByRole('button', { name: 'Lanjut' }));
    await user.click(screen.getByRole('radio', { name: /Modal Masak\/Produksi Terakhir/i }));
    await user.click(screen.getByRole('button', { name: 'Lanjut' }));
    await user.selectOptions(screen.getByLabelText('Varian simulasi 1'), promotionVariantId);
    await waitFor(() => expect(promotionService.simulate).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'Kembali' }));
    await user.click(screen.getByRole('radio', { name: /Harga Bahan Baku Sekarang/i }));
    await waitFor(() => expect(promotionService.simulate).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole('button', { name: 'Lanjut' }));
    await screen.findByText('Aman & Menguntungkan');
    await act(async () => old.resolve(simulationFixture(true)));
    expect(screen.queryByText('Strategi Nombok (Bakar Duit)')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simpan promosi' })).toBeEnabled();
  });

  it('confirms loss-leader activation against the latest server simulation', async () => {
    vi.mocked(promotionService.simulate).mockResolvedValue(simulationFixture(true));
    const user = userEvent.setup(); renderPage(<PromotionsPage />);
    await user.click(await screen.findByRole('button', { name: 'Aktifkan' }));
    const dialog = await screen.findByRole('dialog', { name: 'Konfirmasi strategi penetrasi pasar' });
    expect(promotionService.setActive).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Saya memahami, aktifkan promosi' }));
    await waitFor(() => expect(promotionService.setActive).toHaveBeenCalledWith(promotionStoreId, expect.objectContaining({ version: 1 }), true, true));
  });

  it('supports cancelling an archive and keeps the dialog open on a failed request', async () => {
    vi.mocked(promotionService.archive).mockRejectedValue(new Error('Archive unavailable'));
    const user = userEvent.setup(); renderPage(<PromotionsPage />);
    await user.click(await screen.findByRole('button', { name: 'Arsipkan' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Batal' }));
    expect(promotionService.archive).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Arsipkan' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Ya, arsipkan' }));
    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('Archive unavailable');
  });

  it('resets the editor and targets the new store when the active store changes', async () => {
    await openCreate();
    act(() => useAuthStore.setState({ activeStoreId: 'another-store' }));
    await screen.findByText('Sarapan Hemat');
    expect(screen.queryByLabelText('Nama promosi')).not.toBeInTheDocument();
    expect(promotionService.list).toHaveBeenLastCalledWith('another-store', 1, '', expect.any(AbortSignal), expect.any(Object));
  });

  it('does not toggle the opposite status when another user changed the promotion', async () => {
    vi.mocked(promotionService.get).mockResolvedValue(promotionFixture({ is_active: true, version: 2 }));
    const user = userEvent.setup(); renderPage(<PromotionsPage />);
    await user.click(await screen.findByRole('button', { name: 'Aktifkan' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Promosi telah berubah');
    expect(promotionService.setActive).not.toHaveBeenCalled();
    expect(promotionService.simulate).not.toHaveBeenCalled();
  });

  it('keeps a stale edit open after a server conflict so it can be reviewed', async () => {
    vi.mocked(promotionService.save).mockRejectedValue(new Error('Promotion changed; reload before saving'));
    const user = userEvent.setup(); renderPage(<PromotionsPage />);
    await user.click(await screen.findByRole('button', { name: 'Ubah' }));
    await user.type(screen.getByLabelText('Nama promosi'), ' Revisi');
    await user.click(screen.getByRole('button', { name: 'Lanjut' }));
    await user.click(screen.getByRole('button', { name: 'Lanjut' }));
    await screen.findByText('Aman & Menguntungkan');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Simpan promosi' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Simpan promosi' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Promotion changed');
    await user.click(screen.getByRole('button', { name: /aturan promosi/i }));
    expect(screen.getByLabelText('Nama promosi')).toHaveValue('Sarapan Hemat Revisi');
    expect(promotionService.save).toHaveBeenCalledWith(promotionStoreId, expect.objectContaining({ version: 1 }), promotionFixture().id);
  });
});

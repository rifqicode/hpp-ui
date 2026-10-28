import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocation } from 'react-router-dom';
import OnboardingPage from '@/pages/onboarding/onboarding-page';
import { OnboardingEntry } from '@/features/onboarding/components/onboarding-entry';
import { onboardingService } from '@/features/onboarding/services/onboarding-service';
import { recipeService } from '@/features/recipes/services/recipe-service';
import { newProductForm } from '@/features/recipes/lib/product-form';
import type { OnboardingData, OnboardingDraft, OnboardingState } from '@/features/onboarding/types';
import { useAuthStore } from '@/store/use-auth-store';
import { renderPage, deferred } from '../support/render';
import { mockPageServices, resetSession } from '../support/page-services';
import { product } from '../support/fixtures';

let persisted: OnboardingState | null;
const costedProduct = () => product({ estimatedHpp: 2000, ingredients: [{ id: 'ingredient-1', variantId: 'variant-product-1', stockId: 'stock-1', stockName: 'Tepung', baseUnit: 'g', quantity: 100, unitCost: 20, subtotalCost: 2000, availableStock: 0 }] });

beforeEach(() => {
  resetSession(); mockPageServices(); persisted = null;
  vi.spyOn(recipeService, 'createProduct').mockRejectedValue(new Error('Use the onboarding save adapter'));
  vi.mocked(recipeService.getAvailableMaterials).mockResolvedValue([{ id: 'stock-1', name: 'Tepung', baseUnit: 'g', currentStock: 0, avgCostPerUnit: 20 }]);
  vi.mocked(onboardingService.get).mockImplementation(async () => ({ state: persisted, should_start: !persisted }));
  vi.spyOn(onboardingService, 'save').mockImplementation(async (_store, revision, step, draft, action) => {
    if (persisted && persisted.revision !== revision) throw new Error('Progres berubah di perangkat lain.');
    persisted = { id: 'onboarding-1', store_id: 'store-1', status: action === 'complete' ? 'COMPLETED' : action === 'skip' ? 'SKIPPED' : 'IN_PROGRESS', step, revision: revision + 1, draft: structuredClone(draft), product_id: persisted?.product_id ?? null };
    const dismissed = action === 'skip' || persisted.status === 'SKIPPED';
    return { state: persisted, should_start: false, dismissed };
  });
  vi.spyOn(onboardingService, 'saveMaterial').mockImplementation(async (_store, material) => {
    persisted = { ...persisted!, revision: persisted!.revision + 1 };
    return { state: persisted, should_start: false, stock: { id: 'stock-1', name: material.name, base_unit: material.baseUnit, cost_per_unit: '20', reference_unit_cost: '20' } };
  });
  vi.spyOn(onboardingService, 'saveProduct').mockImplementation(async (_store, draft) => {
    persisted = { ...persisted!, step: 4, revision: persisted!.revision + 1, product_id: 'product-1' };
    const base = costedProduct();
    const saved = { ...base, name: draft.product.form.name, mode: draft.product.form.mode, variants: draft.product.form.variants.map((variant, index) => ({ ...base.variants[0], ...variant, id: variant.id ?? `variant-${index}`, productId: base.id, estimatedHpp: variant.ingredients.reduce((sum, line) => sum + line.quantity * 20, 0), ingredients: variant.ingredients.map((line, i) => ({ id: `ingredient-${index}-${i}`, variantId: `variant-${index}`, stockId: line.stockId, stockName: 'Tepung', baseUnit: line.unit || 'g', quantity: line.quantity, unitCost: 20, subtotalCost: line.quantity * 20, availableStock: 0 })) })) };
    return { state: persisted, should_start: false, product: saved };
  });
});

async function openMaterials() {
  const user = userEvent.setup();
  renderPage(<OnboardingPage />, '/onboarding');
  await screen.findByRole('heading', { name: 'Kenali biaya di balik produk Anda' });
  await user.click(screen.getByRole('button', { name: 'Lanjut: isi bahan baku' }));
  await screen.findByRole('heading', { name: 'Apa saja bahan produk Anda?' });
  return user;
}

describe('first product onboarding', () => {
  it('saves a material and recipe in one wizard, shows variant HPP without editing prices, and finishes', async () => {
    const user = await openMaterials();
    expect(screen.getByRole('img', { name: 'Kenali HPP, selesai' })).toBeVisible();
    expect(screen.queryByRole('img', { name: 'Bahan baku, selesai' })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Nama bahan'), 'Tepung');
    await user.type(screen.getByLabelText('Jumlah bahan (g)'), '1000');
    await user.type(screen.getByLabelText('Harga total (Rp)'), '20000');
    expect(screen.getByLabelText('Harga total (Rp)')).toHaveAccessibleDescription('Harga satuan: Rp20 / g');
    await user.clear(screen.getByLabelText('Jumlah bahan (g)'));
    await user.type(screen.getByLabelText('Jumlah bahan (g)'), '2000');
    expect(screen.getByLabelText('Harga total (Rp)')).toHaveAccessibleDescription('Harga satuan: Rp10 / g');
    await user.clear(screen.getByLabelText('Jumlah bahan (g)'));
    await user.type(screen.getByLabelText('Jumlah bahan (g)'), '1000');
    await user.click(screen.getByRole('button', { name: 'Simpan bahan & lanjut' }));
    await screen.findByRole('heading', { name: 'Tambah produk pertama' });
    expect(screen.getByRole('img', { name: 'Bahan baku, selesai' })).toBeVisible();
    expect(screen.queryByLabelText('Jumlah hasil satu resep')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/onboarding');
    await user.type(screen.getByLabelText('Nama produk'), 'Roti Coklat');
    await user.click(screen.getByRole('button', { name: 'Lanjut' }));
    expect(screen.getByRole('heading', { name: 'Bahan baku per satu pcs' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Tambah bahan' }));
    await user.selectOptions(screen.getByLabelText('Bahan 1'), 'stock-1');
    fireEvent.change(screen.getByLabelText('Takaran (g)'), { target: { value: '100' } });
    await user.click(screen.getByRole('button', { name: 'Bantu tentukan harga' }));
    fireEvent.change(screen.getByLabelText('Margin (%)'), { target: { value: '80' } });
    expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('0');
    await user.click(screen.getByRole('button', { name: 'Pakai hasil perhitungan' }));
    expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('10.000');
    await user.click(screen.getByRole('button', { name: 'Tambah varian' }));
    fireEvent.change(screen.getByLabelText('Nama varian'), { target: { value: 'Large' } });
    await user.selectOptions(screen.getByLabelText('Salin bahan baku dari varian lain'), '0');
    fireEvent.change(screen.getByLabelText('Takaran (g)'), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText('Margin (%)'), { target: { value: '80' } });
    await user.click(screen.getByRole('button', { name: 'Pakai hasil perhitungan' }));
    expect(screen.getByLabelText('Harga jual (Rp)')).toHaveValue('15.000');
    await user.click(screen.getByRole('button', { name: 'Simpan produk' }));
    await screen.findByRole('heading', { name: 'Ini biaya produk Anda' });
    expect(screen.getByRole('img', { name: 'Produk & bahan baku, selesai' })).toBeVisible();
    expect(vi.mocked(onboardingService.saveProduct).mock.calls[0][1].product.form.variants.map(variant => variant.ingredients[0].quantity)).toEqual([100, 150]);
    expect(recipeService.createProduct).not.toHaveBeenCalled();
    const calls = vi.mocked(onboardingService.saveProduct).mock.calls.length;
    await user.click(screen.getByRole('button', { name: 'Large' }));
    expect(screen.queryByLabelText('Coba harga jual varian (Rp)')).not.toBeInTheDocument();
    expect(screen.getByText('80%')).toBeVisible();
    expect(onboardingService.saveProduct).toHaveBeenCalledTimes(calls);
    await user.click(screen.getByRole('button', { name: 'Selesai & buka dashboard' }));
    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/dashboard'));
    expect(persisted?.status).toBe('COMPLETED');
    expect(persisted?.draft.completedSteps).toEqual([1, 2, 3, 4]);
    expect(onboardingService.saveMaterial).toHaveBeenCalledTimes(1);
  });

  it('rejects incomplete material data and retains input after a network failure', async () => {
    const user = await openMaterials();
    await user.type(screen.getByLabelText('Nama bahan'), 'Tepung');
    await user.click(screen.getByRole('button', { name: 'Simpan bahan & lanjut' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Lengkapi nama');
    expect(onboardingService.saveMaterial).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Jumlah bahan (g)'), '1000');
    await user.type(screen.getByLabelText('Harga total (Rp)'), '20000');
    vi.mocked(onboardingService.saveMaterial).mockRejectedValueOnce(new Error('Jaringan terputus'));
    await user.click(screen.getByRole('button', { name: 'Simpan bahan & lanjut' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Jaringan terputus');
    expect(screen.getByLabelText('Nama bahan')).toHaveValue('Tepung');
    const operation = vi.mocked(onboardingService.saveMaterial).mock.calls[0][1].key;
    await user.click(screen.getByRole('button', { name: 'Simpan bahan & lanjut' }));
    await screen.findByRole('heading', { name: 'Tambah produk pertama' });
    expect(vi.mocked(onboardingService.saveMaterial).mock.calls[1][1].key).toBe(operation);
  });

  it('loads an unfinished draft and marks onboarding skipped when the owner leaves', async () => {
    const draft: OnboardingDraft = { materials: [], product: { key: 'key-1', builderStep: 0, builderVariantIndex: 0, form: { ...newProductForm(), name: 'Resep belum selesai' }, existingProductId: '' } };
    persisted = { id: 'onboarding-1', store_id: 'store-1', status: 'IN_PROGRESS', step: 3, revision: 7, draft, product_id: null };
    renderPage(<OnboardingPage />, '/onboarding');
    expect(await screen.findByLabelText('Nama produk')).toHaveValue('Resep belum selesai');
    await userEvent.click(screen.getByRole('button', { name: 'Lewati' }));
    await waitFor(() => expect(persisted?.revision).toBe(8));
    expect(persisted?.draft.product?.form.name).toBe('Resep belum selesai');
    expect(persisted?.draft.completedSteps).toEqual([1, 2]);
    expect(persisted?.status).toBe('SKIPPED');
    expect(onboardingService.saveProduct).not.toHaveBeenCalled();
  });

  it('keeps saved progress when skipping from an earlier step', async () => {
    persisted = { id: 'onboarding-1', store_id: 'store-1', status: 'IN_PROGRESS', step: 3, revision: 4, draft: { completedSteps: [1, 2] }, product_id: null };
    renderPage(<OnboardingPage />, '/onboarding');
    await screen.findByRole('heading', { name: 'Tambah produk pertama' });
    await userEvent.click(screen.getByRole('button', { name: 'Kembali ke bahan baku' }));
    await screen.findByRole('heading', { name: 'Apa saja bahan produk Anda?' });
    expect(screen.getByRole('img', { name: 'Bahan baku, selesai' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Lewati' }));
    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/dashboard'));
    expect(persisted?.step).toBe(2);
    expect(persisted?.status).toBe('SKIPPED');
    expect(persisted?.draft.completedSteps).toEqual([1, 2]);
    expect(onboardingService.saveMaterial).not.toHaveBeenCalled();
    expect(onboardingService.saveProduct).not.toHaveBeenCalled();
  });

  it('skips without creating materials or products', async () => {
    renderPage(<OnboardingPage />, '/onboarding');
    await screen.findByRole('heading', { name: 'Kenali biaya di balik produk Anda' });
    await userEvent.click(screen.getByRole('button', { name: 'Lewati' }));
    await waitFor(() => expect(persisted?.status).toBe('SKIPPED'));
    expect(onboardingService.saveMaterial).not.toHaveBeenCalled();
    expect(onboardingService.saveProduct).not.toHaveBeenCalled();
  });

  it('keeps invited staff out of owner setup without making onboarding requests', async () => {
    useAuthStore.setState({ user: { ...useAuthStore.getState().user!, role: 'STAFF', account_type: 'STAFF' } });
    renderPage(<OnboardingPage />, '/onboarding');
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/dashboard');
    expect(onboardingService.get).not.toHaveBeenCalled();
  });

  it('uses an existing product without requiring another material or recipe', async () => {
    const selected = costedProduct();
    vi.mocked(onboardingService.products).mockResolvedValue([selected]);
    persisted = { id: 'onboarding-1', store_id: 'store-1', status: 'IN_PROGRESS', step: 3, revision: 2, draft: {}, product_id: null };
    renderPage(<OnboardingPage />, '/onboarding');
    await userEvent.selectOptions(await screen.findByLabelText('Gunakan produk yang sudah ada'), selected.id);
    expect(screen.queryByLabelText('Nama produk')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Gunakan produk & lihat HPP' }));
    await screen.findByRole('heading', { name: 'Ini biaya produk Anda' });
    expect(vi.mocked(onboardingService.saveProduct).mock.calls[0][1].product.existingProductId).toBe(selected.id);
    expect(onboardingService.saveMaterial).not.toHaveBeenCalled();
  });

  it('allows dashboard access after a progress failure without forcing a redirect loop', async () => {
    vi.mocked(onboardingService.get).mockRejectedValue(new Error('Progress unavailable'));
    renderPage(<OnboardingPage />, '/onboarding');
    expect(await screen.findByRole('alert')).toHaveTextContent('Progress unavailable');
    expect(screen.getByRole('link', { name: 'Buka dashboard' })).toHaveAttribute('href', '/dashboard?skipOnboarding=1');
    vi.mocked(onboardingService.get).mockResolvedValue({ state: null, should_start: false });
    await userEvent.click(screen.getByRole('button', { name: 'Coba muat ulang' }));
    expect(await screen.findByRole('heading', { name: 'Kenali biaya di balik produk Anda' })).toBeVisible();
  });

  it('continues with existing materials without creating another material', async () => {
    vi.mocked(onboardingService.materials).mockResolvedValue([{ id: 'stock-1', name: 'Tepung', base_unit: 'g', cost_per_unit: '20', reference_unit_cost: '20' }]);
    const user = await openMaterials();
    await user.click(screen.getByRole('button', { name: 'Simpan bahan & lanjut' }));
    await screen.findByRole('heading', { name: 'Tambah produk pertama' });
    await user.type(screen.getByLabelText('Nama produk'), 'Roti');
    await user.click(screen.getByRole('button', { name: 'Lanjut' }));
    await user.click(screen.getByRole('button', { name: 'Tambah bahan' }));
    await user.selectOptions(screen.getByLabelText('Bahan 1'), 'stock-1');
    expect(screen.getByLabelText('Bahan 1')).toHaveValue('stock-1');
    expect(onboardingService.saveMaterial).not.toHaveBeenCalled();
  });

  it('redirects a new owner from the dashboard and leaves skipped owners on it', async () => {
    const view = renderPage(<OnboardingEntry />, '/dashboard');
    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/onboarding'));
    view.unmount();
    vi.mocked(onboardingService.get).mockResolvedValue({ should_start: false, state: { id: 'onboarding-1', store_id: 'store-1', status: 'SKIPPED', step: 1, revision: 1, draft: {}, product_id: null } } satisfies OnboardingData);
    const resumed = renderPage(<OnboardingEntry />, '/dashboard');
    await waitFor(() => expect(resumed.client.isFetching()).toBe(0));
    expect(screen.queryByRole('region', { name: 'Panduan mulai' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/dashboard');
  });

  it('redirects dismissed owners away from a direct onboarding visit without loading forms', async () => {
    vi.mocked(onboardingService.get).mockResolvedValue({ state: null, should_start: false, dismissed: true });
    renderPage(<OnboardingPage />, '/onboarding');
    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/dashboard'));
    expect(onboardingService.materials).not.toHaveBeenCalled();
    expect(onboardingService.products).not.toHaveBeenCalled();
    expect(onboardingService.save).not.toHaveBeenCalled();
  });

  it.each([false, true])('hides the dashboard invitation after completion, even when should_start is %s', async shouldStart => {
    vi.mocked(onboardingService.get).mockResolvedValue({ should_start: shouldStart, state: { id: 'onboarding-1', store_id: 'store-1', status: 'COMPLETED', step: 4, revision: 5, draft: {}, product_id: 'product-1' } });
    const view = renderPage(<OnboardingEntry />, '/dashboard');
    await waitFor(() => expect(view.client.isFetching()).toBe(0));
    expect(screen.queryByRole('region', { name: 'Panduan mulai' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/dashboard');
  });

  it('keeps the resume invitation until onboarding has been completed', async () => {
    const state: OnboardingState = { id: 'onboarding-1', store_id: 'store-1', status: 'IN_PROGRESS', step: 3, revision: 3, draft: {}, product_id: null };
    vi.mocked(onboardingService.get).mockResolvedValue({ should_start: false, state });
    const view = renderPage(<OnboardingEntry />, '/dashboard');
    expect(await screen.findByRole('link', { name: 'Lanjutkan setup' })).toHaveAttribute('href', '/onboarding');
    vi.mocked(onboardingService.get).mockResolvedValue({ should_start: false, state: { ...state, status: 'COMPLETED', step: 4 } });
    await view.client.invalidateQueries({ queryKey: ['onboarding'] });
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Panduan mulai' })).not.toBeInTheDocument());
  });

  it('hides the onboarding invitation when the owner skipped it in another store', async () => {
    vi.mocked(onboardingService.get).mockResolvedValue({ state: null, should_start: false, dismissed: true });
    const view = renderPage(<OnboardingEntry />, '/dashboard');
    await waitFor(() => expect(view.client.isFetching()).toBe(0));
    expect(screen.queryByRole('region', { name: 'Panduan mulai' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/dashboard');
  });

  it('lands on dashboard after skipping onboarding without bouncing or looping when cache is populated', async () => {
    const pendingRefetch = deferred<OnboardingData>();
    vi.mocked(onboardingService.get).mockImplementation(async () => {
      if (persisted?.status === 'SKIPPED') {
        return pendingRefetch.promise;
      }
      return { state: null, should_start: true, dismissed: false };
    });

    function AppFlow() {
      const location = useLocation();
      return (
        <div>
          {location.pathname === '/onboarding' && <OnboardingPage />}
          {location.pathname === '/dashboard' && (
            <div>
              <OnboardingEntry />
              <div data-testid="dashboard-content">Dashboard Content</div>
            </div>
          )}
        </div>
      );
    }

    renderPage(<AppFlow />, '/dashboard');

    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/onboarding'));
    await screen.findByRole('heading', { name: 'Kenali biaya di balik produk Anda' });

    await userEvent.click(screen.getByRole('button', { name: 'Lewati' }));

    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/dashboard'));
    expect(screen.getByTestId('dashboard-content')).toBeVisible();

    // While refetch is pending (invalidation triggered, query isFetching), shouldRedirect remains false and does not bounce
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/dashboard');

    pendingRefetch.resolve({ state: persisted, should_start: false, dismissed: true });
    await waitFor(() => expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent('/dashboard'));
    expect(screen.getByTestId('dashboard-content')).toBeVisible();
    expect(persisted?.status).toBe('SKIPPED');
  });
});

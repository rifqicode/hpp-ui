import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BatchBuilder } from '@/features/production/components/batch-builder';
import { productionBatchService } from '@/features/production/services/production-batch-service';
import { recipeService } from '@/features/recipes/services/recipe-service';
import { mockPageServices, resetSession } from '../support/page-services';
import { product } from '../support/fixtures';
import { productionHead } from '../support/production-batch-fixture';
import { renderPage } from '../support/render';

beforeEach(() => {
  resetSession();
  mockPageServices();
  HTMLElement.prototype.scrollIntoView = vi.fn();
  vi.mocked(recipeService.getProducts).mockResolvedValue([
    product(),
    product({ id: 'product-2', name: 'Brownies Almond' }),
  ]);
  vi.mocked(productionBatchService.preview).mockImplementation(async (request) => ({
    ingredients: [
      {
        stock_id: 'flour',
        stock_name: 'Tepung',
        unit: 'g',
        required_qty: 600,
        available_qty: 0,
        is_sufficient: false,
        estimated_cost: 3000,
      },
    ],
    is_all_sufficient: false,
    items: request.items.map((item, idx) => ({
      variant_id: item.variant_id,
      product_name: idx === 0 ? 'Roti Coklat' : 'Brownies Almond',
      planned_qty: Number(item.planned_qty),
      items: [
        {
          stock_id: 'flour',
          stock_name: 'Tepung',
          unit: 'g',
          required_qty: Number(item.planned_qty) * 100,
          available_qty: 0,
          is_sufficient: false,
          estimated_cost: Number(item.planned_qty) * 500,
        },
      ],
      is_all_sufficient: false,
      estimated_bom: Number(item.planned_qty) * 500,
      overheads: [],
      estimated_overhead: 0,
      estimated_total: Number(item.planned_qty) * 500,
      estimated_hpp: 500,
    })),
  }));
});

describe('BatchBuilder multi-variant flow', () => {
  it('allows multi-selecting variants directly in Step 1, setting per-variant quantities and 1-per-1 ingredient preview in Step 2, and saving into one batch', async () => {
    const user = userEvent.setup();
    const save = vi
      .spyOn(productionBatchService, 'save')
      .mockResolvedValue(productionHead());
    const saved = vi.fn();

    renderPage(<BatchBuilder onHeadSaved={saved} />, '/production/batches/new');
    expect(
      await screen.findByRole('heading', { name: 'Mulai Batch Produksi Baru' })
    ).toBeVisible();

    // First variant is default-selected, second can be toggled directly in Step 1
    const firstCard = await screen.findByRole('checkbox', {
      name: /Roti Coklat/,
    });
    const secondCard = screen.getByRole('checkbox', {
      name: /Brownies Almond/,
    });
    expect(firstCard).toHaveAttribute('aria-checked', 'true');
    expect(secondCard).toHaveAttribute('aria-checked', 'false');

    await user.click(secondCard);
    expect(secondCard).toHaveAttribute('aria-checked', 'true');

    // Advance to Step 2
    await user.click(screen.getByRole('button', { name: 'Lanjut' }));
    expect(screen.getByText('2 Varian Dipilih')).toBeVisible();

    // Verify top section: Penanggung Jawab & Catatan inputs at the top of Step 2
    expect(
      screen.getByText('Informasi & Parameter Batch Dapur')
    ).toBeVisible();
    const chefInput = screen.getByLabelText(
      /Penanggung Jawab \/ Baker \(Opsional\)/i
    );
    const notesInput = screen.getByLabelText(
      /Catatan Batch Produksi \(Opsional\)/i
    );
    expect(chefInput).toBeVisible();
    expect(notesInput).toBeVisible();
    fireEvent.change(chefInput, { target: { value: 'Chef Budi' } });
    fireEvent.change(notesInput, { target: { value: 'Pesanan pagi' } });

    // Set target quantities per variant in the unified single-header rows
    const qtyInputs = screen.getAllByRole('spinbutton');
    expect(qtyInputs).toHaveLength(2);
    fireEvent.change(qtyInputs[0], { target: { value: '10' } });
    fireEvent.change(qtyInputs[1], { target: { value: '5' } });

    // Verify unified per-variant section and collapsible ingredient tables
    expect(
      await screen.findByText(/Target Produksi & Rincian Bahan Baku/)
    ).toBeVisible();
    expect(await screen.findByText(/Subtotal Roti Coklat/)).toBeVisible();
    expect(await screen.findByText(/Subtotal Brownies Almond/)).toBeVisible();
    expect(await screen.findByText('1.000 g')).toBeVisible();
    expect(await screen.findByText('500 g')).toBeVisible();
    expect(screen.queryByRole('columnheader', { name: 'Stok Gudang' })).not.toBeInTheDocument();

    // Verify dedicated warehouse stock status card
    expect(screen.getByText('Status Stok Bahan Baku')).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Stok di Gudang' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Stok yang Akan Dipakai' })).toBeVisible();

    // Test collapsing and re-expanding a variant row while keeping its summary visible
    const toggleFirstVariant = screen.getByRole('button', {
      name: /Sembunyikan rincian bahan Roti Coklat/i,
    });
    expect(toggleFirstVariant).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggleFirstVariant);
    expect(
      screen.queryByText(/Subtotal Roti Coklat/)
    ).not.toBeInTheDocument();
    // Summary metrics on the single-header row remain visible while collapsed
    expect(screen.getByText('Roti Coklat - Regular')).toBeVisible();
    const expandFirstVariant = screen.getByRole('button', {
      name: /Tampilkan rincian bahan Roti Coklat/i,
    });
    expect(expandFirstVariant).toHaveAttribute('aria-expanded', 'false');
    await user.click(expandFirstVariant);
    expect(await screen.findByText(/Subtotal Roti Coklat/)).toBeVisible();

    expect(
      screen.queryByText('Ringkasan Total Kebutuhan Batch & Stok Gudang (FIFO)')
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Total Estimasi Konsumsi Biaya Bahan Baku:')
    ).toBeVisible();

    // Advance to Step 3 (Review & Konfirmasi)
    await user.click(screen.getByRole('button', { name: 'Lanjut' }));
    expect(
      screen.getByText(/Daftar Varian dalam Batch \(2 Varian\)/)
    ).toBeVisible();

    await user.click(
      screen.getAllByRole('button', { name: 'Simpan ke Antrian' })[0]
    );
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          draft: false,
          notes: 'Penanggung Jawab: Chef Budi | Catatan: Pesanan pagi',
          items: [
            { variant_id: 'variant-product-1', planned_qty: '10' },
            { variant_id: 'variant-product-2', planned_qty: '5' },
          ],
        }),
        undefined
      )
    );
    expect(saved).toHaveBeenCalled();
  });

  it('renders fixed read-only variants in Step 2 (no dropdown or Tambah Varian button) and allows removing a variant', async () => {
    const user = userEvent.setup();
    const save = vi
      .spyOn(productionBatchService, 'save')
      .mockResolvedValue(productionHead());
    const saved = vi.fn();

    renderPage(<BatchBuilder onHeadSaved={saved} />, '/production/batches/new');
    await screen.findByRole('checkbox', { name: /Roti Coklat/ });
    await user.click(screen.getByRole('checkbox', { name: /Brownies Almond/ }));
    await user.click(screen.getByRole('button', { name: 'Lanjut' }));

    // Variants are fixed in Step 2 (no <select> combobox, no Tambah Varian button, and no Preset cepat)
    expect(screen.queryByRole('button', { name: 'Tambah Varian' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByText(/Preset cepat/i)).not.toBeInTheDocument();

    const firstQtyInput = screen.getByLabelText(
      /Target Jumlah Unit Produksi \(Roti Coklat/
    );
    const secondQtyInput = screen.getByLabelText(
      /Target Jumlah Unit Produksi \(Brownies Almond/
    );
    fireEvent.change(firstQtyInput, { target: { value: '12' } });
    fireEvent.change(secondQtyInput, { target: { value: '8' } });

    // Remove the first variant row in Step 2
    await user.click(screen.getByRole('button', { name: 'Hapus varian 1' }));
    expect(screen.getAllByRole('spinbutton')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Lanjut' }));
    expect(screen.getByLabelText('Tahapan Pembuatan Batch')).toBeVisible();
    await user.click(
      screen.getAllByRole('button', { name: 'Simpan ke Antrian' })[0]
    );
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          draft: false,
          items: [
            { variant_id: 'variant-product-2', planned_qty: '8' },
          ],
        }),
        undefined
      )
    );
    expect(saved).toHaveBeenCalled();
  });
});

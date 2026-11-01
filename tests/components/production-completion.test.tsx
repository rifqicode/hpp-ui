import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductionCompletionForm } from '@/features/production/components/production-completion-form';
import { productionBatchService } from '@/features/production/services/production-batch-service';
import { overheadService } from '@/features/overheads/services/overhead-service';
import { productionHead, productionLog } from '../support/production-batch-fixture';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(overheadService, 'getOverheads').mockResolvedValue([]);
});
describe('production completion actual ingredients', () => {
  it('keeps four-decimal ingredient precision across split consumed lots', async () => {
    const user = userEvent.setup(); const head = productionHead();
    const complete = vi.spyOn(productionBatchService, 'complete').mockResolvedValue({ ...head, status: 'COMPLETED' });
    const done = vi.fn(); render(<ProductionCompletionForm batch={head} logs={head.logs} onDone={done} onCancel={vi.fn()} />);
    expect(screen.getByLabelText('Tepung (kg)')).toHaveValue(0.3);
    await user.click(screen.getByRole('button', { name: 'Konfirmasi Selesaikan' }));
    await waitFor(() => expect(complete).toHaveBeenCalledWith(head.id, expect.any(String), [expect.objectContaining({ actual_ingredients: [{ stock_id: 'flour', sale_item_modifier_id: undefined, quantity: '0.3' }] })]));
    expect(done).toHaveBeenCalled();
  });
  it('retains actual inputs and operation ID on stock shortage for safe retry', async () => {
    const user = userEvent.setup(); const head = productionHead();
    const complete = vi.spyOn(productionBatchService, 'complete').mockRejectedValueOnce(new Error('Stok tepung kurang')).mockResolvedValueOnce(head);
    render(<ProductionCompletionForm batch={head} logs={head.logs} onDone={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Tepung (kg)'), { target: { value: '0.4' } });
    await user.click(screen.getByRole('button', { name: 'Konfirmasi Selesaikan' }));
    expect(await screen.findByText('Stok tepung kurang')).toBeVisible(); expect(screen.getByLabelText('Tepung (kg)')).toHaveValue(0.4);
    await user.click(screen.getByRole('button', { name: 'Konfirmasi Selesaikan' }));
    await waitFor(() => expect(complete).toHaveBeenCalledTimes(2));
    expect(complete.mock.calls[0][1]).toBe(complete.mock.calls[1][1]);
  });
  it('accepts failed output only with waste and reason', async () => {
    const user = userEvent.setup(); const head = productionHead(); const complete = vi.spyOn(productionBatchService, 'complete').mockResolvedValue(head);
    render(<ProductionCompletionForm batch={head} logs={head.logs} onDone={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Hasil baik'), { target: { value: '0' } });
    await user.click(screen.getByRole('button', { name: 'Konfirmasi Selesaikan' }));
    expect(screen.getByText(/Produksi gagal membutuhkan/)).toBeVisible(); expect(complete).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Waste / produk afkir'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Catatan / alasan produksi gagal'), { target: { value: 'Oven mati' } });
    await user.click(screen.getByRole('button', { name: 'Konfirmasi Selesaikan' }));
    await waitFor(() => expect(complete).toHaveBeenCalledWith(head.id, expect.any(String), [expect.objectContaining({ actual_qty: '0', waste_qty: '10', notes: 'Oven mati' })]));
  });
  it('loads production master overheads with default values and allows editing them for an MTO log', async () => {
    const user = userEvent.setup();
    const log = productionLog();
    log.recipe_snapshot.overheads = [];
    const head = productionHead({ source: 'POS', logs: [log] });
    vi.spyOn(overheadService, 'getOverheads').mockResolvedValue([
      {
        id: 'oh-gas',
        storeId: 'store-1',
        name: 'Gas LPG',
        category: 'PRODUCTION',
        defaultAmount: 15000,
        notes: '',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'oh-labor',
        storeId: 'store-1',
        name: 'Tenaga Kerja Dapur',
        category: 'PRODUCTION',
        defaultAmount: 25000,
        notes: '',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    ]);
    const complete = vi.spyOn(productionBatchService, 'complete').mockResolvedValue(head);
    render(<ProductionCompletionForm batch={head} logs={head.logs} onDone={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.queryByLabelText('Biaya tenaga kerja (Rp)')).toBeNull();
    const gasInput = await screen.findByLabelText('Gas LPG (Rp)');
    const laborInput = screen.getByLabelText('Tenaga Kerja Dapur (Rp)');
    expect(gasInput).toHaveValue(15000);
    expect(laborInput).toHaveValue(25000);

    fireEvent.change(gasInput, { target: { value: '18000' } });
    await user.click(screen.getByRole('button', { name: 'Konfirmasi Selesaikan' }));
    await waitFor(() =>
      expect(complete).toHaveBeenCalledWith(head.id, expect.any(String), [
        expect.objectContaining({
          overheads: [
            { overhead_type_id: 'oh-gas', name: 'Gas LPG', amount: '18000' },
            { overhead_type_id: 'oh-labor', name: 'Tenaga Kerja Dapur', amount: '25000' },
          ],
        }),
      ]),
    );
  });
  it('submits separate results and existing overhead per variant in one completion', async () => {
    const user = userEvent.setup(); const head = productionHead({ logs: [productionLog(), productionLog({ id: 'log-2' })] });
    const complete = vi.spyOn(productionBatchService, 'complete').mockResolvedValue(head);
    render(<ProductionCompletionForm batch={head} logs={head.logs} onDone={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getAllByLabelText('Hasil baik')[1], { target: { value: '8' } });
    await user.click(screen.getByRole('button', { name: 'Konfirmasi Selesaikan' }));
    await waitFor(() => expect(complete).toHaveBeenCalledWith(head.id, expect.any(String), [expect.objectContaining({ log_id: 'log-1', actual_qty: '10' }), expect.objectContaining({ log_id: 'log-2', actual_qty: '8' })]));
  });

  it('supports step-accordion confirmation to progress across multiple variants', async () => {
    const user = userEvent.setup();
    const head = productionHead({
      logs: [
        productionLog({ id: 'log-1' }),
        productionLog({ id: 'log-2' }),
      ],
    });
    render(
      <ProductionCompletionForm
        batch={head}
        logs={head.logs}
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    // Initial state: variant 1 is expanded, variant 2 is collapsed
    const nextBtn1 = screen.getByRole('button', { name: 'Simpan & Lanjut' });
    expect(nextBtn1).toBeVisible();

    // Confirming variant 1 advances to variant 2
    await user.click(nextBtn1);
    expect(await screen.findByLabelText('Tervalidasi')).toBeVisible();

    // Now variant 2 has its close button visible ("Simpan")
    const closeBtn2 = screen.getByRole('button', { name: 'Simpan' });
    expect(closeBtn2).toBeVisible();

    // Confirming variant 2 closes it
    await user.click(closeBtn2);
    expect((await screen.findAllByLabelText('Tervalidasi')).length).toBe(2);
  });

  it('renders "Simpan" button for single variant production item', async () => {
    const user = userEvent.setup();
    const head = productionHead();
    render(
      <ProductionCompletionForm
        batch={head}
        logs={head.logs}
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const saveBtn = screen.getByRole('button', { name: 'Simpan' });
    expect(saveBtn).toBeVisible();
    await user.click(saveBtn);
    expect(await screen.findByLabelText('Tervalidasi')).toBeVisible();
  });
});

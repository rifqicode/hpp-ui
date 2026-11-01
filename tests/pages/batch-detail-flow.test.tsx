import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BatchDetailPage from '@/pages/production/batch-detail-page';
import { productionBatchService } from '@/features/production/services/production-batch-service';
import { useAuthStore } from '@/store/use-auth-store';
import { mockPageServices, resetSession } from '../support/page-services';
import { productionHead, productionLog } from '../support/production-batch-fixture';
import { renderPage } from '../support/render';

beforeEach(() => {
  resetSession();
  mockPageServices();
  useAuthStore.setState({ permissions: ['production:read', 'production:write'] });
});

describe('BatchDetailPage production sheet', () => {
  it('switches variants through the URL while preserving other parameters', async () => {
    const user = userEvent.setup();
    vi.mocked(productionBatchService.get).mockResolvedValue(
      productionHead({
        logs: [
          productionLog(),
          productionLog({
            id: 'log-2',
            status: 'COMPLETED',
            good_quantity: '9',
            waste_quantity: '1',
            hpp_per_unit: '12.5',
            recipe_snapshot: {
              product_name: 'Brownies',
              variant_name: 'Keju',
              product_unit: 'box',
              items: [],
            },
            notes: 'Pisahkan kemasan',
          }),
        ],
      }),
    );
    renderPage(
      <BatchDetailPage />,
      '/production/batches/head-1?context=kitchen',
      '/production/batches/:batchId',
    );
    const nav = await screen.findByRole('navigation', { name: 'Varian produksi' });
    expect(within(nav).getAllByRole('button')[0]).toHaveAttribute('aria-current', 'true');
    await user.click(within(nav).getByRole('button', { name: /Keju/ }));
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent(
      'context=kitchen&variant=log-2',
    );
    const detail = screen.getByRole('region', { name: 'Detail varian' });
    expect(within(detail).getByRole('heading', { name: 'Brownies - Keju' })).toBeVisible();
    expect(within(detail).getByText('Rp 12,5')).toBeVisible();
    expect(within(detail).getByText(/1 afkir/)).toBeVisible();
    expect(within(detail).getByText(/Pisahkan kemasan/)).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Biaya seluruh batch' })).not.toBeInTheDocument();
    expect(within(detail).getByRole('region', { name: 'Rincian biaya' })).toBeVisible();
    expect(within(detail).queryByRole('button', { name: 'Action' })).not.toBeInTheDocument();
    expect(
      within(detail).queryByRole('button', { name: 'Selesaikan varian' }),
    ).not.toBeInTheDocument();
  });

  it('supports direct variant links and the mobile selector', async () => {
    vi.mocked(productionBatchService.get).mockResolvedValue(
      productionHead({ logs: [productionLog(), productionLog({ id: 'log-2' })] }),
    );
    renderPage(
      <BatchDetailPage />,
      '/production/batches/head-1?variant=log-2&context=kitchen',
      '/production/batches/:batchId',
    );
    const select = await screen.findByLabelText('Pilih varian');
    expect(select).toHaveValue('log-2');
    fireEvent.change(select, { target: { value: 'log-1' } });
    expect(screen.getByLabelText('Lokasi halaman')).toHaveTextContent(
      'variant=log-1&context=kitchen',
    );
  });

  it('keeps the sidebar for a single queued variant without showing premature results', async () => {
    vi.mocked(productionBatchService.get).mockResolvedValue(
      productionHead({
        status: 'QUEUED',
        started_at: null,
        logs: [productionLog({ status: 'QUEUED', started_at: null, consumptions: [] })],
      }),
    );
    renderPage(
      <BatchDetailPage />,
      '/production/batches/head-1?variant=stale',
      '/production/batches/:batchId',
    );
    expect(await screen.findByRole('heading', { name: 'Brownies - Original' })).toBeVisible();
    expect(screen.getByRole('navigation', { name: 'Varian produksi' })).toBeVisible();
    expect(
      screen
        .getByRole('navigation', { name: 'Varian produksi' })
        .querySelector('[aria-current="true"]'),
    ).toHaveTextContent('Brownies');
    expect(screen.queryByRole('region', { name: 'Biaya seluruh batch' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Rincian biaya' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Varian produksi' })).not.toBeInTheDocument();
    expect(screen.queryByText(/dari \d+ selesai/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+ diproses · \d+ antre/)).not.toBeInTheDocument();
    expect(screen.getByText('Target produksi')).toBeVisible();
    expect(screen.queryByText('HPP per unit')).not.toBeInTheDocument();
    expect(screen.queryByText('Gas')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mulai proses' })).toBeVisible();
  });

  it('keeps completion and cancellation scoped to the selected variant', async () => {
    const user = userEvent.setup();
    const cancel = vi.spyOn(productionBatchService, 'cancel').mockResolvedValue(productionHead());
    vi.mocked(productionBatchService.get).mockResolvedValue(
      productionHead({ logs: [productionLog(), productionLog({ id: 'log-2' })] }),
    );
    renderPage(
      <BatchDetailPage />,
      '/production/batches/head-1?variant=log-2',
      '/production/batches/:batchId',
    );
    const detail = await screen.findByRole('region', { name: 'Detail varian' });
    expect(
      within(detail).queryByRole('button', { name: 'Selesaikan varian' }),
    ).not.toBeInTheDocument();
    await user.click(within(detail).getByRole('button', { name: 'Action' }));
    await user.click(screen.getByRole('menuitem', { name: 'Selesaikan varian' }));
    expect(await screen.findByRole('heading', { name: 'Selesaikan Produksi' })).toBeVisible();
    await user.keyboard('{Escape}');
    await user.click(within(detail).getByRole('button', { name: 'Action' }));
    await user.click(screen.getByRole('menuitem', { name: 'Batalkan varian' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Batalkan & Pulihkan Stok' })).toBeDisabled();
    await user.type(within(dialog).getByLabelText('Alasan pembatalan'), 'Salah varian');
    await user.click(within(dialog).getByRole('button', { name: 'Batalkan & Pulihkan Stok' }));
    expect(cancel).toHaveBeenCalledWith('head-1', 'Salah varian', 'log-2');
  });

  it('shows completed costs and excludes cancelled variants from the batch total', async () => {
    const completed = {
      ...productionLog({ status: 'COMPLETED', total_cost: '170' }),
      overheads: [{ name: 'Gas aktual', amount: '50' }],
      labor_cost: '20',
    };
    const second = productionLog({
      id: 'log-2',
      status: 'COMPLETED',
      bom_cost: '200',
      total_cost: '200',
    });
    vi.mocked(productionBatchService.get).mockResolvedValue(
      productionHead({
        status: 'COMPLETED',
        logs: [
          completed,
          second,
          productionLog({ id: 'log-cancel', status: 'CANCELLED', total_cost: '9000' }),
        ],
      }),
    );
    renderPage(<BatchDetailPage />, '/production/batches/head-1', '/production/batches/:batchId');
    const summary = await screen.findByRole('region', { name: 'Biaya seluruh batch' });
    expect(within(summary).getByText('Rp 300')).toBeVisible();
    expect(within(summary).getByText('Rp 70')).toBeVisible();
    expect(within(summary).getByText('Rp 370')).toBeVisible();
    expect(screen.getByText('Gas aktual')).toBeVisible();
    expect(screen.getByRole('region', { name: 'Rincian biaya' })).toBeVisible();
  });

  it.each(['DRAFT', 'QUEUED', 'IN_PROGRESS', 'CANCELLED', 'VOID'] as const)(
    'hides batch and variant cost summaries for %s production',
    async status => {
      vi.mocked(productionBatchService.get).mockResolvedValue(
        productionHead({ status, logs: [productionLog({ status })] }),
      );
      renderPage(<BatchDetailPage />, '/production/batches/head-1', '/production/batches/:batchId');
      await screen.findByRole('heading', { name: 'Brownies - Original' });
      expect(screen.queryByRole('region', { name: 'Biaya seluruh batch' })).not.toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Rincian biaya' })).not.toBeInTheDocument();
      expect(screen.queryByText('Biaya sementara')).not.toBeInTheDocument();
    },
  );

  it('hides write actions for read-only users and explains empty batches', async () => {
    useAuthStore.setState({ permissions: ['production:read'] });
    vi.mocked(productionBatchService.get).mockResolvedValue(productionHead({ logs: [] }));
    renderPage(<BatchDetailPage />, '/production/batches/head-1', '/production/batches/:batchId');
    expect(await screen.findByText('Belum ada varian pada batch ini.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Action' })).not.toBeInTheDocument();
  });
});

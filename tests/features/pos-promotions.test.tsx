import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PosPage from '@/pages/sales/pos-page';
import { recipeService } from '@/features/recipes/services/recipe-service';
import { salesService, normalizeSale } from '@/features/sales/services/sales-service';
import { posPromotionService } from '@/features/promotions/services/pos-promotion-service';
import { useAuthStore } from '@/store/use-auth-store';
import { mockPageServices, resetSession } from '../support/page-services';
import { product } from '../support/fixtures';
import { deferred, renderPage } from '../support/render';
import type { POSPromotion, PromotionPreviewRequest } from '@/features/promotions/types/pos';

function candidate(input: PromotionPreviewRequest): POSPromotion {
  const quantity = input.items.reduce((sum, line) => sum + Number(line.quantity), 0);
  return {
    id: 'promo-breakfast', name: 'Bonus Kopi', description: 'Beli roti, gratis kopi.', promo_type: 'BUY_X_GET_Y', min_purchase_amount: '0', is_customer_required: false,
    items: [{ variant_id: 'variant-product-1', item_role: 'TRIGGER', required_quantity: '1', reward_price: '0' }, { variant_id: 'variant-coffee', item_role: 'REWARD', required_quantity: '1', reward_price: '0' }],
    eligible: quantity >= 1, needs_configuration: false, discount_amount: '5000', gross_sales: String(quantity * 10000 + 5000), net_sales: String(quantity * 10000),
    lines: [...input.items.map((line, index) => ({ source_index: index, variant_id: line.variant_id, name: 'Roti Coklat', quantity: line.quantity, normal_price: '10000', charged_price: '10000', discount_amount: '0', subtotal: String(Number(line.quantity) * 10000), is_reward_item: false, modifier_option_ids: [] })),
      { source_index: -1, variant_id: 'variant-coffee', name: 'Kopi / Regular', quantity: '1', normal_price: '5000', charged_price: '0', discount_amount: '0', subtotal: '0', is_reward_item: true, modifier_option_ids: [], modifier_groups: [] }],
  };
}

beforeEach(() => {
  resetSession(); mockPageServices();
  useAuthStore.setState(state => ({ permissions: [...state.permissions, 'orders:create'] }));
  vi.mocked(recipeService.getProducts).mockResolvedValue([product(), product({ id: 'coffee', name: 'Kopi', sellingPrice: 5000 })]);
  vi.spyOn(posPromotionService, 'preview').mockImplementation(async (_, input) => [candidate(input)]);
  vi.spyOn(salesService, 'createSale').mockResolvedValue(normalizeSale({
    id: 'sale-promo', invoice_number: 'TRX-PROMO', customer_name: 'Guest', payment_method: 'CASH', total_amount: '10000', total_cost: '6000', discount_amount: '5000', promotion_id: 'promo-breakfast',
    promotions: [{ promo_name: 'Bonus Kopi', promo_type: 'BUY_X_GET_Y', discount_amount: '5000', gross_sales: '15000', net_sales: '10000', total_cost: '6000', gross_profit: '4000', cost_status: 'ACTUAL' }],
    items: [{ id: 'paid', variant_id: 'variant-product-1', product_name: 'Roti Coklat', variant_name: 'Regular', quantity: '1', price_at_sale: '10000', subtotal: '10000', modifiers: [] }, { id: 'free', variant_id: 'variant-coffee', product_name: 'Kopi', variant_name: 'Regular', quantity: '1', price_at_sale: '0', subtotal: '0', is_reward_item: true, modifiers: [] }],
  }));
  vi.spyOn(window, 'print').mockImplementation(() => {});
});

async function addAndSelect() {
  const user = userEvent.setup(); renderPage(<PosPage />, '/sales/pos');
  const card = (await screen.findByRole('heading', { name: 'Roti Coklat', level: 3 })).closest('[data-slot="card"]') as HTMLElement;
  await user.click(within(card).getByRole('button', { name: 'Pilih Produk' }));
  await user.click(screen.getByRole('button', { name: 'Gunakan Promosi' }));
  const dialog = screen.getByRole('dialog', { name: 'Gunakan Promosi' });
  await user.click(await within(dialog).findByRole('button', { name: 'Pilih promosi' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Proses Pesanan' })).toBeEnabled());
  return user;
}

describe('POS promotion integration', () => {
  it('injects a reward preview but submits only paid items and prints the authoritative snapshot', async () => {
    const user = await addAndSelect();
    expect(screen.getByText('[GRATIS]')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Proses Pesanan' }));
    await user.click(screen.getByRole('button', { name: 'Selesaikan Transaksi' }));
    await waitFor(() => expect(salesService.createSale).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(salesService.createSale).mock.calls[0][0];
    expect(payload.promotionId).toBe('promo-breakfast');
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].variantId).toBe('variant-product-1');
    const receipt = await screen.findByRole('dialog', { name: /Transaksi Berhasil/ });
    expect(within(receipt).getByText('Promo: Bonus Kopi')).toBeVisible();
    expect(within(receipt).getByText(/Kopi.*\[GRATIS\]/)).toBeVisible();
  });

  it('hides stale rewards and blocks payment while a changed cart is revalidated', async () => {
    const user = await addAndSelect();
    const pending = deferred<POSPromotion[]>();
    vi.mocked(posPromotionService.preview).mockImplementationOnce(() => pending.promise);
    await user.click(screen.getByRole('button', { name: 'Tambah Roti Coklat - Regular' }));
    expect(screen.getByRole('button', { name: 'Proses Pesanan' })).toBeDisabled();
    expect(screen.queryByText('[GRATIS]')).not.toBeInTheDocument();
    const input = vi.mocked(posPromotionService.preview).mock.calls.at(-1)![1];
    await act(async () => pending.resolve([{ ...candidate(input), eligible: false, reason: 'Remaining promotion budget cannot fund this cart', lines: [] }]));
    expect(await screen.findByRole('alert')).toHaveTextContent('Remaining promotion budget');
    await user.click(screen.getByRole('button', { name: 'Lepas promosi' }));
    expect(screen.getByRole('button', { name: 'Proses Pesanan' })).toBeEnabled();
  });

  it('clears the selected promotion when its last paid trigger is removed', async () => {
    const user = await addAndSelect();
    await user.click(screen.getByRole('button', { name: 'Hapus Roti Coklat - Regular' }));
    expect(screen.queryByText('[GRATIS]')).not.toBeInTheDocument();
    expect(screen.queryByText('Promo: Bonus Kopi')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proses Pesanan' })).toBeDisabled();
  });

  it('allows cashier redemption without backoffice promotion permissions and exposes no simulator request', async () => {
    useAuthStore.setState({ permissions: ['menu:pos', 'orders:create'] });
    await addAndSelect();
    expect(posPromotionService.preview).toHaveBeenCalled();
    expect(screen.queryByText('Simulator anggaran')).not.toBeInTheDocument();
  });

  it('preserves fractional cash instead of stripping the decimal separator', async () => {
    vi.mocked(posPromotionService.preview).mockImplementation(async (_, input) => [{ ...candidate(input), net_sales: '9999.5', discount_amount: '5000.5' }]);
    const user = await addAndSelect();
    await user.click(screen.getByRole('button', { name: 'Proses Pesanan' }));
    expect(screen.getByRole('textbox', { name: 'Uang diterima' })).toHaveValue('9.999,5');
    await user.click(screen.getByRole('button', { name: 'Selesaikan Transaksi' }));
    await waitFor(() => expect(salesService.createSale).toHaveBeenCalled());
    expect(vi.mocked(salesService.createSale).mock.calls[0][0].cashReceived).toBe(9999.5);
  });
});

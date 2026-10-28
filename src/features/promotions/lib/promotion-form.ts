import type { BasketItem, Promotion, PromotionInput, PromotionItemInput, PromotionType } from '../types';

export const promotionTypes: { value: PromotionType; label: string; description: string }[] = [
  { value: 'DIRECT_DISCOUNT', label: 'Potongan Harga (Diskon)', description: 'Diskon % atau potongan Rp' },
  { value: 'BUY_X_GET_Y', label: 'Beli X Gratis Y (Bonus)', description: 'Contoh: Beli 2 Brownies Gratis 1 Brownies, atau Beli Kopi Gratis Donat' },
  { value: 'BUNDLE', label: 'Paket Kombo Hemat', description: 'Gabungan menu dengan harga khusus, misal 1 Roti + 1 Kopi Rp 15.000' },
  { value: 'SPECIAL_PRICE', label: 'Tebus Murah', description: 'Belanja min Rp 50.000, tebus menu khusus harga murah' },
];

export const healthLabels = {
  PROFITABLE: 'Aman & Menguntungkan',
  LOW_MARGIN: 'Untung Tipis (Perlu Hati-hati)',
  MARGIN_DEFICIT: 'Strategi Nombok (Bakar Duit)',
} as const;

export function newPromotionItem(role: PromotionItemInput['item_role'] = 'TRIGGER'): PromotionItemInput {
  return { variant_id: null, product_id: null, category_id: null, item_role: role, required_quantity: '1', reward_price: '0' };
}

export function newPromotionInput(): PromotionInput {
  return {
    name: '', code: null, description: '', promo_type: 'DIRECT_DISCOUNT', scope: 'BILL', cost_basis: '',
    discount_type: 'PERCENTAGE', discount_value: '10', max_discount_amount: '0', min_purchase_amount: '0',
    bundle_price: null, start_at: null, end_at: null, is_active: false, promo_budget: '0',
    is_multiplier_allowed: true, max_reward_per_transaction: 1, is_customer_required: false,
    applicable_channels: ['POS'], allow_stacking: false, items: [], simulation_items: [{ variant_id: '', quantity: '1' }],
    loss_leader_confirmed: false, version: 0,
  };
}

export function inputFromPromotion(promotion: Promotion): PromotionInput {
  const defaults = newPromotionInput();
  const input = Object.fromEntries(Object.keys(defaults).map(key => [key, promotion[key as keyof PromotionInput] ?? defaults[key as keyof PromotionInput]])) as unknown as PromotionInput;
  return { ...input, code: promotion.code, bundle_price: promotion.bundle_price, start_at: promotion.start_at, end_at: promotion.end_at,
    items: promotion.items.map(item => ({ variant_id: item.variant_id ?? null, product_id: item.product_id ?? null, category_id: item.category_id ?? null, item_role: item.item_role, required_quantity: String(item.required_quantity), reward_price: String(item.reward_price) })),
    simulation_items: promotion.simulation_items.map(item => ({ variant_id: item.variant_id, quantity: String(item.quantity) })),
    loss_leader_confirmed: false,
  };
}

export function changePromotionType(input: PromotionInput, kind: PromotionType): PromotionInput {
  const triggerItems = input.items.filter(item => item.item_role === 'TRIGGER');
  const rewardItems = input.items.filter(item => item.item_role === 'REWARD');
  const base = { ...input, promo_type: kind, scope: 'ITEM' as const, discount_type: '' as const, discount_value: '0', max_discount_amount: '0', bundle_price: null, loss_leader_confirmed: false };
  switch (kind) {
    case 'DIRECT_DISCOUNT': return { ...base, scope: 'BILL', discount_type: 'PERCENTAGE', discount_value: '10', items: [] };
    case 'BUY_X_GET_Y': return { ...base, items: [...triggerItems, ...rewardItems.map(item => ({ ...item, reward_price: '0' }))] };
    case 'BUNDLE': return { ...base, bundle_price: '', items: triggerItems };
    case 'SPECIAL_PRICE': return { ...base, min_purchase_amount: input.min_purchase_amount === '0' ? '' : input.min_purchase_amount, items: rewardItems };
  }
}

export const applyStrategyChange = changePromotionType;

export const decimalPattern = /^\d+(?:\.\d{1,4})?$/;
export function positiveDecimal(value: string): boolean {
  return decimalPattern.test(value) && /[1-9]/.test(value);
}

export function formReadiness(input: PromotionInput): string {
  if (!input.cost_basis) return 'Pilih cara hitung modal resep (dasar HPP) untuk menjalankan simulasi.';
  if (!input.simulation_items.length || input.simulation_items.some(item => !item.variant_id || !positiveDecimal(item.quantity))) return 'Lengkapi menu dan jumlah pada contoh pesanan pelanggan.';
  if (input.items.some(item => (!item.variant_id && !item.product_id && !item.category_id) || !positiveDecimal(item.required_quantity))) return 'Lengkapi pilihan menu dan jumlah persyaratan promo.';
  if (!input.applicable_channels.length) return 'Pilih setidaknya satu kanal penjualan.';
  const amounts = [input.discount_value, input.max_discount_amount, input.min_purchase_amount, input.promo_budget, ...input.items.map(item => item.reward_price)];
  if (input.bundle_price !== null) amounts.push(input.bundle_price);
  if (amounts.some(value => !decimalPattern.test(value))) return 'Lengkapi semua nominal, maksimal empat angka desimal.';
  if (!Number.isInteger(input.max_reward_per_transaction) || input.max_reward_per_transaction < 1 || input.max_reward_per_transaction > 10000) return 'Batas hadiah atau paket harus antara 1 dan 10.000.';
  if (input.promo_type === 'SPECIAL_PRICE' && !positiveDecimal(input.min_purchase_amount)) return 'Isi minimum belanja untuk promo tebus murah.';
  return '';
}

export function toLocalDateTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const part = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}T${part(date.getHours())}:${part(date.getMinutes())}`;
}

export function fromLocalDateTime(value: string): string | null {
  return value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toISOString() : null;
}

export function basketFromTriggers(items: PromotionItemInput[]): BasketItem[] {
  return items.filter(item => item.item_role === 'TRIGGER' && item.variant_id).map(item => ({ variant_id: item.variant_id!, quantity: item.required_quantity }));
}

export function promotionError(error: unknown): string {
  const response = (error as { response?: { data?: { message?: unknown } } } | null)?.response?.data?.message;
  return typeof response === 'string' ? response : error instanceof Error ? error.message : 'Operasi promosi gagal. Silakan coba lagi.';
}

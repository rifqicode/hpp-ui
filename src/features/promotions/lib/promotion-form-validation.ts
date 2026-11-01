import type { PromotionInput } from '../types';
import { decimalPattern, positiveDecimal } from './promotion-form';

export function validatePromotionRules(input: PromotionInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const triggers = input.items.filter(item => item.item_role === 'TRIGGER');
  const rewards = input.items.filter(item => item.item_role === 'REWARD');
  if (!input.name.trim()) errors.name = 'Nama promosi wajib diisi.';
  if (input.promo_type === 'BUNDLE') {
    if (triggers.length < 2) errors.items = 'Paket hemat membutuhkan minimal 2 persyaratan.';
    if (input.bundle_price === null || !positiveDecimal(input.bundle_price))
      errors.bundle_price = 'Harga satu paket harus berupa nominal positif.';
  } else if (input.promo_type === 'BUY_X_GET_Y') {
    if (!triggers.length || !rewards.length)
      errors.items = 'Pilih setidaknya satu menu persyaratan dan satu menu bonus.';
  } else if (input.promo_type === 'SPECIAL_PRICE') {
    if (!rewards.length) errors.items = 'Pilih setidaknya satu menu tebus murah.';
    if (!positiveDecimal(input.min_purchase_amount))
      errors.min_purchase_amount = 'Isi minimum belanja untuk promo tebus murah.';
  } else {
    if (input.scope === 'ITEM' && !triggers.length)
      errors.items = 'Pilih setidaknya satu menu untuk diskon menu tertentu.';
    if (
      !positiveDecimal(input.discount_value) ||
      (input.discount_type === 'PERCENTAGE' && Number(input.discount_value) > 100)
    )
      errors.discount_value = 'Isi diskon positif, maksimal 100 untuk persentase.';
    if (!decimalPattern.test(input.max_discount_amount))
      errors.max_discount_amount = 'Maksimum diskon tidak valid.';
  }
  input.items.forEach((item, index) => {
    if (!item.variant_id && !item.product_id && !item.category_id)
      errors[`item-select-${index}`] = `Pilih menu untuk persyaratan atau bonus ${index + 1}.`;
    if (!positiveDecimal(item.required_quantity))
      errors[`item-qty-${index}`] = 'Jumlah menu harus positif.';
    if (
      item.item_role === 'REWARD' &&
      input.promo_type === 'SPECIAL_PRICE' &&
      !decimalPattern.test(item.reward_price)
    )
      errors[`item-price-${index}`] = 'Harga tebus tidak valid.';
  });
  if (!decimalPattern.test(input.min_purchase_amount))
    errors.min_purchase_amount = 'Minimum belanja tidak valid.';
  return errors;
}

export function validatePromotionLimits(input: PromotionInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.applicable_channels.length) errors.channels = 'Pilih setidaknya satu kanal penjualan.';
  if (!decimalPattern.test(input.promo_budget))
    errors.promo_budget = 'Batas anggaran harus berupa nominal valid.';
  if (
    input.promo_type !== 'DIRECT_DISCOUNT' &&
    (!Number.isInteger(input.max_reward_per_transaction) ||
      input.max_reward_per_transaction < 1 ||
      input.max_reward_per_transaction > 10000)
  )
    errors.max_reward = 'Batas hadiah atau paket harus antara 1 dan 10.000.';
  if (
    (input.start_at && Number.isNaN(Date.parse(input.start_at))) ||
    (input.end_at && Number.isNaN(Date.parse(input.end_at)))
  )
    errors.schedule = 'Periksa tanggal dan jam promosi.';
  else if (input.start_at && input.end_at && new Date(input.start_at) >= new Date(input.end_at))
    errors.schedule = 'Waktu berakhir harus setelah waktu mulai.';
  return errors;
}

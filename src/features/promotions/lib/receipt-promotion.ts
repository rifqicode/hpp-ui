import type { SaleItem } from '@/features/sales/types';

function scaledMoney(value: string | number): bigint {
  const raw = typeof value === 'number' ? value.toFixed(4) : value;
  if (!/^\d+(?:\.\d{1,4})?$/.test(raw)) return -1n;
  const [whole, fraction = ''] = raw.split('.');
  return BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, '0'));
}

export function isFreeReward(price: string | number, modifiers: { price: string | number }[]): boolean {
  const total = scaledMoney(price);
  const addonPrices = modifiers.map(modifier => scaledMoney(modifier.price));
  return total >= 0n && addonPrices.every(value => value >= 0n) && total === addonPrices.reduce((sum, value) => sum + value, 0n);
}

export function rewardBadge(item: SaleItem): string {
  if (!item.isRewardItem) return '';
  return (item.isFreeReward ?? isFreeReward(item.priceAtSale, item.modifiers)) ? '[GRATIS]' : '[TEBUS MURAH]';
}

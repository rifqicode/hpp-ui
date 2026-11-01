import type { PaymentMethod } from '../types';

export function calculatePOSPayment(total: number, method: PaymentMethod) {
  const totalUnits = Math.round(total * 10000);
  const payableUnits = method === 'CASH' ? Math.round(totalUnits / 1000000) * 1000000 : totalUnits;

  return {
    payableTotal: payableUnits / 10000,
    cashRoundingAdjustment: (payableUnits - totalUnits) / 10000,
  };
}

export function getQuickCashAmounts(payableTotal: number): number[] {
  if (payableTotal <= 0) return [10000, 50000, 100000];
  const candidates = new Set<number>();
  for (const step of [10000, 20000, 50000, 100000]) {
    candidates.add(Math.ceil(payableTotal / step) * step);
  }
  for (const amount of [20000, 50000, 100000, 200000, 300000, 500000, 1000000]) {
    candidates.add(amount);
  }
  candidates.add(Math.ceil((payableTotal + 50000) / 100000) * 100000);
  candidates.add(Math.ceil(payableTotal / 500000) * 500000);

  return [...candidates]
    .filter(amount => amount > payableTotal)
    .sort((a, b) => a - b)
    .slice(0, 3);
}

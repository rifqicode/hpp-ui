function scaledDecimal(value: string, precision: number): bigint | null {
  const match = /^(\d+)(?:\.(\d*))?$/.exec(value);
  if (!match || (match[2]?.length ?? 0) > precision) return null;
  return BigInt(match[1] + (match[2] ?? '').padEnd(precision, '0'));
}

export function materialUnitCost(totalPrice: string, quantity: string): string | null {
  const price = scaledDecimal(totalPrice, 4);
  const amount = scaledDecimal(quantity, 6);
  if (price === null || amount === null || price <= 0n || amount <= 0n) return null;
  // Match the server's four-decimal, half-up reference cost without binary rounding.
  const numerator = price * 1_000_000n;
  const rounded = numerator / amount + (numerator % amount * 2n >= amount ? 1n : 0n);
  const fraction = (rounded % 10_000n).toString().padStart(4, '0').replace(/0+$/, '');
  return `${rounded / 10_000n}${fraction ? `.${fraction}` : ''}`;
}

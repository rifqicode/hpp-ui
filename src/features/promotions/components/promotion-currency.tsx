import { CurrencyText, type CurrencyTextProps } from '@/components/ui/currency-text';

export function PromotionCurrencyText({ value, ...props }: CurrencyTextProps) {
  const fractional = /\.\d*[1-9]/.test(String(value ?? ''));
  return <CurrencyText {...props} value={value} allowDecimal={fractional} decimalDigits={4} />;
}

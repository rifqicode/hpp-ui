import * as React from 'react';
import { Info, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatIntegerDigits } from '@/lib/number-format';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export type CurrencyPreset = 'summary' | 'detail' | 'unitRate' | 'full';

export interface FormatCurrencyOptions {
  /**
   * High-level display preset:
   * - "summary": 0 decimal digits, nearest half-away-from-zero rounding. Small non-zero values display `<Rp 1`.
   * - "detail": max 2 decimal digits, trim trailing zeros. Small non-zero values display `<Rp 0,01`.
   * - "unitRate": max 4 decimal digits, trim trailing zeros. Small non-zero values display `<Rp 0,0001`.
   * - "full": full precision from API without rounding.
   *
   * Defaults to "summary" if neither allowDecimal nor decimalDigits is specified.
   */
  preset?: CurrencyPreset;

  /**
   * Currency prefix prepended before the numeric amount.
   * Defaults to `"Rp "`. Can be set to `""` for pure delimiter formatting.
   */
  prefix?: string;

  /**
   * Currency suffix appended after the numeric amount, e.g. `"/kg"`, `",-"`.
   * Defaults to `""`.
   */
  suffix?: string;

  /**
   * Whether decimal fractions are enabled.
   * Legacy option. If preset is provided, preset governs decimal behavior.
   */
  allowDecimal?: boolean;

  /**
   * Number of decimal digits to display.
   * Legacy option.
   */
  decimalDigits?: number;

  /**
   * Maximum decimal digits to display.
   */
  maxDecimalDigits?: number;

  /**
   * Whether to trim trailing zeros in the decimal portion.
   */
  trimTrailingZeros?: boolean;

  /**
   * Prepend a "+" sign before positive values greater than 0 (e.g. `"+Rp 5.000"`).
   * Defaults to `false`.
   */
  showPositiveSign?: boolean;

  /**
   * Thousand separator symbol. Defaults to `"."`.
   */
  thousandSeparator?: string;

  /**
   * Decimal separator symbol. Defaults to `","`.
   */
  decimalSeparator?: string;

  /**
   * Fallback text when value is null, undefined, NaN, or empty string.
   * Defaults to `"-"`. Note that `0` is formatted as `"Rp 0"`.
   */
  emptyDisplay?: string;
}

export interface CurrencyTextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'children'>, FormatCurrencyOptions {
  /**
   * Numeric or string currency value.
   * Safely handles numbers, numeric strings, empty strings, null, undefined, and NaN.
   */
  value: number | string | null | undefined;

  /**
   * HTML semantic element tag or component to render.
   * Defaults to `"span"`.
   */
  as?: React.ElementType;

  /**
   * Whether to display an interactive action to view the raw full value from server.
   * Provides an accessible dialog with raw value display and copy button.
   */
  showFullValueAction?: boolean;

  /**
   * Optional unit label shown in the full value dialog (e.g. "/ porsi", "/ kg").
   */
  rawUnit?: string;
}

interface ParsedNumeric {
  isValid: boolean;
  isNegative: boolean;
  numVal: number;
  integerDigits: string;
  decimalDigits: string;
  rawString: string;
}

/**
 * Safely parses an input value into numeric information.
 * Correctly distinguishes between raw API decimal strings (where "." is a decimal point)
 * and formatted localized currency strings.
 */
export function parseNumericValue(value: number | string | null | undefined): ParsedNumeric {
  if (value === null || value === undefined) {
    return {
      isValid: false,
      isNegative: false,
      numVal: 0,
      integerDigits: '',
      decimalDigits: '',
      rawString: '',
    };
  }

  if (typeof value === 'number') {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      return {
        isValid: false,
        isNegative: false,
        numVal: 0,
        integerDigits: '',
        decimalDigits: '',
        rawString: '',
      };
    }
    const isNeg = value < 0;
    const str = String(value);
    const [intP, decP = ''] = (isNeg ? str.slice(1) : str).split('.');
    return {
      isValid: true,
      isNegative: isNeg,
      numVal: value,
      integerDigits: intP,
      decimalDigits: decP,
      rawString: str,
    };
  }

  if (typeof value !== 'string') {
    return {
      isValid: false,
      isNegative: false,
      numVal: 0,
      integerDigits: '',
      decimalDigits: '',
      rawString: '',
    };
  }

  const trimmed = value.trim();
  if (
    !trimmed ||
    trimmed.toLowerCase() === 'nan' ||
    trimmed.toLowerCase() === 'null' ||
    trimmed.toLowerCase() === 'undefined'
  ) {
    return {
      isValid: false,
      isNegative: false,
      numVal: 0,
      integerDigits: '',
      decimalDigits: '',
      rawString: '',
    };
  }

  let work = trimmed;
  let isNegative = false;

  if (work.startsWith('-')) {
    isNegative = true;
    work = work.slice(1).trim();
  } else if (work.startsWith('+')) {
    work = work.slice(1).trim();
  }

  // Detect currency prefix (Rp, IDR, rp.)
  const prefixMatch = work.match(/^(rp\.?|idr)\s*/i);
  const hadCurrencyPrefix = Boolean(prefixMatch);
  if (prefixMatch) {
    work = work.slice(prefixMatch[0].length).trim();
    if (work.startsWith('-')) {
      isNegative = true;
      work = work.slice(1).trim();
    } else if (work.startsWith('+')) {
      work = work.slice(1).trim();
    }
  }

  if (!work || !/\d/.test(work) || /[^\d.,]/.test(work)) {
    return {
      isValid: false,
      isNegative: false,
      numVal: 0,
      integerDigits: '',
      decimalDigits: '',
      rawString: '',
    };
  }

  const lastDot = work.lastIndexOf('.');
  const lastComma = work.lastIndexOf(',');

  let integerDigits = '';
  let decimalDigits = '';

  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) {
      // 150.000,50 -> dot is thousand separator, comma is decimal
      integerDigits = work.slice(0, lastComma).replace(/\D/g, '');
      decimalDigits = work.slice(lastComma + 1).replace(/\D/g, '');
    } else {
      // 150,000.50 -> comma is thousand separator, dot is decimal
      integerDigits = work.slice(0, lastDot).replace(/\D/g, '');
      decimalDigits = work.slice(lastDot + 1).replace(/\D/g, '');
    }
  } else if (lastComma !== -1) {
    // Only comma: localized decimal separator
    integerDigits = work.slice(0, lastComma).replace(/\D/g, '');
    decimalDigits = work.slice(lastComma + 1).replace(/\D/g, '');
  } else if (lastDot !== -1) {
    const dotsCount = work.split('.').length - 1;
    if (dotsCount > 1) {
      // Multiple dots: thousand separators (e.g. 1.000.000)
      integerDigits = work.replace(/\D/g, '');
    } else {
      // Single dot: if it had a currency prefix and looks like 15.000, treat dot as thousand separator
      const [left, right = ''] = work.split('.');
      if (hadCurrencyPrefix && right.length === 3 && left.length <= 3) {
        integerDigits = work.replace(/\D/g, '');
      } else {
        // Standard API numeric string: e.g. "1.234", "15000.5", "0.1256"
        integerDigits = left.replace(/\D/g, '');
        decimalDigits = right.replace(/\D/g, '');
      }
    }
  } else {
    integerDigits = work.replace(/\D/g, '');
  }

  let finalRaw = (isNegative ? '-' : '') + (integerDigits || '0');
  if (decimalDigits) {
    finalRaw += '.' + decimalDigits;
  }

  const num = Number(finalRaw);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return {
      isValid: false,
      isNegative: false,
      numVal: 0,
      integerDigits: '',
      decimalDigits: '',
      rawString: '',
    };
  }

  return {
    isValid: true,
    isNegative: num < 0,
    numVal: num,
    integerDigits,
    decimalDigits,
    rawString: finalRaw,
  };
}

/**
 * Rounds a number half-away-from-zero symmetrically for positive and negative values.
 * Overcomes IEEE-754 floating-point drift (e.g. 1.005.toFixed(2) === "1.00").
 */
export function roundHalfAwayFromZero(num: number, decimals: number): number {
  const sign = num < 0 ? -1 : 1;
  const abs = Math.abs(num);
  const rounded = Number(Math.round(Number(abs + 'e' + decimals)) + 'e-' + decimals);
  return sign * rounded;
}

/**
 * Pure utility function to format numbers or numeric strings into Indonesian currency format.
 *
 * @example
 * formatCurrency(150000) // "Rp 150.000"
 * formatCurrency(-15000) // "-Rp 15.000"
 * formatCurrency(3333.3333, { preset: "detail" }) // "Rp 3.333,33"
 * formatCurrency(0.1256, { preset: "unitRate", suffix: " / g" }) // "Rp 0,1256 / g"
 * formatCurrency("1.234", { preset: "detail" }) // "Rp 1,23"
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options?: FormatCurrencyOptions,
): string {
  const prefix = options?.prefix ?? 'Rp ';
  const suffix = options?.suffix ?? '';
  const showPositiveSign = options?.showPositiveSign ?? false;
  const thousandSeparator = options?.thousandSeparator ?? '.';
  const decimalSeparator = options?.decimalSeparator ?? ',';
  const emptyDisplay = options?.emptyDisplay ?? '-';

  const preset = options?.preset;
  let allowDecimal = false;
  let decimalDigits = 0;
  let maxDecimalDigits = 0;
  let trimTrailingZeros = false;
  let isFull = false;
  let threshold = 0;
  let thresholdStr = '';

  if (preset === 'summary') {
    allowDecimal = false;
    decimalDigits = 0;
    maxDecimalDigits = 0;
    trimTrailingZeros = false;
    threshold = 0.5;
    thresholdStr = '1';
  } else if (preset === 'detail') {
    allowDecimal = true;
    decimalDigits = 2;
    maxDecimalDigits = 2;
    trimTrailingZeros = true;
    threshold = 0.005;
    thresholdStr = `0${decimalSeparator}01`;
  } else if (preset === 'unitRate') {
    allowDecimal = true;
    decimalDigits = 4;
    maxDecimalDigits = 4;
    trimTrailingZeros = true;
    threshold = 0.00005;
    thresholdStr = `0${decimalSeparator}0001`;
  } else if (preset === 'full') {
    allowDecimal = true;
    isFull = true;
  } else if (options?.allowDecimal !== undefined || options?.decimalDigits !== undefined) {
    allowDecimal =
      options?.allowDecimal ?? (options?.decimalDigits !== undefined && options.decimalDigits > 0);
    decimalDigits = options?.decimalDigits ?? (allowDecimal ? 2 : 0);
    maxDecimalDigits = options?.maxDecimalDigits ?? decimalDigits;
    trimTrailingZeros = options?.trimTrailingZeros ?? false;
  } else {
    // Default to summary
    allowDecimal = false;
    decimalDigits = 0;
    maxDecimalDigits = 0;
    trimTrailingZeros = false;
    threshold = 0.5;
    thresholdStr = '1';
  }

  const parsed = parseNumericValue(value);
  if (!parsed.isValid) {
    return emptyDisplay;
  }

  const absVal = Math.abs(parsed.numVal);
  const isZero = absVal === 0 || Object.is(parsed.numVal, -0);

  if (isZero) {
    return `${prefix}0${suffix}`;
  }

  // Handle non-zero numbers that would otherwise round down to zero
  if (threshold > 0 && absVal < threshold) {
    if (parsed.isNegative) {
      return `-(<${prefix}${thresholdStr}${suffix})`;
    }
    const sign = showPositiveSign ? '+' : '';
    return `${sign}<${prefix}${thresholdStr}${suffix}`;
  }

  let formattedNumber = '';
  if (isFull) {
    const [intStr, decStr = ''] = (
      parsed.isNegative ? parsed.rawString.slice(1) : parsed.rawString
    ).split('.');
    const formattedInt = formatIntegerDigits(intStr || '0', thousandSeparator);
    formattedNumber = decStr ? `${formattedInt}${decimalSeparator}${decStr}` : formattedInt;
  } else if (!allowDecimal || maxDecimalDigits === 0) {
    const rounded = Math.abs(roundHalfAwayFromZero(parsed.numVal, 0));
    formattedNumber = formatIntegerDigits(String(rounded), thousandSeparator);
  } else {
    const roundedAbs = Math.abs(roundHalfAwayFromZero(parsed.numVal, maxDecimalDigits));
    let fixed = roundedAbs.toFixed(maxDecimalDigits);
    if (trimTrailingZeros && fixed.includes('.')) {
      fixed = fixed.replace(/\.?0+$/, '');
    }
    const [intPart, decPart = ''] = fixed.split('.');
    const formattedInt = formatIntegerDigits(intPart, thousandSeparator);
    formattedNumber = decPart ? `${formattedInt}${decimalSeparator}${decPart}` : formattedInt;
  }

  const isFormatZero =
    formattedNumber === '0' ||
    formattedNumber === '0' + decimalSeparator + '0'.repeat(decimalDigits);

  let sign = '';
  if (parsed.isNegative && !isFormatZero) {
    sign = '-';
  } else if (showPositiveSign && parsed.numVal > 0) {
    sign = '+';
  }

  return `${sign}${prefix}${formattedNumber}${suffix}`;
}

/**
 * Convenience helper to format standard Indonesian Rupiah with zero decimals.
 */
export const formatIDR = (value: number | string | null | undefined): string => {
  return formatCurrency(typeof value === 'number' ? Math.round(value) : value, {
    preset: 'summary',
  });
};

/**
 * Presentational text/label display component for formatted currency.
 * Supports presets (`summary`, `detail`, `unitRate`, `full`) and accessible full-value popover.
 *
 * @example
 * <CurrencyText value={150000} /> // renders <span>Rp 150.000</span>
 * <CurrencyText value={3333.3333} preset="detail" showFullValueAction />
 */
export const CurrencyText = React.forwardRef<HTMLElement, CurrencyTextProps>(
  (
    {
      value,
      preset,
      prefix = 'Rp ',
      suffix = '',
      allowDecimal = false,
      decimalDigits,
      maxDecimalDigits,
      trimTrailingZeros,
      showPositiveSign = false,
      thousandSeparator = '.',
      decimalSeparator = ',',
      emptyDisplay = '-',
      showFullValueAction = false,
      rawUnit,
      className,
      as: Component = 'span',
      ...props
    },
    ref,
  ) => {
    const [copied, setCopied] = React.useState(false);

    const parsed = React.useMemo(() => parseNumericValue(value), [value]);

    const formatted = React.useMemo(() => {
      return formatCurrency(value, {
        preset,
        prefix,
        suffix,
        allowDecimal,
        decimalDigits,
        maxDecimalDigits,
        trimTrailingZeros,
        showPositiveSign,
        thousandSeparator,
        decimalSeparator,
        emptyDisplay,
      });
    }, [
      value,
      preset,
      prefix,
      suffix,
      allowDecimal,
      decimalDigits,
      maxDecimalDigits,
      trimTrailingZeros,
      showPositiveSign,
      thousandSeparator,
      decimalSeparator,
      emptyDisplay,
    ]);

    const handleCopyRaw = React.useCallback(async () => {
      if (!parsed.isValid) return;
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(parsed.rawString);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback or ignore clipboard errors
      }
    }, [parsed]);

    if (!showFullValueAction || !parsed.isValid) {
      return (
        <Component ref={ref as React.Ref<any>} className={cn(className)} {...props}>
          {formatted}
        </Component>
      );
    }

    const fullFormatted = formatCurrency(value, {
      preset: 'full',
      prefix,
      suffix: rawUnit ? ` ${rawUnit}` : suffix,
      thousandSeparator,
      decimalSeparator,
    });

    return (
      <span className="inline-flex items-center gap-1">
        <Component ref={ref as React.Ref<any>} className={cn(className)} {...props}>
          {formatted}
        </Component>
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Lihat nilai asli dari server"
              title="Lihat nilai asli dari server"
              className="inline-flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Info className="size-3.5" aria-hidden="true" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nilai Asli dari Server</DialogTitle>
              <DialogDescription>
                Nilai asli dari server sebelum pembulatan tampilan.
              </DialogDescription>
            </DialogHeader>
            <div className="my-2 space-y-3 rounded-lg border bg-muted/40 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Format Lengkap</p>
                <p className="mt-1 text-base font-semibold tabular-nums sm:text-lg">
                  {fullFormatted}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nilai Raw Numerik</p>
                <code className="mt-1 block rounded bg-background p-2 font-mono text-sm tabular-nums">
                  {parsed.rawString}
                </code>
              </div>
            </div>
            <DialogFooter className="flex-row justify-end gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyRaw}
                className="gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="size-4 text-emerald-600" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    <span>Salin Nilai Asli</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </span>
    );
  },
);

CurrencyText.displayName = 'CurrencyText';

/** Alias for CurrencyText */
export const CurrencyLabel = CurrencyText;

/** Alias for CurrencyText */
export const FormattedCurrency = CurrencyText;

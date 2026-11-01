import { cn } from '@/lib/utils';
import { decimalPattern } from '../lib/promotion-form';
import type { PromotionInput } from '../types';
import { PromotionCurrencyText } from './promotion-currency';

function Money({ value, zero }: { value: string | null; zero?: string }) {
  if (value === null || !decimalPattern.test(value)) return <>Belum diisi</>;
  if (zero && Number(value) === 0) return <>{zero}</>;
  return <PromotionCurrencyText value={value} />;
}

function Rule({ input }: { input: PromotionInput }) {
  switch (input.promo_type) {
    case 'DIRECT_DISCOUNT':
      return (
        <>
          Potongan{' '}
          {input.discount_type === 'PERCENTAGE' ? (
            decimalPattern.test(input.discount_value) ? (
              `${input.discount_value}%`
            ) : (
              'belum diisi'
            )
          ) : (
            <Money value={input.discount_value} />
          )}{' '}
          untuk {input.scope === 'BILL' ? 'seluruh tagihan' : 'menu tertentu'}.
        </>
      );
    case 'BUY_X_GET_Y':
      return <>Beli menu persyaratan, dapatkan bonus gratis.</>;
    case 'BUNDLE':
      return (
        <>
          Paket hemat seharga <Money value={input.bundle_price} />.
        </>
      );
    case 'SPECIAL_PRICE':
      return (
        <>
          Belanja minimal <Money value={input.min_purchase_amount} />, lalu tebus menu dengan harga
          khusus.
        </>
      );
  }
}

function dateLabel(value: string | null, fallback: string) {
  if (!value || Number.isNaN(Date.parse(value))) return fallback;
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export function PromotionFormSummary({
  input,
  names,
  className,
}: {
  input: PromotionInput;
  names: Map<string, string>;
  className?: string;
}) {
  return (
    <section
      aria-label="Ringkasan aturan promo"
      className={cn('min-w-0 space-y-5 rounded-xl border bg-card p-4 sm:p-5', className)}
    >
      <div>
        <h2 className="font-semibold">Ringkasan promo</h2>
        <p className="mt-3 break-words text-lg font-semibold">
          {input.name.trim() || 'Nama promo belum diisi'}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          <Rule input={input} />
        </p>
      </div>
      {input.items.length > 0 && (
        <ul className="space-y-2 border-t pt-4 text-sm">
          {input.items.map((item, index) => (
            <li key={index} className="break-words">
              <span className="text-muted-foreground">
                {item.item_role === 'REWARD'
                  ? 'Bonus'
                  : input.promo_type === 'DIRECT_DISCOUNT'
                    ? 'Menu'
                    : 'Syarat'}
                :{' '}
              </span>
              {names.get(item.variant_id || item.product_id || item.category_id || '') ||
                'Menu belum dipilih'}
              {input.promo_type !== 'DIRECT_DISCOUNT' && ` × ${item.required_quantity || '?'}`}
              {item.item_role === 'REWARD' && input.promo_type === 'SPECIAL_PRICE' && (
                <>
                  {' '}
                  · <Money value={item.reward_price} />
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <dl className="space-y-3 border-t pt-4 text-sm">
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-muted-foreground">Minimum belanja</dt>
          <dd>
            <Money value={input.min_purchase_amount} zero="Tanpa minimum" />
          </dd>
        </div>
        {input.promo_type === 'DIRECT_DISCOUNT' && (
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Maksimum potongan</dt>
            <dd>
              <Money value={input.max_discount_amount} zero="Tanpa batas" />
            </dd>
          </div>
        )}
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-muted-foreground">Anggaran</dt>
          <dd>
            <Money value={input.promo_budget} zero="Tanpa batas" />
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-muted-foreground">Kanal</dt>
          <dd>
            {input.applicable_channels
              .map(channel => (channel === 'POS' ? 'Kasir POS' : 'Online'))
              .join(', ') || 'Belum dipilih'}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">Periode (waktu lokal)</dt>
          <dd className="text-sm">
            {dateLabel(input.start_at, 'Tanpa tanggal mulai')}
            <br />
            {input.end_at
              ? `Hingga ${dateLabel(input.end_at, 'tanggal belum valid')}`
              : 'Tanpa tanggal akhir'}
          </dd>
        </div>
      </dl>
    </section>
  );
}

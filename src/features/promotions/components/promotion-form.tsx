import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Boxes, Check, Plus, Search, Soup } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TablePagination } from '@/components/ui/table-pagination';
import { cn } from '@/lib/utils';
import {
  Field,
  TextField,
  NumberField,
  CheckField,
  PromotionFormPanel,
  selectClass,
} from './promotion-fields';
import { PromotionSimulator } from './promotion-simulator';
import {
  basketFromTriggers,
  changePromotionType,
  decimalPattern,
  fromLocalDateTime,
  newPromotionItem,
  positiveDecimal,
  promotionError,
  promotionTypes,
  toLocalDateTime,
} from '../lib/promotion-form';
import type {
  Promotion,
  PromotionInput,
  PromotionItemInput,
  PromotionOption,
  PromotionSimulation,
} from '../types';

export interface PromotionFormProps {
  input: PromotionInput;
  onChange: (input: PromotionInput) => void;
  options: PromotionOption[];
  optionsQuery?: {
    isPending: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => void;
    data?: { data: PromotionOption[]; total: number };
    isFetching?: boolean;
  };
  optionSearch?: string;
  onOptionSearchChange?: (value: string) => void;
  optionPage?: number;
  onOptionPageChange?: (page: number) => void;
  names: Map<string, string>;
  disabled: boolean;
  readOnly?: boolean;
  canWrite?: boolean;
  busy?: boolean;
  onCancel?: () => void;
  onSave?: () => Promise<void> | void;
  simulation?: PromotionSimulation | null;
  simulationLoading?: boolean;
  simulationError?: string;
  readiness?: string;
  retrySimulation?: () => void;
  existingPromotion?: Promotion | null;
  initialStep?: number;
}

export function CatalogSelect({
  label,
  value,
  options,
  onChange,
  names,
  error,
}: {
  label: string;
  value: string;
  options: { id: string; name: string }[];
  onChange: (value: string) => void;
  names: Map<string, string>;
  error?: string;
}) {
  return (
    <Field label={label} error={error}>
      {(id) => (
        <select
          id={id}
          className={selectClass}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Pilih item</option>
          {value && !options.some((option) => option.id === value) && (
            <option value={value}>
              {names.get(value) || 'Pilihan tersimpan (cari untuk mengganti)'}
            </option>
          )}
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function PromotionConditions({
  input,
  onChange,
  options,
  names,
  disabled,
  errors = {},
}: {
  input: PromotionInput;
  onChange: (input: PromotionInput) => void;
  options: PromotionOption[];
  names: Map<string, string>;
  disabled: boolean;
  errors?: Record<string, string>;
}) {
  const setItem = (index: number, patch: Partial<PromotionItemInput>) =>
    onChange({
      ...input,
      items: input.items.map((item, position) =>
        position === index ? { ...item, ...patch } : item
      ),
    });

  const distinct = (kind: 'product' | 'category') => [
    ...new Map(
      options
        .filter(
          (option) =>
            option[`${kind}_id`] &&
            option[`${kind}_id`] !== '00000000-0000-0000-0000-000000000000'
        )
        .map((option) => [
          option[`${kind}_id`],
          { id: option[`${kind}_id`], name: option[`${kind}_name`] || 'Tanpa kategori' },
        ])
    ).values(),
  ];

  const wantsTriggers =
    input.promo_type === 'BUNDLE' ||
    input.promo_type === 'BUY_X_GET_Y' ||
    (input.scope === 'ITEM' && input.promo_type === 'DIRECT_DISCOUNT');
  const wantsRewards =
    input.promo_type === 'BUY_X_GET_Y' || input.promo_type === 'SPECIAL_PRICE';
  const wantsItems = wantsTriggers || wantsRewards;

  return (
    <>
      {wantsItems && (
        <div className="space-y-4">
          {input.items.length === 0 && (
            <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-center text-xs text-muted-foreground">
              Belum ada menu persyaratan. Klik tombol <strong>+ Tambah Persyaratan</strong> di bawah untuk memilih menu.
            </div>
          )}
          {input.items.map((item, index) => {
            const kind =
              item.product_id !== null
                ? 'product'
                : item.category_id !== null
                ? 'category'
                : 'variant';
            const choices = kind === 'variant' ? options : distinct(kind);
            const value = item.variant_id || item.product_id || item.category_id || '';

            return (
              <fieldset
                key={index}
                className="min-w-0 rounded-xl border bg-muted/20 p-3.5 sm:p-4 space-y-3"
              >
                <legend className="px-1 text-sm font-semibold">
                  {item.item_role === 'TRIGGER' ? 'Persyaratan' : 'Menu Bonus / Hadiah'} {index + 1}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {item.item_role === 'TRIGGER' && (
                    <Field label={`Jenis pilihan ${index + 1}`}>
                      {(id) => (
                        <select
                          id={id}
                          className={selectClass}
                          value={kind}
                          onChange={(event) => {
                            const selector = event.target.value;
                            setItem(index, {
                              variant_id: selector === 'variant' ? '' : null,
                              product_id: selector === 'product' ? '' : null,
                              category_id: selector === 'category' ? '' : null,
                            });
                          }}
                        >
                          <option value="variant">Varian tertentu</option>
                          <option value="product">Semua varian produk</option>
                          <option value="category">Kategori produk</option>
                        </select>
                      )}
                    </Field>
                  )}
                  <CatalogSelect
                    label={`Pilihan ${item.item_role === 'TRIGGER' ? 'persyaratan' : 'menu bonus / hadiah'} ${index + 1}`}
                    value={value}
                    options={choices}
                    names={names}
                    error={errors[`item-select-${index}`]}
                    onChange={(selected) =>
                      setItem(index, {
                        variant_id: kind === 'variant' ? selected : null,
                        product_id: kind === 'product' ? selected : null,
                        category_id: kind === 'category' ? selected : null,
                      })
                    }
                  />
                  <NumberField
                    label={`Jumlah ${item.item_role === 'TRIGGER' ? 'persyaratan' : 'menu bonus / hadiah'} ${index + 1}`}
                    value={item.required_quantity}
                    error={errors[`item-qty-${index}`]}
                    onChange={(quantity) => setItem(index, { required_quantity: quantity })}
                  />
                  {item.item_role === 'REWARD' && input.promo_type === 'SPECIAL_PRICE' && (
                    <NumberField
                      label={`Harga tebus ${index + 1} (Rp)`}
                      value={item.reward_price}
                      error={errors[`item-price-${index}`]}
                      onChange={(price) => setItem(index, { reward_price: price })}
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 rounded-lg text-destructive hover:text-destructive"
                  disabled={disabled}
                  onClick={() =>
                    onChange({
                      ...input,
                      items: input.items.filter((_, position) => position !== index),
                    })
                  }
                >
                  Hapus {item.item_role === 'TRIGGER' ? 'persyaratan' : 'menu bonus / hadiah'} {index + 1}
                </Button>
              </fieldset>
            );
          })}
          <div className="flex flex-wrap gap-2">
            {wantsTriggers && (
              <Button
                type="button"
                variant="default"
                className="h-9 rounded-lg font-medium shadow-xs"
                disabled={disabled || input.items.length >= 100}
                onClick={() =>
                  onChange({ ...input, items: [...input.items, newPromotionItem()] })
                }
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Tambah Persyaratan
              </Button>
            )}
            {wantsRewards && (
              <Button
                type="button"
                variant="secondary"
                className="h-9 rounded-lg font-medium shadow-xs"
                disabled={disabled || input.items.length >= 100}
                onClick={() =>
                  onChange({
                    ...input,
                    items: [...input.items, newPromotionItem('REWARD')],
                  })
                }
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Tambah Menu Bonus / Hadiah
              </Button>
            )}
          </div>
          {errors['items'] && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {errors['items']}
            </p>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">
            Semua menu persyaratan harus terpenuhi. Menu bonus / hadiah tidak dihitung sebagai persyaratan atau minimum
            belanja. Topping tetap berbayar normal.
          </p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label="Minimum belanja (Rp)"
          hint="Harga dasar item berbayar; tidak termasuk hadiah, topping, pajak, dan ongkir."
          value={input.min_purchase_amount}
          error={errors['min_purchase_amount']}
          onChange={(value) => onChange({ ...input, min_purchase_amount: value })}
        />
        {input.promo_type === 'BUNDLE' && (
          <NumberField
            label="Harga satu paket (Rp)"
            value={input.bundle_price ?? ''}
            error={errors['bundle_price']}
            onChange={(value) => onChange({ ...input, bundle_price: value })}
          />
        )}
      </div>
    </>
  );
}

export function PromotionForm({
  input,
  onChange,
  options,
  optionsQuery,
  optionSearch = '',
  onOptionSearchChange,
  optionPage = 1,
  onOptionPageChange,
  names,
  disabled,
  readOnly = false,
  canWrite = true,
  busy = false,
  onCancel,
  onSave,
  simulation,
  simulationLoading = false,
  simulationError = '',
  readiness = '',
  retrySimulation,
  existingPromotion,
  initialStep = 0,
}: PromotionFormProps) {
  const [step, setStep] = useState(initialStep);
  const [visited, setVisited] = useState(initialStep);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const topRef = useRef<HTMLDivElement>(null);

  const steps = ['Aturan Promosi', 'Anggaran & Jadwal', 'Simulasi & Terbitkan'];

  function validateStep1(): { errors: Record<string, string>; message: string } | null {
    const errs: Record<string, string> = {};
    if (!input.name.trim()) {
      errs['name'] = 'Nama promosi wajib diisi.';
    }

    const triggerItems = input.items.filter((item) => item.item_role === 'TRIGGER');
    const rewardItems = input.items.filter((item) => item.item_role === 'REWARD');

    if (input.promo_type === 'BUNDLE') {
      if (triggerItems.length < 2) {
        errs['items'] = 'Paket kombo hemat membutuhkan minimal 2 persyaratan.';
      }
      if (input.bundle_price === null || !positiveDecimal(input.bundle_price)) {
        errs['bundle_price'] = 'Harga satu paket harus berupa nominal positif.';
      }
    } else if (input.promo_type === 'BUY_X_GET_Y') {
      if (triggerItems.length === 0) {
        errs['items'] = 'Promosi Beli X Gratis Y membutuhkan minimal 1 persyaratan.';
      }
      if (rewardItems.length === 0) {
        errs['items'] = 'Promosi Beli X Gratis Y membutuhkan minimal 1 menu bonus/hadiah.';
      }
    } else if (input.promo_type === 'SPECIAL_PRICE') {
      if (rewardItems.length === 0) {
        errs['items'] = 'Promosi Tebus Murah membutuhkan minimal 1 menu bonus/hadiah.';
      }
      if (!positiveDecimal(input.min_purchase_amount)) {
        errs['min_purchase_amount'] = 'Isi minimum belanja untuk promo tebus murah.';
      }
    } else if (input.promo_type === 'DIRECT_DISCOUNT') {
      if (input.scope === 'ITEM' && triggerItems.length === 0) {
        errs['items'] = 'Pilih setidaknya satu menu untuk diskon menu tertentu.';
      }
      if (!positiveDecimal(input.discount_value)) {
        errs['discount_value'] = 'Besar diskon harus berupa nominal positif.';
      } else if (input.discount_type === 'PERCENTAGE' && Number(input.discount_value) > 100) {
        errs['discount_value'] = 'Diskon persentase tidak boleh melebihi 100%.';
      }
      if (!decimalPattern.test(input.max_discount_amount)) {
        errs['max_discount_amount'] = 'Maksimum diskon tidak valid.';
      }
    }

    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i];
      if (!item.variant_id && !item.product_id && !item.category_id) {
        errs[`item-select-${i}`] = `Pilih menu untuk ${item.item_role === 'TRIGGER' ? 'persyaratan' : 'menu bonus/hadiah'} ${i + 1}.`;
      }
      if (!positiveDecimal(item.required_quantity)) {
        errs[`item-qty-${i}`] = `Jumlah ${item.item_role === 'TRIGGER' ? 'persyaratan' : 'menu bonus/hadiah'} ${i + 1} harus positif.`;
      }
      if (item.item_role === 'REWARD' && input.promo_type === 'SPECIAL_PRICE') {
        if (!decimalPattern.test(item.reward_price)) {
          errs[`item-price-${i}`] = `Harga tebus ${i + 1} tidak valid.`;
        }
      }
    }

    if (input.min_purchase_amount && !decimalPattern.test(input.min_purchase_amount)) {
      errs['min_purchase_amount'] = 'Minimum belanja tidak valid.';
    }

    const keys = Object.keys(errs);
    if (keys.length > 0) {
      return { errors: errs, message: errs[keys[0]] };
    }
    return null;
  }

  function validateStep2(): { errors: Record<string, string>; message: string } | null {
    const errs: Record<string, string> = {};
    if (!input.cost_basis) {
      errs['cost_basis'] = 'Pilih cara hitung modal resep (dasar HPP) untuk melanjutkan.';
    }
    if (!input.applicable_channels.length) {
      errs['channels'] = 'Pilih setidaknya satu kanal penjualan.';
    }
    if (!decimalPattern.test(input.promo_budget)) {
      errs['promo_budget'] = 'Batas anggaran promo harus berupa nominal valid.';
    }
    if (
      input.promo_type !== 'DIRECT_DISCOUNT' &&
      (!Number.isInteger(input.max_reward_per_transaction) ||
        input.max_reward_per_transaction < 1 ||
        input.max_reward_per_transaction > 10000)
    ) {
      errs['max_reward'] = 'Batas hadiah atau paket harus antara 1 dan 10.000.';
    }
    if (input.start_at && input.end_at && new Date(input.start_at) > new Date(input.end_at)) {
      errs['schedule'] = 'Waktu mulai tidak boleh melebihi waktu berakhir.';
    }

    const keys = Object.keys(errs);
    if (keys.length > 0) {
      return { errors: errs, message: errs[keys[0]] };
    }
    return null;
  }

  function validate(s: number) {
    if (s === 0) return validateStep1();
    if (s === 1) return validateStep2();
    return null;
  }

  function goTo(nextStep: number) {
    setError('');
    setErrors({});
    setStep(nextStep);
    topRef.current?.scrollIntoView?.({ block: 'start' });
  }

  function next() {
    if (readOnly) {
      goTo(step + 1);
      return;
    }
    const result = validate(step);
    if (result) {
      setError(result.message);
      setErrors(result.errors);
      return;
    }
    const target = step + 1;
    setVisited((v) => Math.max(v, target));
    goTo(target);
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (step < 2) {
      next();
      return;
    }
    if (!readOnly && canWrite && onSave) {
      void onSave();
    }
  }

  return (
    <div ref={topRef} className="w-full min-w-0 space-y-5 pb-8">
      {/* Top Stepper navigation matching product-builder pattern */}
      <ol aria-label="Tahapan promosi" className="flex flex-wrap gap-x-4 gap-y-2 border-b pb-4">
        {steps.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              aria-current={step === i ? 'step' : undefined}
              disabled={!readOnly && (busy || i > visited)}
              onClick={() => {
                if (!readOnly && i > step) {
                  for (let s = step; s < i; s++) {
                    const result = validate(s);
                    if (result) {
                      setError(result.message);
                      setErrors(result.errors);
                      return;
                    }
                  }
                }
                goTo(i);
              }}
              className={cn(
                'flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
                step === i ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs',
                  step === i && 'border-primary bg-primary text-primary-foreground'
                )}
              >
                {i < step ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>
              {label}
            </button>
          </li>
        ))}
      </ol>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-red-700 dark:text-red-300"
        >
          <p className="font-semibold">
            {Object.keys(errors).length ? 'Periksa isian sebelum melanjutkan' : 'Promosi belum tersimpan'}
          </p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      <form onSubmit={handleSave} noValidate className="space-y-5">
        <fieldset disabled={disabled} className="min-w-0 space-y-5">
          {/* STEP 1: Skema & Aturan Promosi */}
          {step === 0 && (
            <div className="space-y-5">
              {!readOnly && (
                <PromotionFormPanel
                  title="Pencarian Pilihan Produk & Varian"
                  description="Pilihan item pada formulir mengikuti hasil pencarian ini. Pilihan tersimpan tetap dipertahankan."
                >
                  <div className="space-y-3">
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        className="h-9 rounded-lg pl-9 pr-4"
                        type="search"
                        placeholder="Cari nama produk, varian, atau kategori..."
                        value={optionSearch}
                        disabled={busy}
                        onChange={(event) => onOptionSearchChange?.(event.target.value)}
                      />
                    </div>

                    {optionsQuery?.isPending ? (
                      <p role="status" className="text-sm text-muted-foreground">
                        Memuat pilihan varian…
                      </p>
                    ) : optionsQuery?.isError ? (
                      <div role="alert" className="space-y-2">
                        <p className="text-sm text-destructive">
                          {promotionError(optionsQuery.error)}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 rounded-lg"
                          onClick={() => void optionsQuery.refetch()}
                        >
                          Muat ulang pilihan
                        </Button>
                      </div>
                    ) : (
                      <>
                        {!options.length && (
                          <p className="text-sm text-muted-foreground">
                            Tidak ada varian aktif yang sesuai. Periksa pencarian atau aktifkan
                            produk pada katalog.
                          </p>
                        )}
                        {(optionsQuery?.data?.total || 0) > 50 && (
                          <TablePagination
                            total={optionsQuery!.data!.total}
                            displayedCount={options.length}
                            page={optionPage}
                            totalPages={Math.ceil((optionsQuery!.data!.total || 0) / 50)}
                            label="pilihan varian"
                            disabled={Boolean(optionsQuery?.isFetching) || busy}
                            onPrev={() => onOptionPageChange?.(optionPage - 1)}
                            onNext={() => onOptionPageChange?.(optionPage + 1)}
                          />
                        )}
                      </>
                    )}
                  </div>
                </PromotionFormPanel>
              )}

              <PromotionFormPanel
                title="Aturan Promosi"
                description="Tentukan nama, tipe promosi, persyaratan, dan nilai diskon."
              >
                <TextField
                  label="Nama promosi"
                  required
                  maxLength={255}
                  value={input.name}
                  error={errors['name']}
                  placeholder="Contoh: Diskon Jam Ngopi"
                  onChange={(event) => onChange({ ...input, name: event.target.value })}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-5">
                    Model Promosi <span className="text-red-700 dark:text-red-300" aria-hidden="true">*</span>
                  </label>
                  <div role="radiogroup" aria-label="Model Promosi" className="grid gap-3 sm:grid-cols-2">
                    {promotionTypes.map((kind) => {
                      const isSelected = input.promo_type === kind.value;
                      const getEmoji = (val: string) => {
                        switch (val) {
                          case 'DIRECT_DISCOUNT': return '🏷️';
                          case 'BUY_X_GET_Y': return '🎁';
                          case 'BUNDLE': return '🍽️';
                          case 'SPECIAL_PRICE': return '🪙';
                          default: return '🏷️';
                        }
                      };
                      return (
                        <label
                          key={kind.value}
                          className={cn(
                            'relative flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-all text-left select-none',
                            isSelected
                              ? 'border-2 border-primary bg-primary/5 text-primary shadow-xs'
                              : 'border-border/80 bg-card hover:border-primary/50 hover:bg-accent/30 text-foreground'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl" role="img" aria-hidden="true">
                                {getEmoji(kind.value)}
                              </span>
                              <span className={cn('text-sm font-semibold', isSelected ? 'text-primary' : 'text-foreground')}>
                                {kind.label}
                              </span>
                            </div>
                            <input
                              type="radio"
                              name="promo_type"
                              value={kind.value}
                              checked={isSelected}
                              disabled={disabled}
                              onChange={() =>
                                onChange(
                                  changePromotionType(
                                    input,
                                    kind.value as PromotionInput['promo_type']
                                  )
                                )
                              }
                              className="h-4 w-4 text-primary focus:ring-primary"
                              aria-label={kind.label}
                            />
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            {kind.description}
                          </p>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <TextField
                  label="Kode promosi"
                  optional
                  maxLength={50}
                  value={input.code || ''}
                  placeholder="Contoh: NGOPIHEMAT"
                  onChange={(event) =>
                    onChange({ ...input, code: event.target.value.toUpperCase() || null })
                  }
                />
                <TextField
                  label="Deskripsi promosi"
                  optional
                  maxLength={10000}
                  value={input.description}
                  placeholder="Keterangan singkat mengenai syarat & ketentuan promosi"
                  onChange={(event) => onChange({ ...input, description: event.target.value })}
                />
                {input.promo_type === 'DIRECT_DISCOUNT' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Lingkup diskon">
                      {(id) => (
                        <select
                          id={id}
                          className={selectClass}
                          value={input.scope}
                          onChange={(event) =>
                            onChange({
                              ...input,
                              scope: event.target.value as 'BILL' | 'ITEM',
                              items: event.target.value === 'ITEM' ? [newPromotionItem()] : [],
                            })
                          }
                        >
                          <option value="BILL">Seluruh tagihan</option>
                          <option value="ITEM">Item tertentu</option>
                        </select>
                      )}
                    </Field>
                    <Field label="Jenis diskon">
                      {(id) => (
                        <select
                          id={id}
                          className={selectClass}
                          value={input.discount_type}
                          onChange={(event) =>
                            onChange({
                              ...input,
                              discount_type: event.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT',
                            })
                          }
                        >
                          <option value="PERCENTAGE">Persentase (%)</option>
                          <option value="FIXED_AMOUNT">Nominal (Rp)</option>
                        </select>
                      )}
                    </Field>
                    <NumberField
                      label={
                        input.discount_type === 'PERCENTAGE'
                          ? 'Besar diskon (%)'
                          : 'Besar diskon (Rp)'
                      }
                      value={input.discount_value}
                      error={errors['discount_value']}
                      onChange={(value) => onChange({ ...input, discount_value: value })}
                    />
                    <NumberField
                      label="Maksimum diskon (Rp)"
                      hint="Isi 0 untuk tanpa batas potongan tambahan."
                      value={input.max_discount_amount}
                      error={errors['max_discount_amount']}
                      onChange={(value) => onChange({ ...input, max_discount_amount: value })}
                    />
                  </div>
                )}
                <PromotionConditions
                  input={input}
                  onChange={onChange}
                  options={options}
                  names={names}
                  disabled={disabled}
                  errors={errors}
                />
              </PromotionFormPanel>
            </div>
          )}

          {/* STEP 2: Anggaran & Jadwal */}
          {step === 1 && (
            <PromotionFormPanel
              title="Batas Anggaran & Jadwal"
              description="Pilih cara hitung modal resep, tentukan batas anggaran toko, dan masa berlaku promo."
            >
              <div className="space-y-2">
                <label className="text-sm font-medium leading-5">
                  Hitung Modal Resep Dari Mana? <span className="text-red-700 dark:text-red-300" aria-hidden="true">*</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Pilih metode perhitungan modal bahan agar kalkulator untung-rugi akurat.
                </p>
                {errors['cost_basis'] && (
                  <p role="alert" className="text-sm text-red-700 dark:text-red-300">
                    {errors['cost_basis']}
                  </p>
                )}
                <div role="radiogroup" aria-label="Hitung Modal Resep Dari Mana?" className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      value: 'LATEST_HPP',
                      label: 'Modal Masak/Produksi Terakhir',
                      description: 'Cocok untuk makanan/kue yang sudah dimasak & distok di etalase.',
                      icon: Boxes,
                    },
                    {
                      value: 'CURRENT_RECIPE',
                      label: 'Harga Bahan Baku Sekarang',
                      description: 'Cocok untuk minuman/makanan yang baru diracik saat dipesan.',
                      icon: Soup,
                    },
                  ].map((basis) => {
                    const isSelected = input.cost_basis === basis.value;
                    const Icon = basis.icon;
                    return (
                      <label
                        key={basis.value}
                        className={cn(
                          'relative flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-all text-left select-none',
                          isSelected
                            ? 'border-2 border-primary bg-primary/5 text-primary shadow-xs'
                            : 'border-border/80 bg-card hover:border-primary/50 hover:bg-accent/30 text-foreground'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-lg',
                                isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className={cn('text-sm font-semibold', isSelected ? 'text-primary' : 'text-foreground')}>
                              {basis.label}
                            </span>
                          </div>
                          <input
                            type="radio"
                            name="cost_basis"
                            value={basis.value}
                            checked={isSelected}
                            disabled={disabled}
                            onChange={() =>
                              onChange({
                                ...input,
                                cost_basis: basis.value as PromotionInput['cost_basis'],
                              })
                            }
                            className="h-4 w-4 text-primary focus:ring-primary"
                            aria-label={basis.label}
                          />
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {basis.description}
                        </p>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="Batas Anggaran Promo Toko (Rp)"
                  hint="Isi 0 untuk tanpa batas anggaran. Batas jumlah transaksi otomatis dihitung dari sini agar toko tidak boncos."
                  value={input.promo_budget}
                  error={errors['promo_budget']}
                  onChange={(value) => onChange({ ...input, promo_budget: value })}
                />
                <div className="rounded-xl border bg-muted/20 p-3.5 space-y-1 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Batas Jumlah Transaksi
                    </span>
                    <span className="font-semibold tabular-nums">
                      {/^0(?:\.0*)?$/.test(input.promo_budget)
                        ? 'Tanpa Batas Transaksi'
                        : simulation?.budget_analysis?.recommended_usage_limit
                        ? `${simulation.budget_analysis.recommended_usage_limit.toLocaleString('id-ID')} transaksi`
                        : existingPromotion?.usage_limit
                        ? `${existingPromotion.usage_limit.toLocaleString('id-ID')} transaksi`
                        : 'Dihitung saat simulasi'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {/^0(?:\.0*)?$/.test(input.promo_budget)
                      ? 'Promosi dapat digunakan tanpa batasan total transaksi selama masih aktif.'
                      : 'Otomatis dihitung dari anggaran agar promo tidak boncos melebihi modal.'}
                  </p>
                  {existingPromotion && existingPromotion.usage_limit > 0 && (
                    <p className="text-xs font-medium text-foreground pt-1 border-t">
                      Penggunaan saat ini: {existingPromotion.usage_count} / {existingPromotion.usage_limit} transaksi terpakai
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Mulai (waktu lokal)"
                  type="datetime-local"
                  value={toLocalDateTime(input.start_at)}
                  onChange={(event) =>
                    onChange({ ...input, start_at: fromLocalDateTime(event.target.value) })
                  }
                />
                <TextField
                  label="Berakhir (waktu lokal)"
                  type="datetime-local"
                  value={toLocalDateTime(input.end_at)}
                  error={errors['schedule']}
                  onChange={(event) =>
                    onChange({ ...input, end_at: fromLocalDateTime(event.target.value) })
                  }
                />
              </div>

              <fieldset className="space-y-3 rounded-xl border p-4">
                <legend className="px-1 text-sm font-semibold">Target & Kanal Penjualan</legend>
                <div>
                  <p className="text-sm font-medium mb-1">Kanal penjualan</p>
                  <div className="flex flex-wrap gap-x-6">
                    {(['POS', 'ONLINE'] as const).map((channel) => (
                      <CheckField
                        key={channel}
                        label={channel === 'POS' ? 'Kasir POS' : 'Online / Storefront'}
                        checked={input.applicable_channels.includes(channel)}
                        onChange={(event) =>
                          onChange({
                            ...input,
                            applicable_channels: event.target.checked
                              ? [...input.applicable_channels, channel]
                              : input.applicable_channels.filter((value) => value !== channel),
                          })
                        }
                      />
                    ))}
                  </div>
                  {errors['channels'] && (
                    <p role="alert" className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {errors['channels']}
                    </p>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <CheckField
                    label="Khusus pelanggan terdaftar"
                    checked={input.is_customer_required}
                    onChange={(event) =>
                      onChange({ ...input, is_customer_required: event.target.checked })
                    }
                  />
                  {input.promo_type !== 'DIRECT_DISCOUNT' &&
                    input.promo_type !== 'SPECIAL_PRICE' && (
                      <CheckField
                        label="Berlaku kelipatan sesuai jumlah pemicu"
                        checked={input.is_multiplier_allowed}
                        onChange={(event) =>
                          onChange({ ...input, is_multiplier_allowed: event.target.checked })
                        }
                      />
                    )}
                </div>

                {input.promo_type !== 'DIRECT_DISCOUNT' && (
                  <NumberField
                    label={
                      input.promo_type === 'BUNDLE'
                        ? 'Maksimum paket per transaksi'
                        : 'Maksimum unit hadiah per transaksi'
                    }
                    value={String(input.max_reward_per_transaction)}
                    integer
                    error={errors['max_reward']}
                    onChange={(value) =>
                      onChange({
                        ...input,
                        max_reward_per_transaction: value ? Number(value) : 0,
                      })
                    }
                  />
                )}

                <div className="pt-2 border-t">
                  <CheckField
                    label="Aktifkan promosi setelah disimpan"
                    checked={input.is_active}
                    onChange={(event) =>
                      onChange({ ...input, is_active: event.target.checked })
                    }
                  />
                </div>
              </fieldset>

              <p className="text-xs text-muted-foreground">
                Satu promosi per transaksi, tanpa gabungan diskon manual. Jadwal kosong berarti tanpa
                batas waktu.
              </p>
            </PromotionFormPanel>
          )}

          {/* STEP 3: Simulasi & Penerbitan */}
          {step === 2 && (
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,1fr)]">
              <div className="space-y-4">
                <PromotionFormPanel
                  title="Contoh Pesanan Pelanggan"
                  description="Isi contoh menu yang dibeli pelanggan untuk menguji untung-rugi."
                >
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Kalkulator menguji untung-rugi berdasarkan pesanan contoh ini. Jangan masukkan
                    menu bonus gratis sebagai pembelian.
                  </p>
                  {input.simulation_items.map((item, index) => (
                    <div
                      key={index}
                      className="grid items-end gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto]"
                    >
                      <CatalogSelect
                        label={`Varian simulasi ${index + 1}`}
                        value={item.variant_id}
                        options={options}
                        names={names}
                        onChange={(value) =>
                          onChange({
                            ...input,
                            simulation_items: input.simulation_items.map((row, position) =>
                              position === index ? { ...row, variant_id: value } : row
                            ),
                          })
                        }
                      />
                      <NumberField
                        label={`Jumlah ${index + 1}`}
                        value={item.quantity}
                        onChange={(value) =>
                          onChange({
                            ...input,
                            simulation_items: input.simulation_items.map((row, position) =>
                              position === index ? { ...row, quantity: value } : row
                            ),
                          })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-9 rounded-lg text-destructive hover:text-destructive"
                        disabled={disabled || input.simulation_items.length <= 1}
                        onClick={() =>
                          onChange({
                            ...input,
                            simulation_items: input.simulation_items.filter(
                              (_, position) => position !== index
                            ),
                          })
                        }
                      >
                        Hapus
                      </Button>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-lg border-dashed hover:border-primary hover:bg-primary/5 hover:text-primary font-medium"
                      disabled={disabled || input.simulation_items.length >= 100}
                      onClick={() =>
                        onChange({
                          ...input,
                          simulation_items: [
                            ...input.simulation_items,
                            { variant_id: '', quantity: '1' },
                          ],
                        })
                      }
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      Tambah Menu Pesanan Contoh
                    </Button>
                    {input.items.some(
                      (item) => item.item_role === 'TRIGGER' && item.variant_id
                    ) && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-lg border-dashed hover:border-primary hover:bg-primary/5 hover:text-primary font-medium"
                        disabled={disabled}
                        onClick={() =>
                          onChange({
                            ...input,
                            simulation_items: basketFromTriggers(input.items),
                          })
                        }
                      >
                        Gunakan Menu Persyaratan
                      </Button>
                    )}
                  </div>
                </PromotionFormPanel>

                {/* Confirmation of risk if MARGIN_DEFICIT */}
                {(simulation?.health_status === 'MARGIN_DEFICIT' || simulation?.is_loss_leader) && (
                  <div
                    role="alert"
                    className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive space-y-2"
                  >
                    <p className="font-semibold flex items-center gap-2">
                      <span>Perhatian: Strategi Nombok (Bakar Duit) Terdeteksi</span>
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Promosi ini menghasilkan proyeksi keuntungan negatif (uang masuk lebih kecil dari modal bahan). Pastikan batas anggaran promo toko dan batas transaksi telah diatur agar tidak boncos.
                    </p>
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <PromotionSimulator
                  simulation={simulation}
                  loading={simulationLoading}
                  error={simulationError}
                  readiness={readiness}
                  readOnly={readOnly}
                  retry={retrySimulation || (() => {})}
                />
              </div>
            </div>
          )}
        </fieldset>

        {/* Sticky bottom footer bar matching product-builder pattern */}
        <div className="z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-3 sm:p-4 lg:sticky lg:bottom-0 shadow-xs">
          <p className="text-xs text-muted-foreground font-medium">
            Langkah {step + 1} dari {steps.length}: <span className="text-foreground font-semibold">{steps[step]}</span>
          </p>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-lg flex-1 sm:flex-none font-medium"
              disabled={busy}
              onClick={onCancel}
            >
              Batal
            </Button>
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-lg flex-1 sm:flex-none font-medium"
                disabled={busy}
                onClick={() => goTo(step - 1)}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Kembali
              </Button>
            )}
            {step < 2 ? (
              <Button
                key="next-step"
                type="button"
                className="h-9 rounded-lg flex-1 sm:flex-none font-medium"
                disabled={busy}
                onClick={next}
              >
                Lanjut
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              !readOnly && canWrite && (
                <Button
                  key="save-promotion"
                  type="submit"
                  className="h-9 rounded-lg flex-1 sm:flex-none font-semibold"
                  disabled={
                    busy ||
                    !input.name.trim() ||
                    Boolean(readiness) ||
                    simulationLoading ||
                    Boolean(simulationError) ||
                    !simulation
                  }
                >
                  <Check className="mr-1.5 h-4 w-4" />
                  {busy ? 'Menyimpan…' : 'Simpan promosi'}
                </Button>
              )
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

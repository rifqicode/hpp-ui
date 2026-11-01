import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  Field,
  TextField,
  DateTimeField,
  NumberField,
  CheckField,
  PromotionFormPanel,
  selectClass,
} from './promotion-fields';
import { CatalogSelect } from './promotion-catalog-select';
import { PromotionConditions } from './promotion-conditions';
import { PromotionFormSummary } from './promotion-form-summary';
import { PromotionSimulator } from './promotion-simulator';
import {
  basketFromTriggers,
  changePromotionType,
  fromLocalDateTime,
  newPromotionItem,
  promotionTypes,
  toLocalDateTime,
} from '../lib/promotion-form';
import { validatePromotionLimits, validatePromotionRules } from '../lib/promotion-form-validation';
import type { PromotionInput, PromotionSimulation } from '../types';

export interface PromotionFormProps {
  input: PromotionInput;
  onChange: (input: PromotionInput) => void;
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
  initialStep?: number;
}

export function PromotionForm({
  input,
  onChange,
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
  initialStep = 0,
}: PromotionFormProps) {
  const [step, setStep] = useState(initialStep);
  const [visited, setVisited] = useState(initialStep);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [chosenNames, setChosenNames] = useState<Record<string, string>>({});
  const topRef = useRef<HTMLDivElement>(null);
  const compact = useIsMobile(1024);
  const catalogNames = useMemo(
    () => new Map([...names, ...Object.entries(chosenNames)]),
    [names, chosenNames],
  );
  const rememberName = (id: string, name: string) =>
    setChosenNames(previous => ({ ...previous, [id]: name }));
  const steps = ['Aturan promo', 'Periode & batas', 'Simulasi & simpan'];
  const validators = [validatePromotionRules, validatePromotionLimits];

  function goTo(target: number) {
    if (busy) return;
    if (!readOnly && target > step) {
      for (let index = 0; index < target; index++) {
        const invalid = validators[index](input);
        if (Object.keys(invalid).length) {
          setStep(index);
          setErrors(invalid);
          topRef.current?.scrollIntoView?.({ block: 'start' });
          return;
        }
      }
    }
    setErrors({});
    setVisited(current => Math.max(current, target));
    setStep(target);
    topRef.current?.scrollIntoView?.({ block: 'start' });
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (busy || readOnly || !canWrite) return;
    if (step < 2) {
      goTo(step + 1);
      return;
    }
    for (let index = 0; index < validators.length; index++) {
      const invalid = validators[index](input);
      if (Object.keys(invalid).length) {
        setStep(index);
        setErrors(invalid);
        topRef.current?.scrollIntoView?.({ block: 'start' });
        return;
      }
    }
    if (!input.cost_basis) {
      setErrors({ cost_basis: 'Pilih dasar HPP untuk menjalankan simulasi.' });
      return;
    }
    if (readiness || simulationLoading || simulationError || !simulation) return;
    void onSave?.();
  }

  return (
    <div ref={topRef} className="w-full min-w-0 space-y-5 pb-4">
      <ol
        aria-label="Tahapan promosi"
        className="grid min-w-0 grid-cols-3 gap-2 border-b pb-4 sm:flex sm:flex-wrap sm:gap-4"
      >
        {steps.map((label, index) => (
          <li key={label} className="min-w-0">
            <button
              type="button"
              aria-current={step === index ? 'step' : undefined}
              disabled={busy || (!readOnly && index > visited)}
              onClick={() => goTo(index)}
              className={cn(
                'flex min-h-11 w-full cursor-pointer items-start gap-2 rounded-lg p-1 text-left text-xs focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 sm:items-center sm:px-2 sm:text-sm',
                step === index ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs',
                  step === index && 'border-primary bg-primary text-primary-foreground',
                )}
              >
                {index < step ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
              </span>
              <span className="min-w-0 break-words pt-0.5">{label}</span>
            </button>
          </li>
        ))}
      </ol>
      {Object.keys(errors).length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <p className="font-semibold">Periksa isian sebelum melanjutkan</p>
          <p className="mt-1">{Object.values(errors)[0]}</p>
        </div>
      )}

      <form onSubmit={handleSave} noValidate className="min-w-0 space-y-5">
        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(18rem,1fr)]">
          <fieldset disabled={disabled} className="min-w-0 space-y-5">
            {step === 0 && (
              <>
                <PromotionFormPanel
                  title="Aturan promo"
                  description="Pilih jenis promo, lalu isi aturan yang berlaku untuk pelanggan."
                >
                  <fieldset className="min-w-0 space-y-3">
                    <legend className="text-sm font-medium">Jenis promo</legend>
                    <div
                      className="grid min-w-0 gap-3 sm:grid-cols-2"
                      role="radiogroup"
                      aria-label="Jenis promo"
                    >
                      {promotionTypes.map(kind => (
                        <label
                          key={kind.value}
                          className={cn(
                            'flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border p-3 sm:p-4',
                            input.promo_type === kind.value
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-border hover:bg-muted/30',
                          )}
                        >
                          <input
                            type="radio"
                            name="promo_type"
                            aria-label={kind.label}
                            checked={input.promo_type === kind.value}
                            disabled={disabled}
                            onChange={() => {
                              onChange(changePromotionType(input, kind.value));
                              setErrors({});
                            }}
                            className="mt-0.5 size-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{kind.label}</span>
                            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                              {kind.description}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <TextField
                    label="Nama promosi"
                    required
                    maxLength={255}
                    value={input.name}
                    error={errors.name}
                    placeholder="Contoh: Diskon Sarapan 10%"
                    onChange={event => onChange({ ...input, name: event.target.value })}
                  />
                  {input.promo_type === 'DIRECT_DISCOUNT' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Lingkup diskon">
                        {id => (
                          <select
                            id={id}
                            className={selectClass}
                            value={input.scope}
                            onChange={event =>
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
                        {id => (
                          <select
                            id={id}
                            className={selectClass}
                            value={input.discount_type}
                            onChange={event =>
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
                        required
                        value={input.discount_value}
                        error={errors.discount_value}
                        onChange={value => onChange({ ...input, discount_value: value })}
                      />
                      <NumberField
                        label="Maksimum diskon (Rp)"
                        hint="Isi 0 untuk tanpa batas potongan."
                        value={input.max_discount_amount}
                        error={errors.max_discount_amount}
                        onChange={value => onChange({ ...input, max_discount_amount: value })}
                      />
                    </div>
                  )}
                  <PromotionConditions
                    input={input}
                    onChange={onChange}
                    names={catalogNames}
                    onName={rememberName}
                    disabled={disabled}
                    errors={errors}
                  />
                  <details className="border-t pt-4">
                    <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
                      Kode dan deskripsi opsional
                    </summary>
                    <div className="space-y-4 pt-3">
                      <TextField
                        label="Kode promosi"
                        maxLength={50}
                        value={input.code || ''}
                        placeholder="Contoh: SARAPAN10"
                        onChange={event =>
                          onChange({ ...input, code: event.target.value.toUpperCase() || null })
                        }
                      />
                      <TextField
                        label="Deskripsi promosi"
                        maxLength={10000}
                        value={input.description}
                        placeholder="Keterangan tambahan untuk promo ini"
                        onChange={event => onChange({ ...input, description: event.target.value })}
                      />
                    </div>
                  </details>
                </PromotionFormPanel>
              </>
            )}

            {step === 1 && (
              <>
                <PromotionFormPanel
                  title="Periode & kanal"
                  description="Tanggal boleh dikosongkan jika promo tidak dibatasi waktu."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DateTimeField
                      label="Mulai (waktu lokal)"
                      value={toLocalDateTime(input.start_at)}
                      onChange={value => onChange({ ...input, start_at: fromLocalDateTime(value) })}
                    />
                    <DateTimeField
                      label="Berakhir (waktu lokal)"
                      error={errors.schedule}
                      value={toLocalDateTime(input.end_at)}
                      onChange={value => onChange({ ...input, end_at: fromLocalDateTime(value) })}
                    />
                  </div>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">Kanal penjualan</legend>
                    <div className="flex flex-wrap gap-x-6">
                      {(['POS', 'ONLINE'] as const).map(channel => (
                        <CheckField
                          key={channel}
                          label={channel === 'POS' ? 'Kasir POS' : 'Online / Storefront'}
                          checked={input.applicable_channels.includes(channel)}
                          onChange={event =>
                            onChange({
                              ...input,
                              applicable_channels: event.target.checked
                                ? [...input.applicable_channels, channel]
                                : input.applicable_channels.filter(value => value !== channel),
                            })
                          }
                        />
                      ))}
                    </div>
                    {errors.channels && (
                      <p className="text-sm text-destructive">{errors.channels}</p>
                    )}
                  </fieldset>
                </PromotionFormPanel>
                <PromotionFormPanel
                  title="Anggaran & batas penggunaan"
                  description="Atur batas subsidi dan syarat pelanggan untuk promo ini."
                >
                  <NumberField
                    label="Batas anggaran promo (Rp)"
                    hint="Isi 0 untuk tanpa batas. Estimasi jumlah transaksi muncul setelah simulasi."
                    value={input.promo_budget}
                    error={errors.promo_budget}
                    onChange={value => onChange({ ...input, promo_budget: value })}
                  />
                  <CheckField
                    label="Wajib isi nomor telepon pelanggan"
                    checked={input.is_customer_required}
                    onChange={event =>
                      onChange({ ...input, is_customer_required: event.target.checked })
                    }
                  />
                  {input.promo_type !== 'DIRECT_DISCOUNT' && (
                    <>
                      {input.promo_type !== 'SPECIAL_PRICE' && (
                        <CheckField
                          label="Berlaku kelipatan sesuai jumlah pemicu"
                          checked={input.is_multiplier_allowed}
                          onChange={event =>
                            onChange({ ...input, is_multiplier_allowed: event.target.checked })
                          }
                        />
                      )}
                      <NumberField
                        label={
                          input.promo_type === 'BUNDLE'
                            ? 'Maksimum paket per transaksi'
                            : 'Maksimum unit hadiah per transaksi'
                        }
                        integer
                        value={String(input.max_reward_per_transaction)}
                        error={errors.max_reward}
                        onChange={value =>
                          onChange({
                            ...input,
                            max_reward_per_transaction: value ? Number(value) : 0,
                          })
                        }
                      />
                    </>
                  )}
                  <p className="border-t pt-4 text-xs leading-5 text-muted-foreground">
                    Satu promo per transaksi. Tidak dapat digabung dengan promo atau diskon manual
                    lain.
                  </p>
                </PromotionFormPanel>
              </>
            )}

            {step === 2 && (
              <>
                <PromotionFormPanel
                  title="Simulasi pesanan"
                  description="Pilih dasar HPP, lalu isi contoh menu berbayar untuk menguji dampak promo."
                >
                  <fieldset className="space-y-3">
                    <legend className="text-sm font-medium">Dasar perhitungan HPP</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          value: 'LATEST_HPP' as const,
                          label: 'HPP produksi terakhir',
                          hint: 'Menggunakan HPP dari produksi terakhir.',
                        },
                        {
                          value: 'CURRENT_RECIPE' as const,
                          label: 'Harga bahan baku sekarang',
                          hint: 'Menggunakan biaya resep dengan harga bahan saat ini.',
                        },
                      ].map(basis => (
                        <label
                          key={basis.value}
                          className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-lg border p-3',
                            input.cost_basis === basis.value
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'hover:bg-muted/30',
                          )}
                        >
                          <input
                            type="radio"
                            name="cost_basis"
                            aria-label={basis.label}
                            checked={input.cost_basis === basis.value}
                            disabled={disabled}
                            onChange={() => onChange({ ...input, cost_basis: basis.value })}
                            className="mt-0.5 size-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          />
                          <span>
                            <span className="block text-sm font-medium">{basis.label}</span>
                            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                              {basis.hint}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                    {errors.cost_basis && (
                      <p className="text-sm text-destructive">{errors.cost_basis}</p>
                    )}
                  </fieldset>
                  <div className="space-y-4 border-t pt-5">
                    <h3 className="text-sm font-medium">Contoh pesanan pelanggan</h3>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Isi menu yang dibeli. Bonus ditambahkan oleh perhitungan promo, tidak perlu
                      dimasukkan sebagai pembelian.
                    </p>
                    {input.simulation_items.map((item, index) => (
                      <div
                        key={index}
                        className="grid min-w-0 items-end gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_6rem_auto]"
                      >
                        <CatalogSelect
                          label={`Varian simulasi ${index + 1}`}
                          value={item.variant_id}
                          names={catalogNames}
                          onName={rememberName}
                          disabled={disabled}
                          onChange={value =>
                            onChange({
                              ...input,
                              simulation_items: input.simulation_items.map((row, position) =>
                                position === index ? { ...row, variant_id: value } : row,
                              ),
                            })
                          }
                        />
                        <NumberField
                          label={`Jumlah ${index + 1}`}
                          value={item.quantity}
                          onChange={value =>
                            onChange({
                              ...input,
                              simulation_items: input.simulation_items.map((row, position) =>
                                position === index ? { ...row, quantity: value } : row,
                              ),
                            })
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          aria-label={`Hapus menu simulasi ${index + 1}`}
                          className="min-h-11 text-destructive sm:min-h-10"
                          disabled={disabled || input.simulation_items.length <= 1}
                          onClick={() =>
                            onChange({
                              ...input,
                              simulation_items: input.simulation_items.filter(
                                (_, position) => position !== index,
                              ),
                            })
                          }
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11 sm:min-h-10"
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
                        <Plus className="size-4" aria-hidden="true" />
                        Tambah menu contoh
                      </Button>
                      {input.items.some(
                        item => item.item_role === 'TRIGGER' && item.variant_id,
                      ) && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="min-h-11 sm:min-h-10"
                          disabled={disabled}
                          onClick={() =>
                            onChange({
                              ...input,
                              simulation_items: basketFromTriggers(input.items),
                            })
                          }
                        >
                          Gunakan menu persyaratan
                        </Button>
                      )}
                    </div>
                  </div>
                </PromotionFormPanel>
                {!readOnly && (
                  <PromotionFormPanel
                    title="Status setelah disimpan"
                    description="Promo nonaktif belum dapat dipakai pelanggan. Aktifkan jika aturan dan simulasi sudah sesuai."
                  >
                    <div
                      className="space-y-2"
                      role="radiogroup"
                      aria-label="Status setelah disimpan"
                    >
                      {[
                        { active: false, label: 'Simpan nonaktif' },
                        { active: true, label: 'Langsung aktifkan' },
                      ].map(status => (
                        <label
                          key={String(status.active)}
                          className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"
                        >
                          <input
                            type="radio"
                            name="activation"
                            checked={input.is_active === status.active}
                            onChange={() => onChange({ ...input, is_active: status.active })}
                            className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          />
                          {status.label}
                        </label>
                      ))}
                    </div>
                  </PromotionFormPanel>
                )}
              </>
            )}
          </fieldset>

          <aside
            aria-label={step === 2 ? 'Hasil simulasi promo' : 'Ringkasan promo'}
            className="min-w-0 lg:sticky lg:top-4"
          >
            {step === 2 ? (
              <PromotionSimulator
                simulation={simulation}
                loading={simulationLoading}
                error={simulationError}
                readiness={readiness}
                readOnly={readOnly}
                retry={retrySimulation || (() => {})}
              />
            ) : compact ? (
              <details className="rounded-xl border bg-card">
                <summary className="min-h-11 cursor-pointer p-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
                  Lihat ringkasan promo
                </summary>
                <PromotionFormSummary
                  input={input}
                  names={catalogNames}
                  className="rounded-none border-0 border-t"
                />
              </details>
            ) : (
              <PromotionFormSummary input={input} names={catalogNames} />
            )}
          </aside>
        </div>

        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-2xs sm:p-4">
          <p className="text-xs text-muted-foreground">
            Langkah {step + 1} dari 3 ·{' '}
            <span className="font-medium text-foreground">{steps[step]}</span>
          </p>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 flex-1 sm:min-h-10 sm:flex-none"
              disabled={busy}
              onClick={onCancel}
            >
              Batal
            </Button>
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                className="min-h-11 flex-1 sm:min-h-10 sm:flex-none"
                disabled={busy}
                onClick={() => goTo(step - 1)}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Kembali
              </Button>
            )}
            {step < 2 ? (
              <Button
                key="next-step"
                type="button"
                className="min-h-11 flex-1 sm:min-h-10 sm:flex-none"
                disabled={busy}
                onClick={() => goTo(step + 1)}
              >
                Lanjut
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              !readOnly &&
              canWrite && (
                <Button
                  key="save-promotion"
                  type="submit"
                  className="min-h-11 flex-1 sm:min-h-10 sm:flex-none"
                  disabled={
                    busy ||
                    !input.name.trim() ||
                    Boolean(readiness) ||
                    simulationLoading ||
                    Boolean(simulationError) ||
                    !simulation
                  }
                >
                  {busy ? 'Menyimpan…' : input.is_active ? 'Simpan & aktifkan' : 'Simpan nonaktif'}
                </Button>
              )
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

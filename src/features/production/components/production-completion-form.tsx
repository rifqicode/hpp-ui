import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FeedbackAlert } from '@/components/ui/feedback-alert';
import { CurrencyText } from '@/components/ui/currency-text';
import { cn } from '@/lib/utils';
import { overheadService } from '@/features/overheads/services/overhead-service';
import {
  productionBatchService,
  type ProductionHead,
  type ProductionLogItem,
  type ProductionCompleteItem,
} from '../services/production-batch-service';

function materialRows(log: ProductionLogItem) {
  const rows = new Map<
    string,
    {
      stock_id: string;
      sale_item_modifier_id?: string;
      name: string;
      unit: string;
      quantity: string;
      consumed: number;
    }
  >();
  function add(
    stock_id: string,
    modifier: string | undefined,
    name: string,
    unit: string,
    planned: number,
  ) {
    const key = `${stock_id}:${modifier || 'BASE'}`;
    const existing = rows.get(key);
    if (existing) {
      existing.quantity = String(Number((Number(existing.quantity) + planned).toFixed(4)));
      return;
    }
    rows.set(key, {
      stock_id,
      sale_item_modifier_id: modifier,
      name,
      unit,
      quantity: String(Number(planned.toFixed(4))),
      consumed: 0,
    });
  }
  for (const item of log.recipe_snapshot.items || [])
    add(
      item.stock_id,
      undefined,
      item.stock_name,
      item.unit,
      Number(item.quantity) * Number(log.target_quantity),
    );
  for (const item of log.recipe_snapshot.modifiers || [])
    if (item.stock_id)
      add(
        item.stock_id,
        item.id,
        `Add-on: ${item.name}`,
        item.unit,
        Number(item.ingredient_quantity) * Number(log.target_quantity),
      );
  for (const row of rows.values()) {
    row.consumed = Number(
      (log.consumptions || [])
        .filter(
          c =>
            c.stock_id === row.stock_id &&
            (c.sale_item_modifier_id || '') === (row.sale_item_modifier_id || ''),
        )
        .reduce((sum, c) => sum + Number(c.quantity), 0)
        .toFixed(4),
    );
    if (log.inventory_consumed_at) row.quantity = String(row.consumed);
  }
  return [...rows.values()];
}

export function ProductionCompletionForm({
  batch,
  logs,
  onDone,
  onCancel,
  onBusyChange,
  compact = false,
}: {
  compact?: boolean;
  onBusyChange?: (busy: boolean) => void;
  batch: ProductionHead;
  logs: ProductionLogItem[];
  onDone: (head: ProductionHead) => void;
  onCancel: () => void;
}) {
  const [operationId] = React.useState(() => crypto.randomUUID());
  const [forms, setForms] = React.useState(() =>
    logs.map(log => ({
      log,
      good: String(log.target_quantity),
      waste: '0',
      notes: '',
      materials: materialRows(log),
      overheads: (log.recipe_snapshot.overheads || []).map(oh => ({
        ...oh,
        amount: String(oh.amount ?? 0),
      })),
    })),
  );
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (logs.length > 1) {
      logs.forEach((log, idx) => {
        initial[log.id] = idx > 0;
      });
    }
    return initial;
  });
  const [confirmedVariants, setConfirmedVariants] = React.useState<Record<string, boolean>>({});
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [unknownResult, setUnknownResult] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    overheadService
      .getOverheads({ activeOnly: true, category: 'PRODUCTION' })
      .then(masterOverheads => {
        if (!active || !masterOverheads?.length) return;
        setForms(previous =>
          previous.map(form => {
            const merged = [...form.overheads];
            for (const master of masterOverheads) {
              const exists = merged.some(
                oh =>
                  (oh.overhead_type_id && oh.overhead_type_id === master.id) ||
                  oh.name.trim().toLowerCase() === master.name.trim().toLowerCase(),
              );
              if (!exists) {
                merged.push({
                  overhead_type_id: master.id,
                  name: master.name,
                  amount: String(master.defaultAmount ?? 0),
                });
              }
            }
            return { ...form, overheads: merged };
          }),
        );
      })
      .catch(() => {
        // Keep existing snapshot overheads if master lookup fails
      });
    return () => {
      active = false;
    };
  }, []);

  function valid(value: string) {
    return value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
  }

  function validateVariant(form: (typeof forms)[number]) {
    if (
      ![
        form.good,
        form.waste,
        ...form.materials.map(m => m.quantity),
        ...form.overheads.map(oh => oh.amount),
      ].every(valid)
    ) {
      return 'Isi hasil, waste, bahan aktual, dan overhead dengan angka 0 atau lebih.';
    }
    if (form.overheads.some(oh => !oh.name.trim())) {
      return 'Isi nama setiap komponen overhead.';
    }
    if (Number(form.good) === 0 && (Number(form.waste) <= 0 || !form.notes.trim())) {
      return 'Produksi gagal membutuhkan jumlah waste dan alasan pada catatan.';
    }
    return null;
  }

  function handleConfirmVariant(index: number) {
    const form = forms[index];
    const validationError = validateVariant(form);
    if (validationError) {
      setCollapsed(prev => ({ ...prev, [form.log.id]: false }));
      setError(validationError);
      return;
    }
    setError('');
    setConfirmedVariants(prev => ({ ...prev, [form.log.id]: true }));
    setCollapsed(prev => {
      const nextCollapsed = { ...prev, [form.log.id]: true };
      if (index < forms.length - 1) {
        nextCollapsed[forms[index + 1].log.id] = false;
      }
      return nextCollapsed;
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    for (const form of forms) {
      const validationError = validateVariant(form);
      if (validationError) {
        setCollapsed(prev => ({ ...prev, [form.log.id]: false }));
        setError(validationError);
        return;
      }
    }
    const items: ProductionCompleteItem[] = forms.map(form => ({
      log_id: form.log.id,
      actual_qty: form.good,
      waste_qty: form.waste,
      notes: form.notes,
      actual_ingredients: form.materials.map(({ stock_id, sale_item_modifier_id, quantity }) => ({
        stock_id,
        sale_item_modifier_id,
        quantity,
      })),
      overheads: form.overheads,
    }));
    setBusy(true);
    onBusyChange?.(true);
    try {
      onDone(await productionBatchService.complete(batch.id, operationId, items));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Penyelesaian belum berhasil.');
      setUnknownResult(true);
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4" aria-busy={busy}>
      {!compact && (
        <div>
          <h2 className="text-lg font-semibold">Selesaikan Produksi</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {logs.length} varian diselesaikan. Konfirmasi hasil dan bahan yang benar-benar
            digunakan.
          </p>
        </div>
      )}
      {error && <FeedbackAlert variant="error">{error}</FeedbackAlert>}
      {unknownResult && (
        <p className="text-xs text-muted-foreground">
          Input tetap tersedia. Jika hasil request belum jelas, coba kirim kembali dengan input yang
          sama; penyelesaian tidak akan tercatat dua kali.
        </p>
      )}
      <div className="space-y-3">
        {forms.map((form, index) => {
          const update = (value: Partial<typeof form>) =>
            setForms(previous =>
              previous.map((item, i) => (i === index ? { ...item, ...value } : item)),
            );
          const isCollapsed = Boolean(logs.length > 1 && collapsed[form.log.id]);
          const totalOverhead = form.overheads.reduce(
            (sum, oh) => sum + Number(oh.amount || 0),
            0,
          );

          return (
            <fieldset
              key={form.log.id}
              disabled={busy}
              className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-2xs transition-colors"
            >
              {/* Header Baris Varian (Collapsible Toggle jika >1 varian) */}
              {logs.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed(prev => ({
                      ...prev,
                      [form.log.id]: !isCollapsed,
                    }))
                  }
                  className="flex w-full items-center justify-between gap-3 bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted/70"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="truncate text-xs font-bold text-foreground">
                      {form.log.recipe_snapshot.product_name} ·{' '}
                      {form.log.recipe_snapshot.variant_name}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {confirmedVariants[form.log.id] && (
                      <span
                        aria-label="Tervalidasi"
                        data-testid="variant-confirmed"
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      </span>
                    )}
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      Hasil: {form.good}/{Number(form.log.target_quantity)}{' '}
                      {form.log.recipe_snapshot.product_unit}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-muted-foreground transition-transform duration-200',
                        !isCollapsed && 'rotate-180',
                      )}
                    />
                  </div>
                </button>
              ) : (
                <div className="flex items-center justify-between border-b border-border/70 bg-muted/30 px-4 py-2.5">
                  <legend className="text-xs font-bold text-foreground">
                    {form.log.recipe_snapshot.product_name} · {form.log.recipe_snapshot.variant_name}
                  </legend>
                  {confirmedVariants[form.log.id] && (
                    <span
                      aria-label="Tervalidasi"
                      data-testid="variant-confirmed"
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    >
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    </span>
                  )}
                </div>
              )}

              {/* Isi Form Varian */}
              <div className={cn('space-y-4 p-4', isCollapsed && 'hidden')}>
                {/* Bagian 1: Hasil Baik & Waste */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`good-${form.log.id}`} className="text-xs font-medium">
                        Hasil baik
                      </Label>
                      <span className="text-[11px] text-muted-foreground">
                        Target: {Number(form.log.target_quantity)}{' '}
                        {form.log.recipe_snapshot.product_unit}
                      </span>
                    </div>
                    <Input
                      id={`good-${form.log.id}`}
                      type="number"
                      min="0"
                      step="0.0001"
                      value={form.good}
                      onChange={e => update({ good: e.target.value })}
                      className="h-10 rounded-xl font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`waste-${form.log.id}`} className="text-xs font-medium">
                      Waste / produk afkir
                    </Label>
                    <Input
                      id={`waste-${form.log.id}`}
                      type="number"
                      min="0"
                      step="0.0001"
                      value={form.waste}
                      onChange={e => update({ waste: e.target.value })}
                      className="h-10 rounded-xl font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Bagian 2: Pemakaian Bahan Aktual (Clean Divided List) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Pemakaian Bahan Aktual
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <span>Biaya Bahan Tercatat:</span>
                      <CurrencyText value={form.log.bom_cost} />
                    </div>
                  </div>
                  {!form.log.inventory_consumed_at && (
                    <p className="text-xs text-muted-foreground">
                      Produksi lama ini belum membukukan bahan; pemakaian aktual dicatat saat
                      selesai.
                    </p>
                  )}
                  <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-muted/20">
                    {form.materials.map((m, materialIndex) => {
                      const delta = Number(m.quantity) - m.consumed;
                      return (
                        <div
                          key={`${m.stock_id}:${m.sale_item_modifier_id || 'BASE'}`}
                          className="flex flex-col justify-between gap-2 p-3 text-xs sm:flex-row sm:items-center"
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <Label
                                htmlFor={`material-${form.log.id}-${materialIndex}`}
                                className="text-xs font-medium leading-4 text-foreground"
                              >
                                {m.name} ({m.unit})
                              </Label>
                              {Number.isFinite(delta) && delta !== 0 && (
                                <span
                                  className={cn(
                                    'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                                    delta > 0
                                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                      : 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
                                  )}
                                >
                                  {delta > 0
                                    ? `+${Number(delta.toFixed(4))} ${m.unit}`
                                    : `${Number(delta.toFixed(4))} ${m.unit}`}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Sudah dipotong: {m.consumed} {m.unit}
                            </p>
                          </div>
                          <div className="w-full shrink-0 sm:w-36">
                            <Input
                              id={`material-${form.log.id}-${materialIndex}`}
                              type="number"
                              min="0"
                              step="0.0001"
                              value={m.quantity}
                              onChange={e =>
                                update({
                                  materials: form.materials.map((item, i) =>
                                    i === materialIndex
                                      ? { ...item, quantity: e.target.value }
                                      : item,
                                  ),
                                })
                              }
                              className="h-9 rounded-lg font-mono text-sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bagian 3: Overhead Produksi (Clean Divided List) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Biaya Overhead Produksi
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <span>Total Overhead:</span>
                      <CurrencyText value={totalOverhead} preset="detail" />
                    </div>
                  </div>
                  {form.overheads.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border/70 p-3 text-center text-xs text-muted-foreground">
                      Tidak ada komponen overhead pada produksi ini.
                    </p>
                  ) : (
                    <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-muted/20">
                      {form.overheads.map((oh, i) => (
                        <div
                          key={oh.overhead_type_id || i}
                          className="flex items-center justify-between gap-3 p-3 text-xs"
                        >
                          <Label
                            htmlFor={`oh-${form.log.id}-${i}`}
                            className="text-xs font-medium leading-4 text-foreground"
                          >
                            {oh.name} (Rp)
                          </Label>
                          <div className="w-full shrink-0 sm:w-36">
                            <Input
                              id={`oh-${form.log.id}-${i}`}
                              type="number"
                              min="0"
                              step="0.0001"
                              value={oh.amount}
                              onChange={e =>
                                update({
                                  overheads: form.overheads.map((item, j) =>
                                    j === i ? { ...item, amount: e.target.value } : item,
                                  ),
                                })
                              }
                              className="h-9 rounded-lg font-mono text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bagian 4: Catatan / Alasan Produksi Gagal */}
                <div className="space-y-1.5">
                  <Label htmlFor={`notes-${form.log.id}`} className="text-xs font-medium">
                    Catatan / alasan produksi gagal
                  </Label>
                  <Textarea
                    id={`notes-${form.log.id}`}
                    rows={2}
                    placeholder="Catatan hasil produksi atau alasan bila produksi afkir/gagal..."
                    value={form.notes}
                    onChange={e => update({ notes: e.target.value })}
                    className="resize-none rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end pt-1 border-t border-border/50">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleConfirmVariant(index)}
                    className="h-8 rounded-lg text-xs"
                  >
                    {logs.length > 1 && index < forms.length - 1 ? 'Simpan & Lanjut' : 'Simpan'}
                  </Button>
                </div>
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onCancel}
          className="min-h-10 rounded-xl text-xs"
        >
          {compact ? 'Kembali' : 'Kembali ke Detail'}
        </Button>
        <Button type="submit" disabled={busy} className="min-h-10 rounded-xl text-xs">
          {busy ? 'Menyelesaikan…' : 'Konfirmasi Selesaikan'}
        </Button>
      </div>
    </form>
  );
}

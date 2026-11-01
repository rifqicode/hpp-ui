import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FeedbackAlert } from '@/components/ui/feedback-alert';
import { settingsService } from '../services/settings-service';
import type { KitchenSettings, StoreInfo } from '../types';

const DEFAULTS: Required<KitchenSettings> = {
  enable_kds_timer_alert: false,
  default_prep_time_minutes: 15,
  warning_time_minutes: 12,
  late_time_minutes: 15,
  enable_manual_timer_alert: false,
  manual_warning_lead_minutes: 15,
};

const FIELDS = [
  {
    key: 'default_prep_time_minutes',
    label: 'Target Waktu Masak Standar',
    description: 'Estimasi waktu default penyelesaian 1 pesanan di layar KDS.',
  },
  {
    key: 'warning_time_minutes',
    label: 'Peringatan Waktu Mendekati Batas',
    description: 'Waktu ketika kartu pesanan berubah warna kuning sebagai pengingat.',
  },
  {
    key: 'late_time_minutes',
    label: 'Batas Waktu Terlambat',
    description: 'Waktu ketika kartu pesanan otomatis berubah warna merah dan timer berkedip.',
  },
] as const;

export function KitchenSettingsTab({
  store,
  onUpdated,
}: {
  store: StoreInfo | null;
  onUpdated: (store: StoreInfo) => void;
}) {
  const initial = { ...DEFAULTS, ...store?.kitchen_settings };
  const [enabled, setEnabled] = React.useState(initial.enable_kds_timer_alert);
  const [manualEnabled, setManualEnabled] = React.useState(
    Boolean(initial.enable_manual_timer_alert),
  );
  const [values, setValues] = React.useState<
    Record<(typeof FIELDS)[number]['key'] | 'manual_warning_lead_minutes', string>
  >({
    default_prep_time_minutes: String(initial.default_prep_time_minutes),
    warning_time_minutes: String(initial.warning_time_minutes),
    late_time_minutes: String(initial.late_time_minutes),
    manual_warning_lead_minutes: String(
      initial.manual_warning_lead_minutes || DEFAULTS.manual_warning_lead_minutes,
    ),
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!store || saving) return;
    setError('');
    setSuccess('');
    const times = {
      default_prep_time_minutes: Number(values.default_prep_time_minutes),
      warning_time_minutes: Number(values.warning_time_minutes),
      late_time_minutes: Number(values.late_time_minutes),
    };
    const manualLead = Number(values.manual_warning_lead_minutes);
    if (
      (enabled &&
        Object.values(times).some(value => !Number.isSafeInteger(value) || value <= 0)) ||
      (manualEnabled && (!Number.isSafeInteger(manualLead) || manualLead <= 0))
    ) {
      setError('Semua parameter waktu harus berupa bilangan bulat lebih dari 0 menit.');
      return;
    }
    if (enabled && times.warning_time_minutes > times.late_time_minutes) {
      setError('Warning Time tidak boleh melebihi Late Time.');
      return;
    }
    const config: Required<KitchenSettings> = {
      enable_kds_timer_alert: enabled,
      ...times,
      enable_manual_timer_alert: manualEnabled,
      manual_warning_lead_minutes: manualLead,
    };
    for (const { key } of FIELDS) {
      if (!Number.isSafeInteger(config[key]) || config[key] <= 0) {
        config[key] = store.kitchen_settings?.[key] || DEFAULTS[key];
      }
    }
    if (
      !Number.isSafeInteger(config.manual_warning_lead_minutes) ||
      config.manual_warning_lead_minutes <= 0
    ) {
      config.manual_warning_lead_minutes =
        store.kitchen_settings?.manual_warning_lead_minutes ||
        DEFAULTS.manual_warning_lead_minutes;
    }
    setSaving(true);
    try {
      const updated = await settingsService.updateKitchenSettings(config);
      setEnabled(updated.enable_kds_timer_alert);
      setManualEnabled(Boolean(updated.enable_manual_timer_alert));
      setValues({
        default_prep_time_minutes: String(updated.default_prep_time_minutes),
        warning_time_minutes: String(updated.warning_time_minutes),
        late_time_minutes: String(updated.late_time_minutes),
        manual_warning_lead_minutes: String(
          updated.manual_warning_lead_minutes ?? DEFAULTS.manual_warning_lead_minutes,
        ),
      });
      onUpdated({ ...store, kitchen_settings: updated });
      setSuccess('Pengaturan dapur berhasil disimpan.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan dapur.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base">Pengaturan Dapur & KDS</CardTitle>
        <CardDescription>
          Atur target waktu masak dan ambang batas timer untuk outlet ini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} noValidate className="space-y-6" aria-busy={saving}>
          {error && <FeedbackAlert variant="error">{error}</FeedbackAlert>}
          {success && <FeedbackAlert variant="success">{success}</FeedbackAlert>}

          {/* Grup 1: Pesanan POS & Online (Make-to-Order) */}
          <div className="space-y-4 rounded-xl border border-border p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                1. Pesanan POS & Online (Make-to-Order)
              </h3>
              <p className="text-xs text-muted-foreground">
                Berlaku untuk pesanan masuk dari Kasir POS maupun Storefront Online yang dihitung
                sejak jam pesanan dibuat.
              </p>
            </div>
            <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/20 p-4">
              <div className="space-y-2">
                <Label htmlFor="enable-kds-timer" className="cursor-pointer leading-6">
                  Aktifkan Target Waktu Masak & Ambang Batas Late di KDS
                </Label>
                <p id="kds-timer-description" className="text-sm text-muted-foreground">
                  Saat nonaktif, timer KDS menggunakan durasi biasa tanpa indikator peringatan atau
                  keterlambatan.
                </p>
              </div>
              <div className="flex min-h-11 shrink-0 items-center">
                <Switch
                  id="enable-kds-timer"
                  checked={enabled}
                  onCheckedChange={value => {
                    setEnabled(value);
                    setError('');
                    setSuccess('');
                  }}
                  disabled={saving || !store}
                  aria-describedby="kds-timer-description"
                />
              </div>
            </div>
            <fieldset
              disabled={!enabled || saving || !store}
              className="grid min-w-0 gap-4 md:grid-cols-3 items-start disabled:opacity-60"
            >
              <legend className="sr-only">Parameter waktu masak</legend>
              {FIELDS.map(({ key, label, description }) => (
                <div key={key} className="flex min-w-0 flex-col gap-2">
                  <Label htmlFor={key} className="leading-5">
                    {label}
                  </Label>
                  <div className="flex min-w-0 rounded-md border border-input bg-background shadow-xs focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                    <Input
                      id={key}
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      value={values[key]}
                      onChange={event => {
                        setValues(previous => ({ ...previous, [key]: event.target.value }));
                        setError('');
                        setSuccess('');
                      }}
                      aria-describedby={`${key}-unit ${key}-description`}
                      className="h-11 min-w-0 rounded-r-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <span
                      id={`${key}-unit`}
                      className="flex shrink-0 items-center rounded-r-md border-l border-input bg-muted px-3 text-xs font-medium text-muted-foreground"
                    >
                      Menit
                    </span>
                  </div>
                  <p id={`${key}-description`} className="text-xs text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              ))}
            </fieldset>
          </div>

          {/* Grup 2: Produksi Manual / Dapur (Make-to-Stock) */}
          <div className="space-y-4 rounded-xl border border-border p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                2. Produksi Manual / Dapur (Make-to-Stock)
              </h3>
              <p className="text-xs text-muted-foreground">
                Mengacu pada jam Target Selesai yang diinput saat mulai produksi manual.
              </p>
            </div>
            <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/20 p-4">
              <div className="space-y-2">
                <Label htmlFor="enable-manual-timer" className="cursor-pointer leading-6">
                  Aktifkan Peringatan Target Selesai Produksi Manual
                </Label>
                <p id="manual-timer-description" className="text-sm text-muted-foreground">
                  Menampilkan pengingat kuning sebelum jam Target Selesai dan indikator merah
                  berkedip saat melewati jam Target Selesai.
                </p>
              </div>
              <div className="flex min-h-11 shrink-0 items-center">
                <Switch
                  id="enable-manual-timer"
                  checked={manualEnabled}
                  onCheckedChange={value => {
                    setManualEnabled(value);
                    setError('');
                    setSuccess('');
                  }}
                  disabled={saving || !store}
                  aria-describedby="manual-timer-description"
                />
              </div>
            </div>
            <fieldset
              disabled={!manualEnabled || saving || !store}
              className="grid min-w-0 gap-4 md:grid-cols-3 items-start disabled:opacity-60"
            >
              <legend className="sr-only">Parameter peringatan produksi manual</legend>
              <div className="flex min-w-0 flex-col gap-2 md:col-span-2">
                <Label htmlFor="manual_warning_lead_minutes" className="leading-5">
                  Peringatan Sebelum Target Selesai (Produksi Manual)
                </Label>
                <div className="flex min-w-0 max-w-md rounded-md border border-input bg-background shadow-xs focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  <Input
                    id="manual_warning_lead_minutes"
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={values.manual_warning_lead_minutes}
                    onChange={event => {
                      setValues(previous => ({
                        ...previous,
                        manual_warning_lead_minutes: event.target.value,
                      }));
                      setError('');
                      setSuccess('');
                    }}
                    aria-describedby="manual_warning_lead_minutes-unit manual_warning_lead_minutes-description"
                    className="h-11 min-w-0 rounded-r-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <span
                    id="manual_warning_lead_minutes-unit"
                    className="flex shrink-0 items-center rounded-r-md border-l border-input bg-muted px-3 text-xs font-medium text-muted-foreground"
                  >
                    menit sebelum target
                  </span>
                </div>
                <p
                  id="manual_warning_lead_minutes-description"
                  className="text-xs text-muted-foreground leading-relaxed"
                >
                  Waktu sebelum jam Target Selesai ketika kartu produksi manual berubah warna
                  kuning. Kartu berubah merah berkedip saat melewati jam Target Selesai.
                </p>
              </div>
            </fieldset>
          </div>

          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={saving || !store} className="min-h-11 w-full sm:w-auto">
              {saving ? 'Menyimpan…' : 'Simpan Pengaturan Dapur'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

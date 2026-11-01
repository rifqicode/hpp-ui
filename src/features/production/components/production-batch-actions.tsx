import { DateTimePicker } from '@/components/ui/date-time-picker';
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Factory, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { settingsService } from '@/features/settings/services/settings-service';
import { useAuthStore } from '@/store/use-auth-store';
import {
  productionBatchService,
  type ProductionHead,
  type ProductionLogItem,
} from '../services/production-batch-service';
import { ProductionCompletionForm } from './production-completion-form';

function targetISO(value: string, timezone: string) {
  if (!value) throw new Error('Pilih tanggal dan jam target selesai.');
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const desired = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(desired)) throw new Error('Tanggal dan jam target tidak valid.');
  let timestamp = desired;
  for (let i = 0; i < 3; i++)
    timestamp +=
      desired - Date.parse(`${formatter.format(new Date(timestamp)).replace(' ', 'T')}:00Z`);
  if (formatter.format(new Date(timestamp)).replace(' ', 'T') !== value)
    throw new Error('Waktu tersebut tidak tersedia pada zona waktu outlet.');
  return new Date(timestamp).toISOString();
}

export function useProductionBatchActions(onUpdated: (head: ProductionHead) => void) {
  const storeId = useAuthStore(state => state.activeStoreId);
  const profile = useQuery({
    queryKey: ['production', storeId, 'store-settings'],
    queryFn: () => settingsService.getStoreProfile(),
    enabled: Boolean(storeId),
  });
  const timezone = profile.data?.timezone || 'Asia/Jakarta';
  const [selection, setSelection] = React.useState<{
    head: ProductionHead;
    action: 'start' | 'complete' | 'cancel';
    logs?: ProductionLogItem[];
    logId?: string;
  } | null>(null);
  const [target, setTarget] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  function open(value: NonNullable<typeof selection>) {
    setError('');
    setTarget('');
    setReason('');
    setSelection(value);
  }
  function done(head: ProductionHead) {
    onUpdated(head);
    setSelection(null);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selection || busy) return;
    setBusy(true);
    setError('');
    try {
      const { head } = selection;
      const result =
        selection.action === 'start'
          ? await productionBatchService.start(
              head.id,
              head.source === 'MANUAL' && !head.started_at
                ? targetISO(target, timezone)
                : undefined,
            )
          : await productionBatchService.cancel(head.id, reason, selection.logId);
      done(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aksi belum berhasil. Coba lagi.');
    } finally {
      setBusy(false);
    }
  }
  const dialogs = (
    <Dialog
      open={Boolean(selection)}
      onOpenChange={value => {
        if (!value && !busy) setSelection(null);
      }}
    >
      <DialogContent
        className={`${selection?.action === 'complete' ? 'sm:max-w-[640px]' : 'sm:max-w-[460px]'} rounded-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6`}
      >
        <DialogHeader>
          <div
            className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${selection?.action === 'cancel' ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}
          >
            {selection?.action === 'complete' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : selection?.action === 'cancel' ? (
              <RotateCcw className="h-5 w-5" />
            ) : (
              <Factory className="h-5 w-5" />
            )}
          </div>
          <DialogTitle className="text-lg font-bold">
            {selection?.action === 'complete'
              ? 'Selesaikan Produksi'
              : selection?.action === 'cancel'
                ? 'Batalkan Produksi?'
                : 'Mulai Proses Produksi'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {selection?.head.batch_number}
            {selection?.action === 'complete'
              ? ' · Konfirmasi hasil, pemakaian bahan, dan biaya aktual per varian.'
              : selection?.action === 'cancel'
                ? ' · Bahan detail yang dibatalkan akan dikembalikan. Hasil yang sudah selesai tetap tersimpan.'
                : ' · Stok bahan dicek ulang dan dipotong saat produksi dimulai.'}
          </DialogDescription>
        </DialogHeader>
        {selection?.action === 'complete' ? (
          <ProductionCompletionForm
            key={selection.head.id + selection.logs?.map(log => log.id).join(':')}
            batch={selection.head}
            logs={selection.logs || []}
            onDone={done}
            onCancel={() => setSelection(null)}
            onBusyChange={setBusy}
            compact
          />
        ) : (
          <form onSubmit={submit} className="space-y-4 py-2">
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            {selection?.action === 'start' &&
              selection.head.source === 'MANUAL' &&
              !selection.head.started_at && (
                <div className="grid gap-2">
                  <Label htmlFor="batch-target">Target tanggal & jam selesai ({timezone})</Label>
                  <DateTimePicker
                    id="batch-target"
                    value={target}
                    disabled={busy}
                    onChange={setTarget}
                    className="h-10 rounded-xl"
                  />
                </div>
              )}
            {selection?.action === 'cancel' && (
              <div className="grid gap-2">
                <Label htmlFor="batch-cancel-reason">Alasan pembatalan</Label>
                <Input
                  id="batch-cancel-reason"
                  value={reason}
                  disabled={busy}
                  onChange={e => setReason(e.target.value)}
                  required
                  className="h-10 rounded-xl"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setSelection(null)}
                className="rounded-xl"
              >
                Kembali
              </Button>
              <Button
                type="submit"
                variant={selection?.action === 'cancel' ? 'destructive' : 'default'}
                disabled={busy || (selection?.action === 'cancel' && !reason.trim())}
                className="rounded-xl"
              >
                {busy
                  ? 'Memproses…'
                  : selection?.action === 'cancel'
                    ? 'Batalkan & Pulihkan Stok'
                    : 'Mulai Produksi'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
  return {
    begin: (head: ProductionHead) => open({ head, action: 'start' }),
    complete: (
      head: ProductionHead,
      logs = head.logs.filter(log => log.status === 'IN_PROGRESS'),
    ) => open({ head, action: 'complete', logs }),
    cancel: (head: ProductionHead, logId?: string) => open({ head, action: 'cancel', logId }),
    dialogs,
    busy,
    settings: profile.data?.kitchen_settings,
    timezone,
  };
}

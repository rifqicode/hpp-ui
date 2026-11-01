import * as React from 'react';
import { Clock } from 'lucide-react';
import type { ProductionHead } from '../services/production-batch-service';

function stamp(value: string | null | undefined, timezone: string) {
  return value
    ? new Date(value).toLocaleString('id-ID', {
        timeZone: timezone,
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Belum tersedia';
}

export function ProductionBatchTiming({
  head,
  timezone,
  settings,
}: {
  head: ProductionHead;
  timezone: string;
  settings?: {
    enable_kds_timer_alert: boolean;
    warning_time_minutes: number;
    late_time_minutes: number;
    enable_manual_timer_alert?: boolean;
    manual_warning_lead_minutes?: number;
  };
}) {
  const [now, setNow] = React.useState(Date.now);
  const active = head.status === 'QUEUED' || head.status === 'IN_PROGRESS';
  React.useEffect(() => {
    if (!active) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') setNow(Date.now());
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') setNow(Date.now());
    }, 30_000);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [active]);
  const isManual = head.source === 'MANUAL';
  const deadline = head.target_completed_at ? Date.parse(head.target_completed_at) : null;
  const at = head.completed_at ? Date.parse(head.completed_at) : now;
  const late = deadline !== null && at > deadline;
  const warningLeadMinutes = isManual
    ? Math.max(1, settings?.manual_warning_lead_minutes ?? 15)
    : Math.max(0, (settings?.late_time_minutes ?? 15) - (settings?.warning_time_minutes ?? 12));
  const warning = deadline !== null && !late && now >= deadline - warningLeadMinutes * 60_000;
  const manualAlertEnabled =
    settings?.enable_manual_timer_alert ?? settings?.enable_kds_timer_alert ?? false;
  const alert =
    active &&
    (isManual
      ? Boolean(manualAlertEnabled && head.target_completed_at)
      : Boolean(settings?.enable_kds_timer_alert));
  const elapsed = head.started_at
    ? Math.max(
        0,
        ((head.completed_at ? Date.parse(head.completed_at) : now) - Date.parse(head.started_at)) /
          60_000,
      )
    : null;
  return (
    <div
      className={`flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md py-2 text-sm ${
        alert && late
          ? 'bg-red-50 px-3 text-red-800 dark:bg-red-950/60 dark:text-red-200'
          : alert && warning
            ? 'bg-amber-50 px-3 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
            : 'text-muted-foreground'
      }`}
    >
      {head.target_completed_at && (
        <p className="flex items-center gap-1.5">
          <Clock aria-hidden="true" className="h-4 w-4 shrink-0" />
          Target selesai: {stamp(head.target_completed_at, timezone)}
        </p>
      )}
      {head.started_at && <p>Mulai: {stamp(head.started_at, timezone)}</p>}
      {head.completed_at && <p>Selesai: {stamp(head.completed_at, timezone)}</p>}
      {elapsed !== null && (
        <p>
          {head.completed_at ? 'Durasi aktual' : 'Durasi berjalan'}: {Number(elapsed.toFixed(1))}{' '}
          menit
        </p>
      )}
      {alert && late && deadline !== null && (
        <p className="font-semibold">Terlambat {Math.floor((at - deadline) / 60_000)} menit</p>
      )}
      {alert && warning && (
        <p className="rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
          Mendekati target selesai
        </p>
      )}
      {head.status === 'COMPLETED' && deadline !== null && (
        <p>
          Keterlambatan aktual: {Math.max(0, Number(((at - deadline) / 60_000).toFixed(1)))} menit
        </p>
      )}
    </div>
  );
}

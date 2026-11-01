import { useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { OverviewRange } from '../types/overview';
import { dateLabel } from '../lib/dates';

function shift(day: string, delta: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

const presets = [
  ['today', 'Hari ini'],
  ['yesterday', 'Kemarin'],
  ['7', '7 hari terakhir'],
  ['30', '30 hari terakhir'],
  ['month', 'Bulan ini'],
] as const;

export function OverviewPeriodFilter({
  range,
  today,
  preset,
  disabled,
  onApply,
}: {
  range?: OverviewRange;
  today: string;
  preset: string;
  disabled: boolean;
  onApply: (range: OverviewRange, preset: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<OverviewRange>({ start_date: '', end_date: '' });
  const days = (Date.parse(draft.end_date) - Date.parse(draft.start_date)) / 86400000 + 1;
  const error =
    !draft.start_date || !draft.end_date
      ? 'Lengkapi tanggal mulai dan akhir.'
      : draft.start_date > draft.end_date
        ? 'Tanggal akhir harus sama atau setelah tanggal mulai.'
        : draft.end_date > today
          ? 'Tanggal tidak boleh melewati hari ini.'
          : days > 366
            ? 'Rentang tanggal maksimal 366 hari.'
            : '';
  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <CalendarDays
          className="mr-1 hidden size-4 text-muted-foreground sm:block"
          aria-hidden="true"
        />
        {presets.map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={preset === key ? 'default' : 'ghost'}
            disabled={disabled}
            aria-pressed={preset === key}
            onClick={() => {
              const end = key === 'yesterday' ? shift(today, -1) : today;
              const start =
                key === 'month'
                  ? `${today.slice(0, 7)}-01`
                  : key === '7' || key === '30'
                    ? shift(end, -Number(key) + 1)
                    : end;
              setOpen(false);
              onApply({ start_date: start, end_date: end }, key);
            }}
          >
            {label}
          </Button>
        ))}
        <Button
          size="sm"
          variant={preset === 'custom' ? 'default' : 'outline'}
          disabled={disabled}
          aria-expanded={open}
          aria-controls="dashboard-custom-period"
          onClick={() => {
            setDraft(range ?? { start_date: today, end_date: today });
            setOpen(!open);
          }}
        >
          Pilih tanggal <ChevronDown className="size-3.5" aria-hidden="true" />
        </Button>
        {range && (
          <span className="w-full pt-1 text-xs text-muted-foreground sm:ml-auto sm:w-auto sm:pl-3 sm:pt-0">
            {dateLabel(range.start_date)} – {dateLabel(range.end_date)}
          </span>
        )}
      </div>
      {open && (
        <form
          id="dashboard-custom-period"
          className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-[minmax(0,1fr)_auto]"
          onSubmit={e => {
            e.preventDefault();
            if (!error) {
              onApply(draft, 'custom');
              setOpen(false);
            }
          }}
        >
          <DateRangePicker
            value={{ start: draft.start_date, end: draft.end_date }}
            max={today}
            disabled={disabled}
            invalid={Boolean(error)}
            describedBy={error ? 'dashboard-period-error' : undefined}
            onChange={({ start, end }) => setDraft({ start_date: start, end_date: end })}
          />
          <div className="flex items-end gap-2">
            <Button type="submit" disabled={!!error}>
              Terapkan
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
          </div>
          {error && (
            <p
              id="dashboard-period-error"
              role="alert"
              className="text-xs text-destructive sm:col-span-2"
            >
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

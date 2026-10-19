import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyText } from '@/components/ui/currency-text';
import { cn } from '@/lib/utils';
import { useProductionCalendar } from '../hooks/use-production-calendar';
import { ProductionStatusBadge } from './production-status';
import { PRODUCTION_STATUSES } from '../types/production-status';
import { buildCalendarWeeks } from '../lib/calendar-layout';
import type { ProductionStatus } from '../types';

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function labelDate(value: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('id-ID', { ...options, timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}

export function ProductionCalendar() {
  const { data, error, isPending, isFetching, refetch, filters, month, days, selectedDay, update, moveMonth, currentMonth } = useProductionCalendar();
  const location = useLocation();
  const returnParams = new URLSearchParams(location.search);
  returnParams.set('tab', 'calendar');
  returnParams.delete('date_basis');
  if (data) returnParams.set('month', data.month);
  const returnTo = `${location.pathname}?${returnParams}`;
  const weeks = buildCalendarWeeks(days);

  return <section className="space-y-4" aria-label="Kalender histori produksi">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold">Histori Produksi</h2>
        <p className="text-xs text-muted-foreground">Batch membentang dari tanggal mulai sampai selesai. Klik batch untuk membuka detailnya.</p>
      </div>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="icon" aria-label="Bulan sebelumnya" onClick={() => moveMonth(-1)} disabled={!data || month === '0001-01'}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={currentMonth} disabled={!data}>Bulan Ini</Button>
        <Button variant="outline" size="icon" aria-label="Bulan berikutnya" onClick={() => moveMonth(1)} disabled={!data || month === '9998-12'}><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" aria-label="Refresh kalender" onClick={() => void refetch()} disabled={isFetching}><RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} /></Button>
      </div>
    </div>

    <div className="flex flex-wrap gap-3 rounded-xl border bg-card p-3">
      <div className="min-w-0 flex-1 basis-48">
        <label htmlFor="calendar-search" className="mb-1 block text-xs font-medium">Cari produksi</label>
        <Input id="calendar-search" value={filters.search || ''} maxLength={200} placeholder="Nomor batch, produk, catatan..." onChange={(event) => update({ search: event.target.value || undefined })} />
      </div>
      <div className="flex-1 basis-40">
        <label htmlFor="calendar-status" className="mb-1 block text-xs font-medium">Status</label>
        <select id="calendar-status" value={filters.statuses || ''} onChange={(event) => update({ statuses: event.target.value || undefined })} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
          <option value="">Semua status</option>
          {Object.entries(PRODUCTION_STATUSES).map(([value, status]) => <option key={value} value={value}>{status.label}</option>)}
          <option value="CANCELLED,VOID">Dibatalkan & Void</option>
        </select>
      </div>

    </div>

    <div aria-label="Legend status produksi" className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border bg-card p-3">
      <span className="text-xs font-semibold">Legend:</span>
      {(Object.keys(PRODUCTION_STATUSES) as ProductionStatus[]).map((status) => <ProductionStatusBadge key={status} status={status} />)}
    </div>

    {error ? <div role="alert" className="rounded-xl border border-destructive/30 bg-card p-6 text-center">
      <p className="font-medium">Gagal memuat histori produksi</p><p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
      <Button className="mt-3" variant="outline" onClick={() => void refetch()}>Coba lagi</Button>
    </div> : isPending || !data ? <div role="status" className="flex items-center justify-center gap-2 p-16"><Loader2 className="h-5 w-5 animate-spin" />Memuat kalender produksi...</div> : <>
      <div className="flex flex-wrap items-end justify-between gap-2" aria-live="polite">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold capitalize"><CalendarDays className="h-5 w-5 text-primary" />{labelDate(`${data.month}-01`, { month: 'long', year: 'numeric' })}</h3>
          <p className="text-xs text-muted-foreground">{data.timezone} · {data.summary.total} batch{isFetching ? ' · Memperbarui...' : ''}</p>
        </div>
        <p className="text-xs text-muted-foreground">Biaya batch selesai: <CurrencyText value={Number(data.summary.completed_cost)} className="font-semibold text-foreground" /></p>
      </div>
      {data.summary.total === 0 && <p role="status" className="rounded-lg bg-muted p-3 text-sm">{filters.search || filters.statuses || filters.product_id ? 'Tidak ada produksi yang cocok dengan filter pada bulan ini.' : 'Belum ada produksi pada bulan ini.'}</p>}
      <div className="overflow-hidden rounded-xl border bg-card" aria-label={`Kalender ${data.month}`}>
        <div className="grid grid-cols-7 border-b bg-muted/50">{WEEKDAYS.map((day) => <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground">{day}</div>)}</div>
        {weeks.map((week, weekIndex) => <div key={weekIndex} className="relative border-b last:border-b-0" aria-label={`Minggu ${weekIndex + 1}`}>
          <div className="pointer-events-none absolute inset-0 grid grid-cols-7" aria-hidden>
            {week.days.map((day, column) => <div key={column} className={cn('border-r last:border-r-0', !day && 'bg-muted/20', day && selectedDay?.date === day.date && 'bg-primary/5 ring-1 ring-inset ring-primary/50')} />)}
          </div>
          <div className="relative grid grid-cols-7 pb-2" style={{ gridTemplateRows: `3rem repeat(${Math.max(1, Math.min(3, week.lanes))}, 2rem)` }}>
            {week.days.map((day, column) => day && <button
              key={day.date}
              type="button"
              id={`production-date-${day.date}`}
              aria-label={`${labelDate(day.date, { dateStyle: 'full' })}, ${day.items.length} batch`}
              aria-pressed={selectedDay?.date === day.date}
              aria-current={day.date === data.today ? 'date' : undefined}
              onClick={() => update({ day: day.date })}
              onKeyDown={(event) => {
                const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
                const offset = offsets[event.key];
                if (!offset) return;
                event.preventDefault();
                const nextDay = days[days.findIndex((value) => value.date === day.date) + offset];
                if (nextDay) { update({ day: nextDay.date }); document.getElementById(`production-date-${nextDay.date}`)?.focus(); }
              }}
              style={{ gridColumn: column + 1, gridRow: 1 }}
              className={cn('z-10 m-1 flex min-w-0 flex-col items-center justify-center rounded-md text-xs font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:justify-between sm:px-2', day.date === data.today && 'bg-primary text-primary-foreground hover:bg-primary/90')}
            ><span>{Number(day.date.slice(-2))}</span>{day.items.length > 0 && <span className="text-[9px] font-normal sm:text-[10px]">{day.items.length} batch</span>}</button>)}
            {week.segments.filter((segment) => segment.lane < 3).map((segment) => {
              const { item } = segment;
              const status = PRODUCTION_STATUSES[item.status];
              const range = `${labelDate(item.start_date, { dateStyle: 'medium' })} – ${labelDate(item.end_date, { dateStyle: 'medium' })}`;
              return <Link
                key={item.id}
                to={`/production/batches/${item.id}`}
                state={{ returnTo }}
                data-calendar-batch={item.id}
                data-span={segment.span}
                aria-label={`${item.batch_number}, ${item.product_name}, ${status.label}, ${range}`}
                title={`${item.batch_number} · ${item.product_name} · ${status.label} · ${range}`}
                style={{ gridColumn: `${segment.column} / span ${segment.span}`, gridRow: segment.lane + 2 }}
                className={cn('z-10 mx-0.5 my-0.5 min-w-0 overflow-hidden rounded border px-1 py-px text-[10px] leading-[12px] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-1.5 sm:text-[11px]', status.color, segment.continuesBefore && 'rounded-l-none border-l-2', segment.continuesAfter && 'rounded-r-none border-r-2')}
              ><span className="block truncate font-semibold">{segment.continuesBefore ? '← ' : ''}{item.product_name}{segment.continuesAfter ? ' →' : ''}</span><span className="block truncate text-[9px] leading-[10px]">{status.label}</span></Link>;
            })}
          </div>
          {week.lanes > 3 && <p className="relative px-2 pb-2 text-[10px] text-muted-foreground">Ada batch lainnya. Pilih tanggal untuk melihat semua.</p>}
        </div>)}
      </div>

      {selectedDay && <section className="space-y-3 rounded-xl border bg-card p-4" aria-label="Produksi tanggal terpilih">
        <div className="flex flex-wrap items-center justify-between gap-1"><h3 className="font-semibold">{labelDate(selectedDay.date, { dateStyle: 'full' })}</h3><span className="text-xs text-muted-foreground">{selectedDay.items.length} batch</span></div>
        {selectedDay.items.length === 0 ? <p className="text-sm text-muted-foreground">Tidak ada produksi pada tanggal ini.</p> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {selectedDay.items.map((item) => <Link key={item.id} to={`/production/batches/${item.id}`} state={{ returnTo }} className="space-y-2 rounded-lg border p-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-xs">{item.batch_number}</span><ProductionStatusBadge status={item.status} /></div>
            <p className="font-semibold">{item.product_name}</p>
            <p className="text-xs text-muted-foreground">{labelDate(item.start_date, { dateStyle: 'medium' })} – {item.status === 'IN_PROGRESS' ? 'berlangsung sampai hari ini' : labelDate(item.end_date, { dateStyle: 'medium' })} · Target {Number(item.qty_planned)} {item.product_unit}</p>
            {(item.status === 'COMPLETED' || item.status === 'VOID') && <p className="text-xs">Hasil {Number(item.qty_actual)} {item.product_unit} · HPP <CurrencyText value={Number(item.hpp_per_unit)} /></p>}
            <span className="inline-block text-xs font-medium text-primary">Lihat detail →</span>
          </Link>)}
        </div>}
      </section>}
    </>}
  </section>;
}

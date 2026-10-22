import { useId } from 'react';
import type { OverviewDay } from '../types/overview';
import { dateLabel } from '../lib/dates';

export function SalesTrend({ days, money }: { days: OverviewDay[]; money: (value: string | number | null | undefined) => string }) {
  const id = useId();
  const max = Math.max(...days.map(d => Number(d.net_sales)), 1);
  const points = days.map((d, i) => `${days.length === 1 ? 360 : i * 720 / (days.length - 1)},${185 - Number(d.net_sales) / max * 165}`);
  return <>
    {days.every(d => Number(d.net_sales) === 0) ? <div className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-lg bg-muted/30 px-4 text-center"><p className="text-sm font-medium">Belum ada penjualan selesai</p><p className="text-xs text-muted-foreground">Coba periode lain untuk melihat tren penjualan.</p></div> :
      <div className="mt-5" role="img" aria-label="Grafik penjualan bersih per hari. Rincian tersedia di Lihat data harian.">
        <div className="mb-2 text-xs text-muted-foreground">{money(max)}</div>
        <svg viewBox="0 0 720 205" className="w-full overflow-visible text-primary" aria-hidden="true">
          <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity="0.16" /><stop offset="100%" stopColor="currentColor" stopOpacity="0.01" /></linearGradient></defs>
          {[20, 102, 185].map(y => <line key={y} x1="0" y1={y} x2="720" y2={y} className="stroke-border" strokeDasharray="4 5" />)}
          {days.length > 1 && <polygon points={`0,185 ${points.join(' ')} 720,185`} fill={`url(#${id})`} />}
          <polyline points={points.join(' ')} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          {days.length === 1 && <circle cx="360" cy={185 - Number(days[0].net_sales) / max * 165} r="4" fill="currentColor" />}
        </svg>
        <div className="flex justify-between gap-3 text-xs text-muted-foreground"><span>{dateLabel(days[0].date)}</span>{days.length > 1 && <span>{dateLabel(days[days.length - 1].date)}</span>}</div>
      </div>}
    <details className="mt-5 border-t pt-3">
      <summary className="w-fit cursor-pointer rounded text-xs font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring">Lihat data harian</summary>
      <div className="mt-3 max-h-64 overflow-auto"><table className="w-full text-xs"><caption className="sr-only">Penjualan bersih dan jumlah transaksi per hari</caption><thead><tr className="border-b text-muted-foreground"><th className="py-2 text-left font-medium">Tanggal</th><th className="px-2 text-right font-medium">Transaksi</th><th className="py-2 text-right font-medium">Penjualan</th></tr></thead><tbody>{days.map(d => <tr key={d.date} className="border-b last:border-0"><td className="py-2">{dateLabel(d.date)}</td><td className="px-2 text-right tabular-nums">{d.transactions}</td><td className="py-2 text-right tabular-nums">{money(d.net_sales)}</td></tr>)}</tbody></table></div>
    </details>
  </>;
}

import { useMemo, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/use-auth-store'
import { useProductDetailQuery } from '@/features/reports/hooks/use-reports-query'

const money = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)

const number = (n: number) =>
  n.toLocaleString('id-ID', { maximumFractionDigits: 1 })

const percent = (n: number) => `${number(n)}%`

const formatDate = (isoDate: string) => {
  if (!isoDate) return '-'
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('id-ID', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatShortDate = (isoDate: string) => {
  if (!isoDate) return '-'
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('id-ID', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
  })
}

type Metric = 'revenue' | 'quantity' | 'profit'

export default function ProductReportPage() {
  const { variantId, productSlug } = useParams<{ variantId?: string; productSlug?: string }>()
  const targetId = variantId || productSlug

  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const permissions = useAuthStore(s => s.permissions)
  const activeStoreId = useAuthStore(s => s.activeStoreId)

  const [metric, setMetric] = useState<Metric>('revenue')

  const startDate = searchParams.get('start_date') || ''
  const endDate = searchParams.get('end_date') || ''
  const rawWeek = searchParams.get('week')
  const selectedWeek =
    rawWeek !== null && rawWeek !== '' && !Number.isNaN(Number(rawWeek))
      ? Number(rawWeek)
      : undefined

  const canAccess = permissions.some(p => ['menu:reports', '*', 'ALL'].includes(p))

  const {
    data: report,
    isLoading,
    isError,
    error,
    refetch,
  } = useProductDetailQuery(
    activeStoreId,
    targetId,
    {
      start_date: startDate,
      end_date: endDate,
      week: selectedWeek,
    },
    canAccess,
  )

  const backButton = (
    <Button asChild variant="outline" size="sm">
      <Link to="/reports" state={location.state}>
        <ArrowLeft className="mr-1.5 size-4" />
        Kembali ke laporan
      </Link>
    </Button>
  )

  const handleSelectWeek = (weekIndex: number | undefined) => {
    const next = new URLSearchParams(searchParams)
    if (weekIndex === undefined || weekIndex === selectedWeek) {
      next.delete('week')
    } else {
      next.set('week', String(weekIndex))
    }
    setSearchParams(next)
  }

  const totals = useMemo(() => {
    if (!report?.daily_rows) return null
    return report.daily_rows.reduce(
      (acc, r) => ({
        quantity: acc.quantity + Number(r.quantity_sold),
        netSales: acc.netSales + Number(r.net_sales),
        cogs: acc.cogs + Number(r.cogs),
        profit: acc.profit + Number(r.gross_profit),
      }),
      { quantity: 0, netSales: 0, cogs: 0, profit: 0 },
    )
  }, [report?.daily_rows])

  if (!canAccess) {
    return (
      <div className="rounded-xl border p-6 text-sm text-muted-foreground">
        Akses laporan belum diberikan untuk akun ini.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {backButton}
        <div className="rounded-xl border bg-card p-12 text-center text-sm text-muted-foreground">
          Memuat laporan produk…
        </div>
      </div>
    )
  }

  if (isError || !report) {
    const errorMsg =
      error instanceof Error ? error.message : 'Produk tidak ditemukan atau belum dapat dimuat.'
    return (
      <div className="space-y-4">
        {backButton}
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-3">
          <AlertCircle className="mx-auto size-8 text-destructive" />
          <h1 className="text-lg font-semibold">Produk tidak ditemukan</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{errorMsg}</p>
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Coba lagi
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const growth = report.revenue_growth_pct !== null ? Number(report.revenue_growth_pct) : null
  const marginPct = Number(report.margin_pct)
  const targetMarginPct = Number(report.target_margin_pct)
  const targetDiff = marginPct - targetMarginPct

  const peakWeekMetric = Math.max(
    ...report.weeks.map(w => {
      if (metric === 'quantity') return Number(w.quantity_sold)
      if (metric === 'profit') return Number(w.gross_profit)
      return Number(w.net_sales)
    }),
    1,
  )

  const formatWeekMetric = (w: (typeof report.weeks)[0]) => {
    if (metric === 'quantity') return `${number(Number(w.quantity_sold))} ${report.unit}`
    if (metric === 'profit') return money(Number(w.gross_profit))
    return money(Number(w.net_sales))
  }

  return (
    <div className="min-w-0 space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4">
        {backButton}
      </div>

      {/* Header */}
      <header className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {report.category || 'Tanpa Kategori'}
          </p>
          <Badge variant="outline" className="font-normal">
            Satuan: {report.unit}
          </Badge>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {report.display_name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Harga jual: <strong className="text-foreground">{money(Number(report.selling_price))}</strong> · Target margin: <strong className="text-foreground">{percent(targetMarginPct)}</strong>
        </p>
      </header>

      {/* 4 Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Penjualan bersih</p>
          <p className="mt-2 break-words text-2xl font-semibold tabular-nums">
            {money(Number(report.net_sales))}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {growth !== null
              ? `${growth >= 0 ? '+' : ''}${percent(growth)} vs periode setara sebelumnya`
              : 'Pembanding belum tersedia'}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Unit terjual</p>
          <p className="mt-2 break-words text-2xl font-semibold tabular-nums">
            {number(Number(report.quantity_sold))} {report.unit}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Rata-rata {number(Number(report.avg_daily_quantity))} {report.unit} / hari
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Laba kotor</p>
          <p className="mt-2 break-words text-2xl font-semibold tabular-nums">
            {money(Number(report.gross_profit))}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Penjualan bersih dikurangi HPP terjual
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Margin kotor</p>
          <p className="mt-2 break-words text-2xl font-semibold tabular-nums">
            {percent(marginPct)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {money(Number(report.unit_gross_profit))} laba per {report.unit}
          </p>
        </div>
      </div>

      {/* Tren & Yang Perlu Diperhatikan */}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        {/* Tren 4 Minggu */}
        <section className="min-w-0 rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Tren penjualan 4 minggu terakhir</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Klik kartu minggu untuk memfilter rincian tabel harian ke minggu tersebut.
              </p>
            </div>
            <label className="grid gap-1.5 text-xs font-medium">
              Tampilkan
              <select
                className="min-h-9 rounded-md border bg-background px-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={metric}
                onChange={e => setMetric(e.target.value as Metric)}
              >
                <option value="revenue">Penjualan bersih</option>
                <option value="quantity">Unit terjual</option>
                <option value="profit">Laba kotor</option>
              </select>
            </label>
          </div>

          <div className="mt-6 grid grid-cols-4 items-end gap-2 border-b pb-4 sm:gap-4">
            {report.weeks.map(w => {
              const isSelected = selectedWeek === w.week_index
              const val =
                metric === 'quantity'
                  ? Number(w.quantity_sold)
                  : metric === 'profit'
                    ? Number(w.gross_profit)
                    : Number(w.net_sales)
              const heightPct = Math.round((val / peakWeekMetric) * 100)

              return (
                <button
                  key={w.week_index}
                  type="button"
                  onClick={() => handleSelectWeek(isSelected ? undefined : w.week_index)}
                  aria-pressed={isSelected}
                  className="group min-w-0 rounded-md p-1 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="mb-2 block break-words text-[10px] font-medium tabular-nums sm:text-xs">
                    {formatWeekMetric(w)}
                  </span>
                  <span className="flex h-36 items-end justify-center rounded bg-muted/30">
                    <span
                      className={`block w-3/4 rounded-t transition-all ${
                        isSelected
                          ? 'bg-primary'
                          : 'bg-primary/40 group-hover:bg-primary/60'
                      }`}
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                  </span>
                  <span className="mt-2 block text-[10px] leading-relaxed text-muted-foreground sm:text-xs">
                    {w.label}
                  </span>
                  <span className="mt-1 block h-4 text-[10px] font-medium text-primary">
                    {isSelected ? 'Dipilih' : ''}
                  </span>
                </button>
              )
            })}
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer rounded py-2 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Lihat data 4 minggu dalam tabel
            </summary>
            <div className="overflow-x-auto pt-2">
              <table aria-label="Rekap empat minggu" className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th scope="col" className="py-2.5 px-3 font-medium text-muted-foreground">Minggu</th>
                    <th scope="col" className="py-2.5 px-3 font-medium text-muted-foreground">Rentang</th>
                    <th scope="col" className="py-2.5 px-3 font-medium text-muted-foreground text-right">Terjual</th>
                    <th scope="col" className="py-2.5 px-3 font-medium text-muted-foreground text-right">Penjualan</th>
                    <th scope="col" className="py-2.5 px-3 font-medium text-muted-foreground text-right">HPP</th>
                    <th scope="col" className="py-2.5 px-3 font-medium text-muted-foreground text-right">Laba kotor</th>
                  </tr>
                </thead>
                <tbody>
                  {report.weeks.map(w => (
                    <tr key={w.week_index} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2.5 px-3 font-medium">{w.label}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {formatShortDate(w.start_date)} – {formatShortDate(w.end_date)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {number(Number(w.quantity_sold))} {report.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{money(Number(w.net_sales))}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{money(Number(w.cogs))}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{money(Number(w.gross_profit))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>

        {/* Yang Perlu Diperhatikan */}
        <aside className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Yang perlu diperhatikan</h2>
          <div className="mt-3 rounded-lg border bg-muted/30 p-3.5 text-xs leading-relaxed text-muted-foreground">
            {report.note}
          </div>
          <dl className="mt-4 divide-y text-xs sm:text-sm">
            <div className="space-y-1 py-3">
              <dt className="text-muted-foreground">Penjualan harian tertinggi</dt>
              <dd className="font-medium tabular-nums">
                {report.best_day_date
                  ? `${formatDate(report.best_day_date)} · ${number(Number(report.best_day_quantity))} ${report.unit}`
                  : 'Belum ada penjualan'}
              </dd>
            </div>
            <div className="space-y-1 py-3">
              <dt className="text-muted-foreground">HPP per unit terkini</dt>
              <dd className="font-medium tabular-nums">{money(Number(report.current_hpp))}</dd>
            </div>
            <div className="space-y-1 py-3">
              <dt className="text-muted-foreground">Perubahan dari HPP sebelumnya</dt>
              <dd className="font-medium tabular-nums">
                {Number(report.hpp_change_pct) >= 0 ? '+' : ''}
                {percent(Number(report.hpp_change_pct))}
              </dd>
            </div>
            <div className="space-y-1 py-3">
              <dt className="text-muted-foreground">Target margin</dt>
              <dd className="font-medium tabular-nums">{percent(targetMarginPct)}</dd>
            </div>
            <div className="space-y-1 py-3">
              <dt className="text-muted-foreground">Posisi terhadap target</dt>
              <dd className="font-medium tabular-nums">
                {targetDiff >= 0
                  ? `${percent(targetDiff)} poin di atas target`
                  : `${percent(Math.abs(targetDiff))} poin di bawah target`}
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      {/* Komposisi Biaya & Rekonsiliasi Keuntungan */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Komposisi Harga ke Laba per Unit */}
        <section className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between gap-3 border-b pb-3">
            <div>
              <h2 className="font-semibold">Dari harga jual menjadi laba</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Komposisi biaya per 1 {report.unit}</p>
            </div>
            <Badge variant={report.unit_cost_breakdown.cost_source === 'REALIZED_BATCH' ? 'default' : 'secondary'} className="text-[10px]">
              {report.unit_cost_breakdown.cost_source === 'REALIZED_BATCH' ? 'Batch Realisasi' : 'Estimasi Resep'}
            </Badge>
          </div>
          <div className="mt-4 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Harga jual / unit</span>
              <span className="font-semibold tabular-nums">{money(Number(report.unit_cost_breakdown.selling_price))}</span>
            </div>
            <div className="flex justify-between py-1 pl-3 text-muted-foreground">
              <span>- Bahan baku (BOM)</span>
              <span className="tabular-nums">{money(Number(report.unit_cost_breakdown.material_cost))}</span>
            </div>
            <div className="flex justify-between py-1 pl-3 text-muted-foreground">
              <span>- Tenaga kerja</span>
              <span className="tabular-nums">{money(Number(report.unit_cost_breakdown.labor_cost))}</span>
            </div>
            <div className="flex justify-between py-1 pl-3 text-muted-foreground">
              <span>- Overhead</span>
              <span className="tabular-nums">{money(Number(report.unit_cost_breakdown.overhead_cost))}</span>
            </div>
            <div className="flex justify-between border-t py-2 font-medium">
              <span>Total HPP / unit</span>
              <span className="tabular-nums">{money(Number(report.unit_cost_breakdown.total_hpp))}</span>
            </div>
            <div className="flex justify-between border-t border-dashed py-2 font-semibold text-primary">
              <span>Laba kotor / unit</span>
              <span className="tabular-nums">{money(Number(report.unit_cost_breakdown.unit_gross_profit))}</span>
            </div>
          </div>
        </section>

        {/* Rekonsiliasi Keuntungan Periode */}
        <section className="rounded-xl border bg-card p-5">
          <div className="border-b pb-3">
            <h2 className="font-semibold">Rekonsiliasi keuntungan periode</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDate(report.range.start_date)} – {formatDate(report.range.end_date)}
            </p>
          </div>
          <div className="mt-4 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Penjualan kotor</span>
              <span className="tabular-nums">{money(Number(report.reconciliation.gross_sales))}</span>
            </div>
            <div className="flex justify-between py-1 pl-3 text-muted-foreground">
              <span>- Alokasi diskon</span>
              <span className="tabular-nums">({money(Number(report.reconciliation.discount_amount))})</span>
            </div>
            <div className="flex justify-between py-1 pl-3 text-muted-foreground">
              <span>- Retur</span>
              <span className="tabular-nums">({money(Number(report.reconciliation.return_amount))})</span>
            </div>
            <div className="flex justify-between border-t py-2 font-medium">
              <span>Penjualan bersih</span>
              <span className="tabular-nums">{money(Number(report.reconciliation.net_sales))}</span>
            </div>
            <div className="flex justify-between py-1 pl-3 text-muted-foreground">
              <span>- HPP terjual (COGS)</span>
              <span className="tabular-nums">({money(Number(report.reconciliation.cogs))})</span>
            </div>
            <div className="flex justify-between border-t border-dashed py-2 font-semibold text-primary">
              <span>Laba kotor</span>
              <span className="tabular-nums">{money(Number(report.reconciliation.gross_profit))}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Rincian Penjualan Harian */}
      <section className="rounded-xl border bg-card">
        <div className="border-b p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Rincian penjualan harian</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedWeek !== undefined
                ? `Menampilkan rincian hari untuk ${report.weeks[selectedWeek]?.label ?? 'Minggu dipilih'}`
                : `Menampilkan seluruh hari pada periode (${formatDate(report.range.start_date)} – ${formatDate(report.range.end_date)})`}
            </p>
          </div>
          {selectedWeek !== undefined && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectWeek(undefined)}
            >
              Tampilkan semua hari
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table aria-label="Rincian penjualan harian" className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                <th scope="col" className="px-4 py-3 font-medium text-muted-foreground text-right">Terjual</th>
                <th scope="col" className="px-4 py-3 font-medium text-muted-foreground text-right">Penjualan bersih</th>
                <th scope="col" className="px-4 py-3 font-medium text-muted-foreground text-right">HPP terjual</th>
                <th scope="col" className="px-4 py-3 font-medium text-muted-foreground text-right">Laba kotor</th>
              </tr>
            </thead>
            <tbody>
              {report.daily_rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                    Tidak ada transaksi pada rentang hari ini.
                  </td>
                </tr>
              ) : (
                report.daily_rows.map(r => (
                  <tr key={r.date} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{formatDate(r.date)}</td>
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                      {number(Number(r.quantity_sold))} {report.unit}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                      {money(Number(r.net_sales))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                      {money(Number(r.cogs))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                      {money(Number(r.gross_profit))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {totals && report.daily_rows.length > 0 && (
              <tfoot>
                <tr className="border-t bg-muted/20 font-semibold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                    {number(totals.quantity)} {report.unit}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                    {money(totals.netSales)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                    {money(totals.cogs)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                    {money(totals.profit)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  )
}

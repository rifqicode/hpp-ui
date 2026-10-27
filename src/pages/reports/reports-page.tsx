import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Download, ChevronRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ListFilters } from '@/components/ui/list-filters'
import { OverviewPeriodFilter } from '@/features/dashboard/components/overview-period-filter'
import type { OverviewRange } from '@/features/dashboard/types/overview'
import { dateLabel, localDay } from '@/features/dashboard/lib/dates'
import { useProductProfitabilityQuery } from '@/features/reports/hooks/use-reports-query'
import type { ProfitabilitySort } from '@/features/reports/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useAuthStore } from '@/store/use-auth-store'
import { products, batches, inventory, suppliers } from './reports-data'

const money = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
const number = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 1 })
const percent = (n: number) => `${number(n)}%`
const ALL_CATEGORIES = 'Semua kategori'
const liveToday = () => localDay(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone)
const shiftDay = (day: string, delta: number) => new Date(Date.parse(`${day}T12:00:00Z`) + delta * 86400000).toISOString().slice(0, 10)
const tabs = ['Keuntungan produk', 'Perubahan HPP', 'Produksi & waste', 'Persediaan', 'Supplier', 'Penjualan']
const dates = ['17 Okt', '18 Okt', '19 Okt', '20 Okt', '21 Okt', '22 Okt', '23 Okt']
type Detail = { title: string; description: string; rows: string[][] }

function DataTable({ headers, rows, onDetail, renderName, emptyMessage = 'Tidak ada data contoh yang cocok. Coba kata pencarian lain atau pilih semua kategori.' }: { headers: string[]; rows: string[][]; onDetail?: (index: number) => void; renderName?: (index: number) => ReactNode; emptyMessage?: string }) {
  return <div className="max-w-full overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b bg-muted/40">{headers.map(h => <th key={h} className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i} className="border-b last:border-0 hover:bg-muted/30">{row.map((cell, j) => <td key={j} className={`px-4 py-4 ${j === 0 ? 'font-medium' : 'whitespace-nowrap tabular-nums'}`}>{j === 0 && renderName ? renderName(i) : j === 0 && onDetail ? <button type="button" onClick={() => onDetail(i)} aria-haspopup="dialog" className="inline-flex min-h-11 items-center gap-2 rounded-md py-2 text-left font-semibold text-primary underline decoration-primary/50 underline-offset-4 hover:decoration-primary hover:decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><span>{cell}</span><ChevronRight aria-hidden="true" className="size-4 shrink-0" /></button> : cell}</td>)}</tr>)}</tbody></table>{!rows.length && <p className="p-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>}</div>
}

export default function ReportsPage() {
  const location = useLocation()
  const saved = location.state?.reportFilters as { period?: string; range?: OverviewRange; category?: string; search?: string; sort?: string } | undefined
  const permissions = useAuthStore(s => s.permissions)
  const [tab, setTab] = useState(0)
  const [period, setPeriod] = useState('7')
  const [range, setRange] = useState<OverviewRange>({ start_date: '2026-10-17', end_date: '2026-10-23' })
  const [category, setCategory] = useState(saved?.category ?? 'Semua kategori')
  const [search, setSearch] = useState(saved?.search ?? '')
  const [sort, setSort] = useState(saved?.sort ?? 'profit')
  const [detail, setDetail] = useState<Detail | null>(null)
  const activeStoreId = useAuthStore(s => s.activeStoreId)
  const [today] = useState(liveToday)
  const [livePeriod, setLivePeriod] = useState(saved?.period ?? '7')
  const [liveRange, setLiveRange] = useState<OverviewRange>(saved?.range ?? { start_date: shiftDay(today, -6), end_date: today })
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  useEffect(() => { const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300); return () => clearTimeout(timer) }, [search])
  const canViewReports = permissions.some(p => ['menu:reports', '*', 'ALL'].includes(p))
  const profitability = useProductProfitabilityQuery(activeStoreId, {
    start_date: liveRange.start_date, end_date: liveRange.end_date,
    category: category === ALL_CATEGORIES ? '' : category, search: debouncedSearch, sort: sort as ProfitabilitySort,
  }, tab === 0 && canViewReports)
  const report = profitability.data
  const liveItems = report?.items ?? []
  const liveErrorMessage = (profitability.error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message
  const days = dates.map((_, index) => index).filter(index => { const day = `2026-10-${17 + index}`; return day >= range.start_date && day <= range.end_date })
  const rangeLabel = tab === 0 ? `${dateLabel(liveRange.start_date)} – ${dateLabel(liveRange.end_date)}` : `${dateLabel(range.start_date)} – ${dateLabel(range.end_date)}`
  const selected = products.map(p => {
    const qty = days.reduce((sum, d) => sum + p.daily[d], 0)
    return { ...p, qty, revenue: qty * p.price, cogs: qty * p.cost, profit: qty * (p.price - p.cost), margin: (p.price - p.cost) / p.price * 100 }
  }).filter(p => (category === 'Semua kategori' || category === p.category) && p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'revenue' ? b.revenue - a.revenue : sort === 'margin' ? b.margin - a.margin : b.profit - a.profit)
  const dummyTotal = selected.reduce((a, p) => ({ revenue: a.revenue + p.revenue, cost: a.cost + p.cogs, profit: a.profit + p.profit, qty: a.qty + p.qty }), { revenue: 0, cost: 0, profit: 0, qty: 0 })
  const total = tab === 0 ? { revenue: Number(report?.summary.net_sales ?? 0), cost: Number(report?.summary.cogs ?? 0), profit: Number(report?.summary.gross_profit ?? 0), qty: Number(report?.summary.quantity_sold ?? 0) } : dummyTotal
  const selectedBatches = batches.filter(b => days.some(d => b.date === dates[d]) && selected.some(p => p.name === b.name))
  const target = selectedBatches.reduce((s, b) => s + b.target, 0)
  const good = selectedBatches.reduce((s, b) => s + b.good, 0)
  const visibleInventory = inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
  const visibleSuppliers = suppliers.filter(s => `${s.name} ${s.material}`.toLowerCase().includes(search.toLowerCase()))
  let headers: string[]
  let rows: string[][]
  let title: string
  let description: string
  if (tab === 0) {
    title = 'Produk mana yang paling menghasilkan?'; description = 'Penjualan setelah diskon dan retur, di luar pajak dan ongkos kirim. Hanya pesanan selesai atau diretur yang dihitung. Berdasarkan tanggal transaksi pada zona waktu toko.'
    headers = ['Produk', 'Terjual', 'Penjualan bersih', 'HPP terjual', 'Laba kotor', 'Margin']
    rows = liveItems.map(p => [p.display_name, `${number(Number(p.quantity_sold))} ${p.unit}`, money(Number(p.net_sales)), money(Number(p.cogs)), money(Number(p.gross_profit)), percent(Number(p.margin_pct))])
  } else if (tab === 1) {
    title = 'Apa yang membuat biaya produk naik?'; description = 'Biaya per unit pada batch contoh terkini dibanding batch sebelumnya. Tidak mengikuti filter periode penjualan.'
    headers = ['Produk', 'HPP sebelumnya', 'HPP terkini', 'Perubahan', 'Harga jual', 'Margin terkini']
    rows = selected.map(p => [p.name, money(p.previousCost), money(p.cost), `+${percent((p.cost / p.previousCost - 1) * 100)}`, money(p.price), percent(p.margin)])
  } else if (tab === 2) {
    title = 'Seberapa baik hasil produksi kita?'; description = 'Batch contoh berdasarkan tanggal selesai. HPP per unit = biaya batch dibagi hasil bagus.'
    headers = ['Batch / produk', 'Selesai', 'Target', 'Hasil bagus', 'Waste', 'HPP / pcs']
    rows = selectedBatches.map(b => [`${b.batch} · ${b.name}`, b.date, `${b.target} pcs`, `${b.good} pcs`, `${b.target - b.good} pcs`, money(b.cost / b.good)])
  } else if (tab === 3) {
    title = 'Bahan apa yang perlu disiapkan?'; description = 'Posisi stok contoh per 23 Oktober 2026. Kecukupan memakai rata-rata pemakaian harian contoh; tidak mengikuti periode penjualan.'
    headers = ['Bahan', 'Stok tersedia', 'Nilai stok', 'Cukup untuk', 'Pesanan masuk', 'Kedaluwarsa', 'Saran']
    rows = visibleInventory.map(i => [i.name, `${i.stock} ${i.unit}`, money(i.stock * i.cost), `${number(i.stock / i.usage)} hari`, `${i.incoming} ${i.unit}`, i.daysToExpiry === null ? 'Tidak berlaku' : `${i.daysToExpiry} hari lagi`, i.daysToExpiry !== null && i.daysToExpiry <= 2 ? 'Prioritaskan pemakaian' : i.stock / i.usage <= i.lead + 1 ? (i.incoming ? 'Pantau pesanan masuk' : 'Siapkan pembelian') : i.stock / i.usage > 20 ? 'Tinjau stok berlebih' : 'Stok cukup'])
  } else if (tab === 4) {
    title = 'Supplier mana yang paling bisa diandalkan?'; description = 'Rekap pembelian contoh 1–23 Oktober 2026. Harga bahan sudah disetarakan per satuan; belum termasuk ongkir.'
    headers = ['Supplier / bahan', 'Harga satuan', 'Perubahan harga', 'Diterima / dipesan', 'Tepat waktu']
    rows = visibleSuppliers.map(s => [`${s.name} · ${s.material}`, `${money(s.price)} / ${s.unit}`, percent((s.price / s.old - 1) * 100), `${s.received} / ${s.ordered} ${s.unit}`, `${s.ontime}/${s.deliveries} pengiriman (${percent(s.ontime / s.deliveries * 100)})`])
  } else {
    title = 'Kapan penjualan paling ramai?'; description = 'Penjualan bersih per hari untuk produk yang dipilih. Klik tanggal untuk melihat kontribusi tiap produk.'
    headers = ['Tanggal', 'Unit terjual', 'Penjualan bersih', 'HPP terjual', 'Laba kotor']
    rows = days.map(d => { const qty = selected.reduce((s, p) => s + p.daily[d], 0); const rev = selected.reduce((s, p) => s + p.daily[d] * p.price, 0); const cost = selected.reduce((s, p) => s + p.daily[d] * p.cost, 0); return [dates[d] + ' 2026', `${qty} pcs`, money(rev), money(cost), money(rev - cost)] })
  }
  const peak = useMemo(() => products.reduce((a, p) => a + p.daily[5] * p.price, 0), [])
  const exportCsv = () => {
    const liveCsv = tab === 0
    const csvRows: (string | number)[][] = liveCsv
      ? liveItems.map(p => [p.display_name, p.category, Number(p.quantity_sold), p.unit, Number(p.net_sales), Number(p.cogs), Number(p.gross_profit), Number(p.margin_pct)])
      : rows
    const csvHeaders = liveCsv ? ['Produk', 'Kategori', 'Terjual', 'Satuan', 'Penjualan bersih', 'HPP terjual', 'Laba kotor', 'Margin (%)'] : headers
    const csv = [...(liveCsv ? [] : [['DATA DUMMY — bukan transaksi toko']]), [tabs[tab]], [tab === 3 ? 'Posisi 23 Oktober 2026' : tab === 4 ? '1–23 Oktober 2026' : tab === 1 ? 'Batch terkini versus sebelumnya' : rangeLabel], csvHeaders, ...csvRows].map(row => row.map(c => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = liveCsv ? `laporan-keuntungan-produk-${liveRange.start_date}-${liveRange.end_date}.csv` : `dummy-laporan-${tab + 1}.csv`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const showDetail = (i: number) => {
    if (tab === 1) {
      const p = selected[i]
      setDetail({ title: p.name, description: `Analisis dummy · ${p.category}`, rows: [['Catatan owner', p.note], ['Harga jual / unit', money(p.price)], ['HPP / unit', money(p.cost)], ['Laba kotor / unit', money(p.price - p.cost)], ['Margin', percent(p.margin)], ['Terjual pada periode pilihan', `${p.qty} pcs`], ['Kontribusi laba periode', money(p.profit)]] })
    } else if (tab === 2) {
      const b = selectedBatches[i]
      setDetail({ title: b.batch, description: `Batch dummy · ${b.name}`, rows: [['Hasil bagus', `${b.good} dari ${b.target} pcs`], ['Waste', `${b.target - b.good} pcs`], ['Catatan produksi', b.reason], ['Biaya batch', money(b.cost)], ['HPP hasil bagus / pcs', money(b.cost / b.good)]] })
    } else if (tab === 5) {
      const d = days[i]
      setDetail({ title: `${dates[d]} 2026`, description: 'Rincian penjualan dummy per produk. Seluruh kuantitas pada contoh memakai satuan pcs.', rows: selected.map(p => [p.name, `${p.daily[d]} pcs · ${money(p.daily[d] * p.price)}`]) })
    }
  }
  if (!permissions.some(p => ['menu:reports', '*', 'ALL'].includes(p))) return <p className="rounded-xl border p-6 text-sm text-muted-foreground">Akses laporan belum diberikan untuk akun ini.</p>
  return <div className="min-w-0 space-y-5 pb-8">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Laporan</h1><p className="mt-1 text-sm text-muted-foreground">Lihat hasil bisnis, telusuri penyebabnya, tentukan langkah berikutnya.</p></div><Button variant="outline" onClick={exportCsv} disabled={tab === 0 && (!report || profitability.isError)}><Download className="size-4" />{tab === 0 ? 'Ekspor CSV' : 'Ekspor CSV dummy'}</Button></header>
    {tab !== 0 && <div className="flex items-start gap-3 rounded-lg border border-primary/25 bg-primary/5 p-4"><Info className="mt-0.5 size-4 shrink-0 text-primary" /><div className="text-sm"><p className="font-semibold">Mode review · seluruh angka adalah data dummy</p><p className="mt-1 text-muted-foreground">Contoh usaha bakery & minuman, terpisah dari data toko. Coba kategori, periode, detail, dan ekspor untuk mengevaluasi kebutuhan laporan.</p></div></div>}
    <nav aria-label="Jenis laporan" className="flex gap-1 overflow-x-auto border-b pb-1">{tabs.map((name, i) => <button key={name} type="button" aria-current={tab === i ? 'page' : undefined} onClick={() => { setTab(i); setSearch(''); setCategory('Semua kategori') }} className={`min-h-11 shrink-0 rounded-t-md border-b-2 px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${tab === i ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:bg-muted'}`}>{name}</button>)}</nav>
    {tab === 0 && <OverviewPeriodFilter range={liveRange} today={today} preset={livePeriod} disabled={false} onApply={(next, preset) => { setLiveRange(next); setLivePeriod(preset) }} />}
    {[2, 5].includes(tab) && <><OverviewPeriodFilter range={range} today="2026-10-23" preset={period} disabled={false} onApply={(next, preset) => { setRange(next); setPeriod(preset) }} /><p className="text-xs text-muted-foreground">Tanggal acuan dummy: 23 Oktober 2026. Data contoh tersedia 17–23 Oktober; tanggal di luar cakupan belum memiliki data.</p></>}
    <ListFilters label="Filter laporan" search={{ label: tab === 3 ? 'Cari bahan' : tab === 4 ? 'Cari supplier atau bahan' : 'Cari produk', placeholder: tab === 3 ? 'Cari nama bahan...' : tab === 4 ? 'Cari supplier atau bahan...' : 'Cari nama produk...', value: search, onChange: setSearch }} filters={[
      ...(tab !== 3 && tab !== 4 ? [{ id: 'category', label: 'Kategori', value: category, onChange: setCategory, options: (tab === 0 ? [ALL_CATEGORIES, ...(report?.categories ?? []), ...(category !== ALL_CATEGORIES && !report?.categories.includes(category) ? [category] : [])] : [ALL_CATEGORIES, 'Pastry', 'Bakery', 'Minuman']).map(value => ({ value, label: value })) }] : []),
      ...(tab === 0 ? [{ id: 'sort', label: 'Urutkan', value: sort, onChange: setSort, options: [{ value: 'profit', label: 'Laba terbesar' }, { value: 'revenue', label: 'Penjualan terbesar' }, { value: 'margin', label: 'Margin tertinggi' }] }] : []),
    ]} summary={tab === 0 && !report ? 'Memuat data…' : `${rows.length} ${tab === 2 ? 'batch' : tab === 3 ? 'bahan' : tab === 4 ? 'supplier' : tab === 5 ? 'hari' : 'produk'} ditampilkan`} isFetching={tab === 0 && profitability.isFetching && !profitability.isLoading} hasFilters={!!search || category !== ALL_CATEGORIES || sort !== 'profit'} onReset={() => { setSearch(''); setCategory('Semua kategori'); setSort('profit') }} />
    {[0, 2, 5].includes(tab) && <div className="grid divide-y rounded-xl border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">{(tab === 2 ? [['Target produksi', `${target} pcs`], ['Hasil bagus', `${good} pcs`], ['Waste', `${target - good} pcs${target ? ` · ${percent((target - good) / target * 100)}` : ''}`]] : (tab === 0 && !report ? [['Penjualan bersih', '—'], ['HPP terjual', '—'], ['Laba kotor', '—']] : [['Penjualan bersih', money(total.revenue)], ['HPP terjual', money(total.cost)], ['Laba kotor', money(total.profit)]])).map(([label, value]) => <div key={label} className="p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 break-words text-2xl font-semibold tracking-tight tabular-nums">{value}</p></div>)}</div>}
    <section className="overflow-hidden rounded-xl border bg-card"><div className="border-b p-4 sm:p-5"><h2 className="font-semibold">{title}</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p></div>{tab === 5 && <div className="space-y-3 border-b p-4 sm:p-5" aria-label="Perbandingan penjualan harian">{days.map(d => { const revenue = selected.reduce((s, p) => s + p.daily[d] * p.price, 0); return <div key={d} className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 text-xs sm:grid-cols-[3.5rem_minmax(0,1fr)_8rem]"><span className="text-muted-foreground">{dates[d]}</span><div className="h-5 overflow-hidden rounded bg-muted"><div className="h-full rounded bg-primary" style={{ width: `${revenue / peak * 100}%` }} /></div><span className="col-start-2 tabular-nums sm:col-start-auto sm:text-right">{money(revenue)}</span></div> })}</div>}{tab === 0 && !report && profitability.isError ? <div role="alert" className="space-y-3 p-8 text-center text-sm"><p className="font-medium">Laporan belum bisa dimuat.</p><p className="text-muted-foreground">{liveErrorMessage ?? 'Terjadi kesalahan saat mengambil data. Coba lagi.'}</p><Button variant="outline" onClick={() => profitability.refetch()}>Coba lagi</Button></div> : tab === 0 && profitability.isLoading ? <p role="status" className="p-8 text-center text-sm text-muted-foreground">Memuat laporan…</p> : <DataTable emptyMessage={tab === 0 ? 'Belum ada produk yang cocok pada periode ini. Coba ubah tanggal, kategori, atau kata pencarian.' : undefined} headers={headers} rows={rows} onDetail={[1, 2, 5].includes(tab) ? showDetail : undefined} renderName={tab === 0 ? i => <Link to={`/reports/products/${liveItems[i].variant_id}?period=${livePeriod}&start_date=${liveRange.start_date}&end_date=${liveRange.end_date}`} state={{ reportFilters: { period: livePeriod, range: liveRange, category, search, sort } }} className="group inline-flex min-h-11 items-center gap-2 rounded-md py-2 font-semibold text-primary underline decoration-primary/50 underline-offset-4 hover:decoration-primary hover:decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><span>{liveItems[i].display_name}</span><ChevronRight aria-hidden="true" className="size-4 shrink-0" /></Link> : undefined} />}</section>
    <aside className="rounded-xl border bg-muted/20 p-4 sm:p-5"><h2 className="text-sm font-semibold">Catatan untuk keputusan owner</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tab === 0 ? 'Bandingkan kontribusi laba dan volume penjualan. Klik nama produk untuk melihat grafik dan rincian keuntungan; margin tinggi saja belum berarti kontribusi laba terbesar.' : tab === 1 ? 'Kenaikan HPP pada contoh paling terasa di Cookies Box dan Croissant Butter. Validasi harga bahan dan hasil produksi sebelum menentukan perubahan harga jual.' : tab === 2 ? 'Telusuri batch dengan hasil bagus rendah. Waste di sini dihitung dalam pcs; biaya batch sudah dibebankan ke hasil bagus, sehingga jangan dikurangkan lagi dari laba penjualan.' : tab === 3 ? 'Dahulukan pemakaian susu yang mendekati kedaluwarsa. Butter cukup 4 hari dengan lead time 3 hari; pantau kedatangan pesanan 10 kg sebelum membeli lagi.' : tab === 4 ? 'Bandingkan bahan yang sama: butter Dairy Nusantara lebih murah, tetapi ketepatan kirimnya 4 dari 5 pengiriman. Periksa juga biaya kirim dan kualitas penerimaan.' : 'Gunakan pola hari ramai untuk mengatur produksi dan jadwal staf. Angka grafik dan tabel berasal dari data contoh yang sama.'}</p></aside>
    <p className="text-xs leading-relaxed text-muted-foreground">Laba kotor = penjualan bersih − HPP barang terjual. Belum menunjukkan laba bersih atau saldo kas. Target margin 40% pada catatan produk hanya asumsi contoh.</p>
    <Dialog open={!!detail} onOpenChange={open => { if (!open) setDetail(null) }}><DialogContent><DialogHeader><DialogTitle>{detail?.title}</DialogTitle><DialogDescription>{detail?.description}</DialogDescription></DialogHeader><dl className="divide-y">{detail?.rows.map(([label, value]) => <div key={label} className="grid gap-1 py-3 text-sm sm:grid-cols-2"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium sm:text-right">{value}</dd></div>)}</dl></DialogContent></Dialog>
  </div>
}

import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowUpRight, Banknote, CalendarDays, CircleDollarSign, ClipboardList, Factory, Package, Receipt, RefreshCw, ShoppingBag, Store, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/use-auth-store';
import { dashboardService } from '@/features/dashboard/services/dashboard-service';
import type { OverviewAlert, OverviewAttention, OverviewRange, Section } from '@/features/dashboard/types/overview';
import { OverviewPeriodFilter } from '@/features/dashboard/components/overview-period-filter';
import { localDay } from '@/features/dashboard/lib/dates';
import { SalesTrend } from '@/features/dashboard/components/sales-trend';
import { OverviewMetrics } from '@/features/dashboard/components/overview-metrics';
import { SectionMessage } from '@/features/dashboard/components/section-message';

function change(current: string | number | null | undefined, previous: string | number | null | undefined) {
  if (previous == null || Number(previous) <= 0 || current == null) return 'Belum ada pembanding';
  const delta = (Number(current) - Number(previous)) / Number(previous) * 100;
  return `${delta > 0 ? '+' : ''}${delta.toLocaleString('id-ID', { maximumFractionDigits: 1 })}% dari periode sebelumnya`;
}

const alertLabels: Record<string, string> = { OUT: 'Bahan habis / tidak tersedia', EXPIRED: 'Sudah kedaluwarsa', EXPIRING: 'Segera kedaluwarsa', PURCHASE_REQUEST: 'Permintaan pembelian', PURCHASE_ORDER: 'Menunggu penerimaan', IN_PROGRESS: 'Sedang diproduksi', QUEUED: 'Menunggu produksi' };

function AttentionGroup({ title, section, kind, timezone }: {
  title: string; section: Section<OverviewAttention>; kind: 'inventory' | 'purchases' | 'production'; timezone: string;
}) {
  const Icon = kind === 'inventory' ? Package : kind === 'purchases' ? ClipboardList : Factory;
  const detail = (item: OverviewAlert) => kind === 'inventory' ? `/inventory/stocks/${item.id}` : kind === 'purchases' ? `/inventory/purchase-orders/${item.id}` : `/production/batches/${item.id}`;
  return <section className="border-b py-4 last:border-0 last:pb-0">
    <div className="flex items-center gap-2 text-sm font-medium"><Icon className="size-4 text-muted-foreground" aria-hidden="true" /><h3>{title}</h3>{section.data && <span className="ml-auto tabular-nums text-muted-foreground">{section.data.count}</span>}</div>
    {section.status !== 'ok' ? <SectionMessage status={section.status} /> : section.data?.items.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">Tidak ada yang perlu ditindak.</p> :
      <ul className="mt-2 divide-y">{section.data?.items.map((item, i) => <li key={`${item.kind}-${item.id}-${i}`}>
        <Link to={detail(item)} className="group flex items-center justify-between gap-3 rounded-md py-2.5 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring">
          <span className="min-w-0"><span className="block truncate text-sm font-medium group-hover:text-primary">{item.name}</span><span className={`mt-0.5 block text-xs ${item.kind === 'OUT' || item.kind === 'EXPIRED' ? 'text-destructive' : 'text-muted-foreground'}`}>{alertLabels[item.kind] ?? item.kind}{item.date && kind === 'inventory' ? ` · ${new Date(item.date).toLocaleDateString('id-ID', { timeZone: timezone, day: 'numeric', month: 'short' })}` : ''}</span></span>
          <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Link>
      </li>)}</ul>}
    {section.status === 'ok' && (section.data?.count ?? 0) > 0 &&
      <Link className="mt-2 inline-block rounded text-xs font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring" to={kind === 'inventory' ? '/inventory/stocks' : kind === 'purchases' ? '/inventory/purchase-orders' : '/production/batches'}>Lihat semua {title.toLowerCase()}</Link>}
  </section>;
}

export default function DashboardPage() {
  const { activeStoreId: storeId, activeStoreName: storeName, permissions, user } = useAuthStore();
  const [params, setParams] = useSearchParams();
  const start = params.get('start_date') ?? undefined;
  const end = params.get('end_date') ?? undefined;
  const permissionKey = [...permissions].sort().join(',');
  const can = (code: string) => permissions.includes(code) || permissions.includes('*') || permissions.includes('ALL');
  const query = useQuery({
    queryKey: ['dashboard-overview', storeId, user?.id, permissionKey, start, end],
    queryFn: ({ signal }) => dashboardService.getOverview(storeId!, { start_date: start, end_date: end }, signal),
    enabled: !!storeId && can('menu:dashboard'), staleTime: 0, retry: 1,
  });
  const data = query.data?.store_id === storeId ? query.data : undefined;
  const currency = data?.currency || 'IDR';
  const money = useMemo(() => {
    let formatter: Intl.NumberFormat;
    try { formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }); }
    catch { formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }); }
    return (value: string | number | null | undefined) => value == null ? 'Belum tersedia' : formatter.format(Number(value));
  }, [currency]);
  const apply = (range: OverviewRange, preset: string) => {
    setParams(previous => { const next = new URLSearchParams(previous); next.set('start_date', range.start_date); next.set('end_date', range.end_date); next.set('period', preset); return next; });
  };
  const timezone = data?.timezone ?? 'Asia/Jakarta';
  const today = localDay(new Date(), timezone);
  const current = data?.sales.data?.current;
  const previous = data?.sales.data?.previous;
  const comparison = (value: string | number | null | undefined, old: string | number | null | undefined) =>
    !data?.comparison_range ? 'Periode berjalan' : change(value, old);
  const cards = [
    { title: 'Penjualan Bersih', value: money(current?.net_sales), caption: comparison(current?.net_sales, previous?.net_sales), icon: Banknote, tone: 'bg-blue-500/10 text-blue-700 dark:text-blue-300', status: data?.sales.status },
    { title: 'Laba Kotor', value: money(current?.gross_profit), caption: current?.margin_pct != null ? `Margin ${Number(current.margin_pct).toLocaleString('id-ID', { maximumFractionDigits: 2 })}% · sebelum biaya operasional` : 'Penjualan bersih dikurangi HPP terjual', icon: CircleDollarSign, tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', status: data?.sales.status === 'ok' ? data.profit_status : data?.sales.status },
    { title: 'Jumlah Transaksi', value: current?.transactions.toLocaleString('id-ID'), caption: comparison(current?.transactions, previous?.transactions), icon: Receipt, tone: 'bg-primary/10 text-primary', status: data?.sales.status },
    { title: 'Rata-rata Transaksi', value: money(current?.average_order), caption: comparison(current?.average_order, previous?.average_order), icon: ShoppingBag, tone: 'bg-amber-500/10 text-amber-800 dark:text-amber-300', status: data?.sales.status },
  ];
  return <div className="flex min-w-0 flex-col gap-5 pb-8">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold tracking-tight">Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Ringkasan bisnis dan aktivitas toko Anda.</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Store className="size-3.5" aria-hidden="true" />{storeName || 'Toko aktif'}</span>{data && <span>Diperbarui {new Date(data.as_of).toLocaleString('id-ID', { timeZone: timezone, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {timezone}</span>}</div>
      </div>
      <Button variant="outline" disabled={query.isFetching || !storeId || !can('menu:dashboard')} onClick={() => query.refetch()}><RefreshCw className={`size-4 ${query.isFetching ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />Perbarui</Button>
    </header>
    {!storeId ? <p className="rounded-xl border p-6 text-sm text-muted-foreground">Pilih toko untuk melihat dashboard.</p> : !can('menu:dashboard') ? <p className="rounded-xl border p-6 text-sm text-muted-foreground">Akses dashboard belum diberikan.</p> : <>
      <OverviewPeriodFilter range={start && end ? { start_date: start, end_date: end } : data?.range} today={today} preset={params.get('period') ?? (start || end ? 'custom' : '7')} disabled={query.isPending} onApply={apply} />
      {query.isError && <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"><AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" /><div><p className="font-medium">Dashboard belum bisa diperbarui.</p><p className="mt-1 text-xs text-muted-foreground">{data ? 'Data sebelumnya masih ditampilkan. Periksa waktu pembaruannya.' : 'Coba perbarui lagi atau pilih rentang tanggal yang valid.'}</p><Button variant="ghost" size="sm" className="mt-2" onClick={() => { setParams({}); }}>Reset periode</Button></div></div>}
      {query.isPending ? <div role="status" aria-label="Memuat dashboard" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0,1,2,3].map(i => <div key={i} className="h-36 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />)}</div> : data && <>
        <OverviewMetrics cards={cards} />
        <p className="-mt-2 text-xs leading-relaxed text-muted-foreground">Transaksi selesai, berdasarkan tanggal transaksi, setelah diskon dan retur, di luar pajak. Retur dapat memperbarui angka periode sebelumnya.</p>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
          <div className="grid min-w-0 gap-5">
            <Card className="shadow-none"><CardContent className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">Tren Penjualan</h2><p className="mt-1 text-xs text-muted-foreground">Penjualan bersih setiap hari dalam periode terpilih.</p></div><TrendingUp className="size-4 shrink-0 text-primary" aria-hidden="true" /></div>{data.sales.status !== 'ok' ? <SectionMessage status={data.sales.status} /> : <SalesTrend days={data.sales.data?.trend ?? []} money={money} />}</CardContent></Card>
            <Card className="shadow-none"><CardContent className="p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-semibold">Produk Penyumbang Penjualan</h2><p className="mt-1 text-xs text-muted-foreground">Lima produk dengan nilai penjualan bersih terbesar.</p></div>{can('orders:read') && <Link to="/sales/history" className="rounded text-xs font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring">Lihat transaksi</Link>}</div>
              {data.products.status !== 'ok' ? <SectionMessage status={data.products.status} /> : !data.products.data?.length ? <p className="py-8 text-center text-sm text-muted-foreground">Belum ada produk terjual di periode ini.</p> : <ol className="mt-4 divide-y">{data.products.data.map((product, i) => <li key={product.variant_id} className="flex items-center gap-3 py-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">{i+1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{Number(product.quantity).toLocaleString('id-ID', { maximumFractionDigits: 4 })} {product.unit} terjual</p></div><span className="shrink-0 text-right text-sm font-semibold tabular-nums">{money(product.net_sales)}</span></li>)}</ol>}
            </CardContent></Card>
          </div>
          <Card className="shadow-none"><CardContent className="p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Perlu Ditindak</h2><CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" /></div><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Kondisi saat ini, tidak mengikuti filter tanggal.</p>
            <AttentionGroup title="Bahan baku" section={data.inventory} kind="inventory" timezone={timezone} />
            <AttentionGroup title="Pembelian" section={data.purchases} kind="purchases" timezone={timezone} />
            <AttentionGroup title="Produksi" section={data.production} kind="production" timezone={timezone} />
          </CardContent></Card>
        </div>
      </>}
    </>}
  </div>;
}

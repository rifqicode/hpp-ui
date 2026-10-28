// import { SaleCorrectionPanel } from '@/features/sales/components/sale-correction-panel';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Receipt, Printer, Calendar, RefreshCw, ChevronRight, AlertCircle, Wallet, ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { settingsService } from '@/features/settings/services/settings-service';

import {
  useSalesTransactionsQuery,
  useSalesSummaryQuery,
} from '../../features/sales/hooks/use-sales-query';
import type { Sale, SaleQuery } from '../../features/sales/types';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { ListFilters } from '@/components/ui/list-filters';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from '../../components/ui/dialog';
import { TablePagination } from '../../components/ui/table-pagination';
import { CurrencyText } from '@/components/ui/currency-text';

type DatePreset = 'TODAY' | '7D' | 'THIS_MONTH' | 'ALL_TIME' | 'CUSTOM';

const DATE_PRESETS = [
  { value: 'TODAY', label: 'Hari Ini' },
  { value: '7D', label: '7 Hari Terakhir' },
  { value: 'THIS_MONTH', label: 'Bulan Ini' },
  { value: 'ALL_TIME', label: 'Semua Waktu' },
] as const;

function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getTodayString(): string {
  return toLocalDateString(new Date());
}

function getSevenDayStartString(): string {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return toLocalDateString(date);
}

function getStartOfMonthString(): string {
  const date = new Date();
  date.setDate(1);
  return toLocalDateString(date);
}

function formatFilterDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function SaleStatusBadge({ sale }: { sale: Sale }) {
  const status = sale.status === 'CANCELLED'
    ? { label: 'Dibatalkan', className: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300' }
    : sale.status === 'RETURNED' || sale.refundedAmount
    ? { label: sale.status === 'RETURNED' ? 'Diretur seluruhnya' : 'Retur sebagian', className: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300' }
    : sale.status === 'IN_PROGRESS'
    ? { label: 'Dalam proses', className: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300' }
    : { label: 'Selesai', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' };
  return <Badge variant="outline" className={`whitespace-nowrap text-[10px] font-medium ${status.className}`}>{status.label}</Badge>;
}

export default function TransactionHistoryPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterMethod, setFilterMethod] = React.useState<string>('ALL');
  const [filterStatus, setFilterStatus] = React.useState<string>('ALL');

  const [page, setPage] = React.useState(1);
  const perPage = 10;

  // Date Range Controls
  const [datePreset, setDatePreset] = React.useState<DatePreset>('THIS_MONTH');
  const [startDate, setStartDate] = React.useState<string>(getStartOfMonthString());
  const [endDate, setEndDate] = React.useState<string>(getTodayString());

  const [showCustomDates, setShowCustomDates] = React.useState(false);
  const [draftStartDate, setDraftStartDate] = React.useState(getStartOfMonthString);
  const [draftEndDate, setDraftEndDate] = React.useState(getTodayString);
  const customDateError = !draftStartDate || !draftEndDate
    ? 'Lengkapi tanggal mulai dan tanggal akhir.'
    : draftStartDate > draftEndDate ? 'Tanggal akhir harus sama atau setelah tanggal mulai.' : '';
  const periodLabel = datePreset === 'ALL_TIME' ? 'Seluruh riwayat transaksi'
    : startDate === endDate ? formatFilterDate(startDate)
    : `${formatFilterDate(startDate)} – ${formatFilterDate(endDate)}`;

  // Selected sale for detail dialog
  const [selectedSale, setSelectedSale] = React.useState<Sale | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  const { data: storeProfile } = useQuery({
    queryKey: ['store-profile'],
    queryFn: () => settingsService.getStoreProfile(),
    staleTime: 5 * 60 * 1000,
  });
  const receiptConfig = storeProfile?.receipt_config || storeProfile?.receiptConfig;

  const query: SaleQuery = React.useMemo(() => {
    const q: SaleQuery = {
      page, per_page: perPage, status: filterStatus !== 'ALL' ? filterStatus : undefined,
      search: searchQuery.trim() || undefined,
      payment_method: filterMethod !== 'ALL' ? filterMethod : undefined,
    };
    if (datePreset !== 'ALL_TIME') {
      if (startDate) q.start_date = startDate;
      if (endDate) q.end_date = endDate;
    }
    return q;
  }, [searchQuery, filterMethod, filterStatus, page, datePreset, startDate, endDate]);

  const {
    data: salesPage,
    isLoading: isSalesLoading,
    isFetching: isSalesFetching,
    isError: isSalesError,
    refetch: refetchSales,
  } = useSalesTransactionsQuery(query);
  const sales = salesPage?.data || [];

  const {
    data: summary = null,
    isLoading: isSummaryLoading,
    isFetching: isSummaryFetching,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useSalesSummaryQuery(query);

  const loading = isSalesLoading || isSummaryLoading;

  const fetchSalesData = React.useCallback(async () => {
    await Promise.all([refetchSales(), refetchSummary()]);
  }, [refetchSales, refetchSummary]);

  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let isCancelled = false;

    const scheduleNext = () => {
      if (isCancelled) return;
      timeoutId = setTimeout(async () => {
        try {
          await fetchSalesData();
        } catch {
          // Keep retry loop resilient on network failure
        } finally {
          if (!isCancelled) {
            scheduleNext();
          }
        }
      }, 5000);
    };

    scheduleNext();

    return () => {
      isCancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fetchSalesData]);

  const handlePresetChange = (preset: DatePreset) => {
    setPage(1);
    setShowCustomDates(false);
    setDatePreset(preset);
    const today = getTodayString();
    if (preset === 'TODAY') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === '7D') {
      setStartDate(getSevenDayStartString());
      setEndDate(today);
    } else if (preset === 'THIS_MONTH') {
      setStartDate(getStartOfMonthString());
      setEndDate(today);
    } else if (preset === 'ALL_TIME') {
      setStartDate('');
      setEndDate('');
    }
  };

  const totalPages = salesPage?.total_pages || 1;
  const hasFilters = Boolean(searchQuery.trim()) || filterStatus !== 'ALL' || filterMethod !== 'ALL' || datePreset !== 'THIS_MONTH';

  const resetFilters = () => {
    setSearchQuery('');
    setFilterMethod('ALL');
    setFilterStatus('ALL');
    handlePresetChange('THIS_MONTH');
  };

  const openCustomDates = () => {
    if (showCustomDates) { setShowCustomDates(false); return; }
    setDraftStartDate(startDate || getStartOfMonthString());
    setDraftEndDate(endDate || getTodayString());
    setShowCustomDates(true);
  };

  const applyCustomDates = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (customDateError) return;
    setStartDate(draftStartDate);
    setEndDate(draftEndDate);
    setDatePreset('CUSTOM');
    setPage(1);
    setShowCustomDates(false);
  };

  const handleOpenDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full min-w-0 space-y-5 pb-8">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Transaction List</h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Pantau penjualan, cek pembayaran, dan buka detail transaksi.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] items-center gap-1.5 font-normal">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Auto 5s
          </Badge>
          <Button variant="outline" onClick={fetchSalesData} disabled={isSalesFetching || isSummaryFetching} className="h-10 gap-2 text-xs">
            <RefreshCw className={`size-3.5 ${isSalesFetching || isSummaryFetching ? 'animate-spin motion-reduce:animate-none' : ''}`} />Refresh
          </Button>
          <Button asChild className="h-10 gap-2 text-xs"><Link to="/sales/pos"><ShoppingCart className="size-4" />Buka Kasir (POS)</Link></Button>
        </div>
      </header>

      {isSummaryError && <p role="alert" className="rounded-xl border p-3 text-xs text-muted-foreground">Ringkasan penjualan belum bisa dimuat. Klik Refresh untuk mencoba lagi.</p>}
      {summary && !isSummaryError && (
        <section aria-label="Ringkasan transaksi" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              label: 'Total Penjualan', value: <CurrencyText value={summary.totalRevenue} />,
              hint: 'Sesuai periode dan filter', icon: Wallet,
              color: 'text-primary', background: 'bg-primary/10',
            },
            {
              label: 'Jumlah Transaksi', value: summary.totalTransactions.toLocaleString('id-ID'),
              hint: 'Transaksi pada periode dan filter ini', icon: ShoppingBag,
              color: 'text-emerald-600 dark:text-emerald-400', background: 'bg-emerald-50 dark:bg-emerald-950/40',
            },
          ].map((metric) => (
            <Card key={metric.label} className="min-w-0 border-border/80 bg-card px-4 py-3 shadow-2xs">
              <CardContent className="flex items-center justify-between gap-2 p-0">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                  <p className={`text-xl font-bold tracking-tight tabular-nums [overflow-wrap:anywhere] ${metric.color}`}>{metric.value}</p>
                  <p className="text-[11px] text-muted-foreground">{metric.hint}</p>
                </div>
                <span className={`shrink-0 rounded-xl p-2.5 ${metric.background} ${metric.color}`}>
                  <metric.icon className="size-5" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <ListFilters
        label="Filter transaksi"
        search={{ label: 'Cari transaksi', placeholder: 'Cari invoice, pelanggan, atau produk...', value: searchQuery, onChange: (value) => { setSearchQuery(value); setPage(1); } }}
        filters={[
          { id: 'status', label: 'Status transaksi', value: filterStatus, onChange: (value) => { setFilterStatus(value); setPage(1); }, options: [
            { value: 'ALL', label: 'Semua status' }, { value: 'COMPLETED', label: 'Selesai' }, { value: 'IN_PROGRESS', label: 'Dalam proses' }, { value: 'CANCELLED', label: 'Dibatalkan' }, { value: 'RETURNED', label: 'Diretur' },
          ] },
          { id: 'payment', label: 'Metode pembayaran', value: filterMethod, onChange: (value) => { setFilterMethod(value); setPage(1); }, options: [
            { value: 'ALL', label: 'Semua metode bayar' }, { value: 'CASH', label: 'Tunai' }, { value: 'QRIS', label: 'QRIS' }, { value: 'TRANSFER', label: 'Transfer bank' }, { value: 'DEBIT', label: 'Kartu debit' },
          ] },
        ]}
        hasFilters={hasFilters} onReset={resetFilters} isFetching={(isSalesFetching || isSummaryFetching) && !loading} fetchingLabel="Memperbarui transaksi"
      >
        <div className="space-y-3 border-t pt-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Calendar className="size-4" aria-hidden="true" /></span>
              <div><p className="text-[11px] text-muted-foreground">Periode transaksi</p><p className="mt-0.5 text-xs font-semibold" aria-live="polite">{periodLabel}</p></div>
            </div>
            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted/50 p-1" aria-label="Pilihan periode">
              {DATE_PRESETS.map((preset) => <button key={preset.value} type="button" aria-pressed={datePreset === preset.value && !showCustomDates} onClick={() => handlePresetChange(preset.value)}
                className={`min-h-9 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${datePreset === preset.value && !showCustomDates ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'}`}>{preset.label}</button>)}
              <button type="button" aria-expanded={showCustomDates} aria-controls="transaction-custom-dates" aria-pressed={datePreset === 'CUSTOM' || showCustomDates} onClick={openCustomDates}
                className={`flex min-h-9 items-center gap-1 rounded-md px-2.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${datePreset === 'CUSTOM' || showCustomDates ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Pilih tanggal<ChevronRight className={`size-3 transition-transform motion-reduce:transition-none ${showCustomDates ? 'rotate-90' : ''}`} /></button>
            </div>
          </div>
          {showCustomDates && <form id="transaction-custom-dates" onSubmit={applyCustomDates} noValidate className="rounded-xl border bg-muted/20 p-3">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
              <div className="min-w-0 space-y-1.5"><label htmlFor="transaction-start-date" className="block text-xs font-medium">Dari tanggal</label><Input id="transaction-start-date" type="date" value={draftStartDate} onChange={(event) => setDraftStartDate(event.target.value)} aria-describedby={customDateError ? 'transaction-date-error' : undefined} aria-invalid={!draftStartDate || draftStartDate > draftEndDate} className="h-11 w-full min-w-0 bg-background text-sm" /></div>
              <div className="min-w-0 space-y-1.5"><label htmlFor="transaction-end-date" className="block text-xs font-medium">Sampai tanggal</label><Input id="transaction-end-date" type="date" min={draftStartDate || undefined} value={draftEndDate} onChange={(event) => setDraftEndDate(event.target.value)} aria-describedby={customDateError ? 'transaction-date-error' : undefined} aria-invalid={!draftEndDate || draftStartDate > draftEndDate} className="h-11 w-full min-w-0 bg-background text-sm" /></div>
              <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setShowCustomDates(false)} className="h-11 flex-1 text-xs sm:flex-none">Batal</Button><Button type="submit" disabled={Boolean(customDateError)} className="h-11 flex-1 text-xs sm:flex-none">Terapkan</Button></div>
            </div>
            {customDateError ? <p id="transaction-date-error" role="alert" className="mt-2 text-xs text-destructive">{customDateError}</p> : <p className="mt-2 text-[11px] text-muted-foreground">Tanggal mulai dan akhir ikut dihitung. Klik Terapkan untuk memperbarui hasil.</p>}
          </form>}
        </div>
      </ListFilters>

      <section aria-label="Daftar transaksi" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">Riwayat transaksi</h2><span className="text-xs text-muted-foreground">{periodLabel}</span></div>
        <div className="overflow-hidden rounded-xl border bg-card">
          {isSalesLoading ? <p role="status" className="p-12 text-center text-sm text-muted-foreground">Memuat data transaksi...</p>
          : isSalesError ? <div role="alert" className="flex flex-col items-center gap-3 p-8 text-center"><AlertCircle className="size-7 text-muted-foreground" /><p className="text-sm font-semibold">Gagal memuat transaksi</p><p className="text-xs text-muted-foreground">Periksa koneksi lalu coba lagi.</p><Button variant="outline" onClick={fetchSalesData}>Coba lagi</Button></div>
          : sales.length === 0 ? <div className="p-10 text-center"><Receipt className="mx-auto mb-3 size-7 text-muted-foreground" /><p className="text-sm font-semibold">Belum ada transaksi di periode ini</p><p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">Coba ubah periode, kata kunci, atau filter untuk menemukan transaksi yang dicari.</p>{hasFilters && <Button variant="outline" onClick={resetFilters} className="mt-4 text-xs">Reset filter</Button>}</div>
          : <>
            <div className="divide-y md:hidden">
              {sales.map((sale) => <article key={sale.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-semibold [overflow-wrap:anywhere]">{sale.invoiceNumber}</p><p className="mt-1 text-[10px] text-muted-foreground">{new Date(sale.transactionDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p></div><SaleStatusBadge sale={sale} /></div>
                <div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-medium">{sale.customerName || 'Pelanggan Umum'}</p><p className="mt-1 text-[11px] text-muted-foreground">{sale.items.reduce((sum, item) => sum + item.quantity, 0)} item · {sale.paymentMethod === 'CASH' ? 'Tunai' : sale.paymentMethod}</p></div><span className="shrink-0 text-sm font-bold"><CurrencyText value={sale.totalAmount} /></span></div>
                <Button variant="outline" onClick={() => handleOpenDetail(sale)} className="h-10 w-full gap-2 text-xs" aria-label={`Detail transaksi ${sale.invoiceNumber}`}><Receipt className="size-3.5" />Lihat detail & struk</Button>
              </article>)}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[800px] text-left text-xs">
                <thead className="border-b bg-muted/40 text-[11px] font-medium text-muted-foreground"><tr>
                  <th className="px-4 py-3.5">Invoice & waktu</th><th className="px-4 py-3.5">Pelanggan</th><th className="px-4 py-3.5">Pesanan</th><th className="px-4 py-3.5">Status</th><th className="px-4 py-3.5">Pembayaran</th><th className="px-4 py-3.5 text-right">Total bayar</th><th className="px-4 py-3.5 text-right">Detail</th>
                </tr></thead>
                <tbody className="divide-y divide-border/70">{sales.map((sale) => <tr key={sale.id} className="cursor-pointer transition-colors hover:bg-muted/30" onClick={() => handleOpenDetail(sale)}>
                  <td className="px-4 py-4"><span className="block font-semibold">{sale.invoiceNumber}</span><span className="mt-1 block whitespace-nowrap text-[10px] text-muted-foreground">{new Date(sale.transactionDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span></td>
                  <td className="px-4 py-4"><span className="block max-w-40 truncate font-medium">{sale.customerName || 'Pelanggan Umum'}</span>{sale.customer?.phone && <span className="mt-1 block text-[10px] text-muted-foreground">{sale.customer.phone}</span>}<span className="mt-1 block text-[10px] text-muted-foreground">Kasir: {sale.cashierName || 'Kasir'}</span></td>
                  <td className="px-4 py-4"><span>{sale.items.reduce((sum, item) => sum + item.quantity, 0)} item · {sale.items.length} jenis</span><span className="mt-1 block max-w-44 truncate text-[10px] text-muted-foreground" title={sale.items.map((item) => `${item.productName} (${item.quantity})`).join(', ')}>{sale.items.map((item) => `${item.productName} (${item.quantity})`).join(', ')}</span>{sale.notes && <span className="mt-1 block max-w-44 truncate text-[10px] italic text-muted-foreground" title={sale.notes}>{sale.notes}</span>}{(sale.internalNotes || sale.internal_notes) && <span className="mt-1 block max-w-44 truncate text-[10px] text-amber-700 bg-amber-500/10 px-1 py-0.5 rounded" title={sale.internalNotes || sale.internal_notes}>[Internal]: {sale.internalNotes || sale.internal_notes}</span>}</td>
                  <td className="px-4 py-4"><SaleStatusBadge sale={sale} /></td>
                  <td className="px-4 py-4"><span className="rounded-md border px-2 py-1 text-[10px]">{sale.paymentMethod === 'CASH' ? 'Tunai' : sale.paymentMethod === 'TRANSFER' ? 'Transfer bank' : sale.paymentMethod === 'DEBIT' ? 'Kartu debit' : sale.paymentMethod}</span></td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums"><CurrencyText value={sale.totalAmount} /></td>
                  <td className="px-4 py-4 text-right" onClick={(event) => event.stopPropagation()}><Button variant="outline" size="sm" onClick={() => handleOpenDetail(sale)} aria-label={`Struk ${sale.invoiceNumber}`} className="h-9 gap-1.5 text-xs"><Receipt className="size-3.5" />Struk</Button></td>
                </tr>)}</tbody>
              </table>
            </div>
          </>}
        </div>
        <TablePagination total={salesPage?.total || 0} displayedCount={sales.length} page={page} totalPages={totalPages} onPrev={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={isSalesLoading || isSalesError} label="transaksi" />
      </section>

      {/* Transaction Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md p-6 max-h-[90vh] overflow-y-auto">
          {selectedSale && (
            <div className="space-y-4">
              <DialogHeader className="border-b border-border pb-3">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <Receipt className="size-5 text-primary" />
                    <span>Detail Transaksi</span>
                  </DialogTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="h-8 gap-1.5 text-xs print:hidden"
                  >
                    <Printer className="size-3.5" />
                    <span>Cetak</span>
                  </Button>
                </div>
                <DialogDescription className="sr-only">Rincian pembayaran, produk, dan koreksi untuk transaksi {selectedSale.invoiceNumber}.</DialogDescription>
              </DialogHeader>

              {/* <SaleCorrectionPanel key={selectedSale.id} sale={selectedSale} onCorrected={setSelectedSale} /> */}
              {/* Printable Thermal Receipt Style */}
              <div
                id="receipt-print-area"
                className="print-receipt-container bg-card border border-border/80 rounded-xl p-4 text-xs font-mono space-y-3"
                data-paper-size={receiptConfig?.paper_size || '58mm'}
              >
                <div className="text-center border-b border-border/80 pb-2">
                  <h3 className="font-bold text-sm tracking-tight font-sans">
                    {storeProfile?.name || 'TOKO KASIR'}
                  </h3>
                  {receiptConfig?.header_text ? (
                    <p className="text-[10px] text-muted-foreground font-sans whitespace-pre-wrap">
                      {receiptConfig.header_text}
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground font-sans">
                      STRUK PEMBELIAN RESMI
                    </p>
                  )}
                </div>

                <div className="space-y-1 text-[11px] border-b border-border/80 pb-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">No. Invoice:</span>
                    <span className="font-bold">{selectedSale.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Waktu:</span>
                    <span>
                      {new Date(selectedSale.transactionDate).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  {receiptConfig?.show_cashier_name !== false && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kasir:</span>
                      <span>{selectedSale.cashierName || 'Kasir'}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pelanggan:</span>
                    <span className="font-semibold">{selectedSale.customerName || 'Guest'}</span>
                  </div>
                  {receiptConfig?.show_customer_phone !== false && (selectedSale.customerPhone || selectedSale.customer?.phone) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">No. HP:</span>
                      <span>{selectedSale.customerPhone || selectedSale.customer?.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipe:</span>
                    <span className="font-semibold">
                      {(selectedSale.fulfillmentType || selectedSale.fulfillment_type) === 'TAKE_AWAY' ? 'Take Away' : 'Dine In'}
                    </span>
                  </div>
                  {Boolean(selectedSale.tableNumber || selectedSale.table_number) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">No. Meja:</span>
                      <span className="font-semibold">{selectedSale.tableNumber || selectedSale.table_number}</span>
                    </div>
                  )}
                  {receiptConfig?.show_notes !== false && selectedSale.notes && (
                    <div className="flex justify-between text-[10px] text-muted-foreground italic">
                      <span>Catatan:</span>
                      <span>{selectedSale.notes}</span>
                    </div>
                  )}
                  {Boolean(selectedSale.internalNotes || selectedSale.internal_notes) && (
                    <div className="flex justify-between text-[10px] text-amber-700 bg-amber-500/10 px-1.5 py-1 rounded">
                      <span className="font-semibold">Catatan Internal:</span>
                      <span className="italic">{selectedSale.internalNotes || selectedSale.internal_notes}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 justify-between items-center pt-0.5">
                    <span className="text-muted-foreground">Status Pesanan:</span>
                    {selectedSale.status === 'IN_PROGRESS' ? (
                      <span className="font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        Dapur Sedang Menyiapkan (In Progress)
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {selectedSale.status === 'CANCELLED' ? 'Dibatalkan' : selectedSale.status === 'RETURNED' ? 'Diretur seluruhnya' : selectedSale.refundedAmount ? 'Retur sebagian' : 'Selesai'}
                      </span>
                    )}
                  </div>
                  {selectedSale.productionLogId && (
                    <div className="flex flex-wrap gap-1.5 justify-between items-center text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                      <span>Cara menyiapkan: Buat saat dipesan</span>
                      <span className="font-semibold">Terhubung ke Antrean Dapur</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="space-y-1.5 border-b border-border/80 pb-2">
                  {selectedSale.items.map((it) => (
                    <div key={it.id} className="flex justify-between items-baseline text-[11px]">
                      <div className="truncate flex-1 pr-2">
                        <p className="font-medium truncate">{it.productName}</p>
 {it.modifiers.map(m=><p key={m.id} className="text-xs text-muted-foreground">+ {m.name} · <CurrencyText value={m.price}/></p>)}
 {it.costStatus==='ESTIMATED'&&<p className="text-xs text-muted-foreground">HPP masih estimasi; produksi belum selesai.</p>}
                        <p className="text-[10px] text-muted-foreground">
                          {it.quantity} x <CurrencyText value={it.priceAtSale-it.modifiers.reduce((sum,m)=>sum+m.price,0)} />
                          {!!it.returnedQuantity && <span className="block">Diretur: {it.returnedQuantity} {it.unit}</span>}
                        </p>
                      </div>
                      <span className="font-semibold shrink-0">
                        <CurrencyText value={it.subtotal} />
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-1 text-[11px] border-b border-border/80 pb-2">
                  {selectedSale.discountAmount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Diskon:</span>
                      <span>-<CurrencyText value={selectedSale.discountAmount} /></span>
                    </div>
                  )}
                  {selectedSale.taxAmount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Pajak:</span>
                      <span>+<CurrencyText value={selectedSale.taxAmount} /></span>
                    </div>
                  )}
                  {!!selectedSale.refundedAmount && <>
                    <div className="flex justify-between"><span>Total Transaksi Awal:</span><CurrencyText value={selectedSale.originalTotalAmount || 0} /></div>
                    <div className="flex justify-between"><span>Refund Tercatat:</span><span>-<CurrencyText value={selectedSale.refundedAmount} /></span></div>
                  </>}
                  <div className="flex justify-between font-bold text-xs pt-1">
                    <span>{selectedSale.refundedAmount ? 'Total Setelah Koreksi:' : 'Total Bayar:'}</span>
                    <span className="text-foreground">
                      <CurrencyText value={selectedSale.totalAmount} />
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Metode Pembayaran:</span>
                    <span>{selectedSale.paymentMethod}</span>
                  </div>
                  {selectedSale.cashReceived != null && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Uang Diterima:</span>
                      <span><CurrencyText value={selectedSale.cashReceived} /></span>
                    </div>
                  )}
                  {selectedSale.cashChange != null && (
                    <div className="flex justify-between text-muted-foreground font-semibold">
                      <span>Kembalian:</span>
                      <span><CurrencyText value={selectedSale.cashChange} /></span>
                    </div>
                  )}
                </div>

                <div className="text-center pt-1 text-[10px] text-muted-foreground font-sans whitespace-pre-wrap">
                  {receiptConfig?.footer_text || 'Terima kasih atas kunjungan Anda!'}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

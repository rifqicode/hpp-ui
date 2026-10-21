import { SaleCorrectionPanel } from '@/features/sales/components/sale-correction-panel';
import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  ShoppingCart,
  Search,
  DollarSign,
  TrendingUp,
  Receipt,
  Printer,
  Calendar,
  X,
  ShoppingBag,
  RefreshCw,
} from 'lucide-react';

import {
  useSalesTransactionsQuery,
  useSalesSummaryQuery,
} from '../../features/sales/hooks/use-sales-query';
import type { Sale, SaleQuery } from '../../features/sales/types';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { TablePagination } from '../../components/ui/table-pagination';
import { CurrencyText } from '@/components/ui/currency-text';

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getSevenDaysAgoString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

function getStartOfMonthString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function TransactionHistoryPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterMethod, setFilterMethod] = React.useState<string>('ALL');
  const [filterStatus, setFilterStatus] = React.useState<string>('ALL');

  const [page, setPage] = React.useState(1);
  const perPage = 10;

  // Date Range Controls
  const [datePreset, setDatePreset] = React.useState<'TODAY' | '7D' | 'THIS_MONTH' | 'ALL_TIME' | 'CUSTOM'>('THIS_MONTH');
  const [startDate, setStartDate] = React.useState<string>(getStartOfMonthString());
  const [endDate, setEndDate] = React.useState<string>(getTodayString());

  // Selected sale for detail dialog
  const [selectedSale, setSelectedSale] = React.useState<Sale | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

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
    refetch: refetchSales,
  } = useSalesTransactionsQuery(query);
  const sales = salesPage?.data || [];

  const {
    data: summary = null,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useSalesSummaryQuery(query);

  const loading = isSalesLoading || isSummaryLoading;

  const fetchSalesData = async () => {
    await Promise.all([refetchSales(), refetchSummary()]);
  };

  const handlePresetChange = (preset: 'TODAY' | '7D' | 'THIS_MONTH' | 'ALL_TIME' | 'CUSTOM') => {
    setDatePreset(preset);
    const today = getTodayString();
    if (preset === 'TODAY') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === '7D') {
      setStartDate(getSevenDaysAgoString());
      setEndDate(today);
    } else if (preset === 'THIS_MONTH') {
      setStartDate(getStartOfMonthString());
      setEndDate(today);
    } else if (preset === 'ALL_TIME') {
      setStartDate('');
      setEndDate('');
    }
  };

  const filteredSales = sales;
  const totalPages = salesPage?.total_pages || 1;
  const paginatedSales = sales;

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [searchQuery, filterMethod, filterStatus, datePreset, startDate, endDate]);

  const handleOpenDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Transaction List
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Detail transaksi penjualan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSalesData}
            disabled={loading}
            className="flex items-center gap-1.5 shadow-2xs hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild className="gap-2 font-medium shadow-2xs">
            <Link to="/sales/pos">
              <ShoppingCart className="h-4 w-4" />
              <span>Buka Kasir (POS)</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Dashboard Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
            <CardContent className="p-0 flex items-center justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Total Omzet</p>
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-xl xl:text-2xl truncate font-bold tracking-tight text-foreground">
                    <CurrencyText value={summary.totalRevenue} />
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {summary.totalTransactions} transaksi
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
            <CardContent className="p-0 flex items-center justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Total HPP Modal</p>
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-xl xl:text-2xl truncate font-bold tracking-tight text-amber-600 dark:text-amber-400">
                    <CurrencyText value={summary.totalHpp} />
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Modal bahan & overhead
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
                <Receipt className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
            <CardContent className="p-0 flex items-center justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Total Laba Kotor</p>
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-xl xl:text-2xl truncate font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                    <CurrencyText value={summary.totalGrossProfit} />
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Omzet dikurangi HPP
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
            <CardContent className="p-0 flex items-center justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Rata-rata Margin</p>
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-xl xl:text-2xl truncate font-bold tracking-tight text-blue-600 dark:text-blue-400">
                    {summary.averageMarginPct.toFixed(1)}%
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Margin laba kotor
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
            <CardContent className="p-0 flex items-center justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Rata-rata Order (AOV)</p>
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-xl xl:text-2xl truncate font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                    <CurrencyText
                      value={
                        summary.averageOrderValue ||
                        (summary.totalTransactions > 0
                          ? summary.totalRevenue / summary.totalTransactions
                          : 0)
                      }
                    />
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Belanja per transaksi
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Date Range & Filter Toolbar */}
      <div className="flex flex-col gap-3 bg-card p-3 rounded-xl border border-border shadow-2xs">
        {/* Top row: Date Presets & Custom Pickers */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5 border-b border-border/70">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full no-scrollbar">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1 shrink-0">
              <Calendar className="size-3.5" />
              Periode:
            </span>
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 text-xs overflow-x-auto max-w-full no-scrollbar">
              {[
                { label: 'Hari Ini', key: 'TODAY' as const },
                { label: '7 Hari', key: '7D' as const },
                { label: 'Bulan Ini', key: 'THIS_MONTH' as const },
                { label: 'Semua Waktu', key: 'ALL_TIME' as const },
                { label: 'Kustom', key: 'CUSTOM' as const },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => handlePresetChange(p.key)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all whitespace-nowrap shrink-0 ${
                    datePreset === p.key
                      ? 'bg-background text-foreground shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Inputs */}
          {datePreset === 'CUSTOM' && (
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 w-full sm:w-auto">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs flex-1 min-w-[130px] sm:w-36 bg-background/50"
              />
              <span className="text-xs text-muted-foreground">s/d</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs flex-1 min-w-[130px] sm:w-36 bg-background/50"
              />
            </div>
          )}
        </div>

        {/* Bottom row: Search & Status / Payment Method Pills */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari invoice, pelanggan, atau produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 h-9 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 max-w-full">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 no-scrollbar bg-muted/60 p-1 rounded-lg border border-border/50 text-xs">
              {['ALL', 'COMPLETED', 'IN_PROGRESS', 'CANCELLED', 'RETURNED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all whitespace-nowrap shrink-0 ${
                    filterStatus === status
                      ? 'bg-background text-foreground shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {status === 'ALL'
                    ? 'Semua Status'
                    : status === 'COMPLETED'
                    ? 'Selesai'
                    : status === 'CANCELLED' ? 'Dibatalkan' : status === 'RETURNED' ? 'Diretur' : 'Dalam Proses'}
                </button>
              ))}
            </div>

            {/* Payment Method Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 no-scrollbar bg-muted/60 p-1 rounded-lg border border-border/50 text-xs">
              {['ALL', 'CASH', 'QRIS', 'TRANSFER', 'DEBIT'].map((method) => (
                <button
                  key={method}
                  onClick={() => setFilterMethod(method)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all whitespace-nowrap shrink-0 ${
                    filterMethod === method
                      ? 'bg-background text-foreground shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {method === 'ALL'
                    ? 'Semua Metode'
                    : method === 'CASH'
                    ? 'Tunai'
                    : method}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table & Pagination */}
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                <tr>
                  <th className="px-5 py-3.5">Invoice & Waktu</th>
                  <th className="px-5 py-3.5">Pelanggan</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Kasir</th>
                  <th className="px-5 py-3.5">Ringkasan Item</th>
                  <th className="px-5 py-3.5">Metode Bayar</th>
                  <th className="px-5 py-3.5 text-right">Total Omzet</th>
                  <th className="px-5 py-3.5 text-right">Total HPP</th>
                  <th className="px-5 py-3.5 text-right">Laba Kotor</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-muted-foreground">
                      Memuat data transaksi...
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-muted-foreground">
                      Tidak ada riwayat transaksi yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  paginatedSales.map((sale) => {
                    const itemCount = sale.items.reduce(
                      (acc, curr) => acc + curr.quantity,
                      0
                    );

                    return (
                      <tr
                        key={sale.id}
                        className="hover:bg-muted/30 transition-colors group cursor-pointer"
                        onClick={() => handleOpenDetail(sale)}
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-foreground block">
                            {sale.invoiceNumber}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="size-3" />
                            {new Date(sale.transactionDate).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="font-medium text-foreground block truncate max-w-44">
                            {sale.customerName || 'Pelanggan Umum'}
                          </span>
                          {sale.customer?.phone && (
                            <span className="text-[10px] text-muted-foreground block truncate max-w-44">
                              {sale.customer.phone}
                            </span>
                          )}
                          {sale.notes && (
                            <span className="text-[10px] text-muted-foreground truncate block max-w-44 italic">
                              &quot;{sale.notes}&quot;
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          {sale.status === 'IN_PROGRESS' ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400"
                            >
                              Dapur (In Progress)
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                            >
                              {sale.status === 'CANCELLED' ? 'Dibatalkan' : sale.status === 'RETURNED' ? 'Diretur seluruhnya' : sale.refundedAmount ? 'Retur sebagian' : 'Selesai'}
                            </Badge>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-muted-foreground">
                          {sale.cashierName || 'Kasir'}
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="text-xs text-foreground block font-medium">
                            {itemCount} pcs ({sale.items.length} jenis)
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate block max-w-48">
                            {sale.items
                              .map((i) => `${i.productName} (${i.quantity})`)
                              .join(', ')}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              sale.paymentMethod === 'QRIS'
                                ? 'bg-purple-500/10 text-purple-700 border-purple-500/20'
                                : sale.paymentMethod === 'CASH'
                                ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                                : sale.paymentMethod === 'DEBIT'
                                ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-700 border-blue-500/20'
                            }`}
                          >
                            {sale.paymentMethod}
                          </Badge>
                        </td>

                        <td className="px-5 py-3.5 text-right font-bold text-foreground">
                          <CurrencyText value={sale.totalAmount} />
                        </td>

                        <td className="px-5 py-3.5 text-right text-muted-foreground">
                          <CurrencyText value={sale.totalCost} />
                        </td>

                        <td className="px-5 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          <CurrencyText value={sale.grossProfit} />
                          <span className="block text-[10px] font-normal text-muted-foreground">
                            ({sale.profitMarginPct}%)
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetail(sale)}
                            className="h-7 text-xs px-2.5 gap-1.5"
                          >
                            <Receipt className="size-3.5" />
                            <span>Struk</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <TablePagination
          total={salesPage?.total || 0}
          displayedCount={paginatedSales.length}
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={loading}
          label="transaksi"
        />
      </div>

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
              </DialogHeader>

              <SaleCorrectionPanel key={selectedSale.id} sale={selectedSale} onCorrected={setSelectedSale} />
              {/* Printable Thermal Receipt Style */}
              <div
                id="receipt-print-area"
                className="bg-card border border-border/80 rounded-xl p-4 text-xs font-mono space-y-3"
              >
                <div className="text-center border-b border-border/80 pb-2">
                  <h3 className="font-bold text-sm tracking-tight font-sans">
                    TOKO KASIR
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-sans">
                    STRUK PEMBELIAN RESMI
                  </p>
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kasir:</span>
                    <span>{selectedSale.cashierName || 'Kasir'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pelanggan:</span>
                    <span className="font-semibold">{selectedSale.customerName || 'Guest'}</span>
                  </div>
                  {selectedSale.customer?.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">No. HP:</span>
                      <span>{selectedSale.customer.phone}</span>
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
                      <span>Pesanan MTO (Make to Order):</span>
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
                        <p className="text-[10px] text-muted-foreground">
                          {it.quantity} x <CurrencyText value={it.priceAtSale} />
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

                {/* Profit & Margin Audit (Internal Back-Office info) */}
                <div className="bg-muted/40 p-2.5 rounded-lg text-[10px] font-sans space-y-1 text-muted-foreground border border-border/50">
                  <div className="flex justify-between">
                    <span>Total HPP Modal:</span>
                    <span><CurrencyText value={selectedSale.totalCost} /></span>
                  </div>
                  <div className="flex justify-between font-semibold text-emerald-600">
                    <span>Laba Kotor (Gross Profit):</span>
                    <span>
                      <CurrencyText value={selectedSale.grossProfit} /> ({selectedSale.profitMarginPct}%)
                    </span>
                  </div>
                </div>

                <div className="text-center pt-1 text-[10px] text-muted-foreground font-sans">
                  Terima kasih atas kunjungan Anda!
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

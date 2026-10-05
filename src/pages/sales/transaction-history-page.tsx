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
} from 'lucide-react';

import { salesService } from '../../features/sales/services/sales-service';
import type { Sale, SalesSummary } from '../../features/sales/types';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

export default function TransactionHistoryPage() {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [summary, setSummary] = React.useState<SalesSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterMethod, setFilterMethod] = React.useState<string>('ALL');

  // Selected sale for detail dialog
  const [selectedSale, setSelectedSale] = React.useState<Sale | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  const fetchSalesData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [salesData, summaryData] = await Promise.all([
        salesService.getSales(),
        salesService.getSummary(),
      ]);
      setSales(salesData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load transaction history', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const filteredSales = React.useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.customerName && s.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.items.some((it) => it.productName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchMethod = filterMethod === 'ALL' || s.paymentMethod === filterMethod;
      return matchSearch && matchMethod;
    });
  }, [sales, searchQuery, filterMethod]);

  const handleOpenDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <History className="size-6 text-primary" />
            <span>Riwayat Transaksi Penjualan</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daftar seluruh transaksi kasir, analisis laba kotor, dan audit HPP per penjualan
          </p>
        </div>

        <Button asChild className="gap-2 shadow-xs">
          <Link to="/sales/pos">
            <ShoppingCart className="size-4" />
            <span>Buka Kasir (POS)</span>
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Omzet Penjualan
              </CardTitle>
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <DollarSign className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-black text-foreground">
                {formatRupiah(summary.totalRevenue)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Dari {summary.totalTransactions} transaksi berhasil
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total HPP Terjual
              </CardTitle>
              <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Receipt className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-black text-foreground">
                {formatRupiah(summary.totalHpp)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Modal bahan & overhead produksi
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Laba Kotor
              </CardTitle>
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {formatRupiah(summary.totalGrossProfit)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Omzet dikurangi HPP
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rata-rata Margin
              </CardTitle>
              <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <TrendingUp className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-black text-foreground">
                {summary.averageMarginPct.toFixed(1)}%
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Margin kotor terhadap omzet
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="border-border shadow-2xs">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari invoice, pelanggan, atau nama produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto">
            {['ALL', 'CASH', 'QRIS', 'TRANSFER'].map((method) => (
              <button
                key={method}
                onClick={() => setFilterMethod(method)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  filterMethod === method
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
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
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                <th className="p-3.5">Invoice & Waktu</th>
                <th className="p-3.5">Pelanggan</th>
                <th className="p-3.5">Ringkasan Item</th>
                <th className="p-3.5">Metode Bayar</th>
                <th className="p-3.5 text-right">Total Omzet</th>
                <th className="p-3.5 text-right">Total HPP</th>
                <th className="p-3.5 text-right">Laba Kotor</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Memuat data transaksi...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Tidak ada riwayat transaksi yang cocok.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const itemCount = sale.items.reduce((acc, curr) => acc + curr.quantity, 0);

                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => handleOpenDetail(sale)}
                    >
                      <td className="p-3.5">
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

                      <td className="p-3.5">
                        <span className="font-medium text-foreground block truncate max-w-44">
                          {sale.customerName || 'Pelanggan Umum'}
                        </span>
                        {sale.notes && (
                          <span className="text-[10px] text-muted-foreground truncate block max-w-44 italic">
                            &quot;{sale.notes}&quot;
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="text-xs text-foreground block font-medium">
                          {itemCount} pcs ({sale.items.length} jenis)
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate block max-w-48">
                          {sale.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            sale.paymentMethod === 'QRIS'
                              ? 'bg-purple-500/10 text-purple-700 border-purple-500/20'
                              : sale.paymentMethod === 'CASH'
                              ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-700 border-blue-500/20'
                          }`}
                        >
                          {sale.paymentMethod}
                        </Badge>
                      </td>

                      <td className="p-3.5 text-right font-bold text-foreground">
                        {formatRupiah(sale.totalAmount)}
                      </td>

                      <td className="p-3.5 text-right text-muted-foreground">
                        {formatRupiah(sale.totalCost)}
                      </td>

                      <td className="p-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(sale.grossProfit)}
                        <span className="block text-[10px] font-normal text-muted-foreground">
                          ({sale.profitMarginPct}%)
                        </span>
                      </td>

                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
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
      </Card>

      {/* Transaction Detail & Struk Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span>Detail & Struk Transaksi</span>
            </DialogTitle>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-4 py-2">
              {/* Receipt Box */}
              <div
                id="thermal-receipt"
                className="bg-card border border-border rounded-xl p-4 font-mono text-xs text-foreground shadow-xs space-y-3"
              >
                <div className="text-center border-b border-border/80 pb-2.5">
                  <h3 className="font-bold text-sm">TOKO ROTI ENAK</h3>
                  <p className="text-[10px] text-muted-foreground">Cabang Tebet - Jakarta Selatan</p>
                  <p className="text-[10px] text-muted-foreground">Telp: (021) 829-4567</p>
                </div>

                <div className="space-y-1 text-[11px] border-b border-border/80 pb-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice:</span>
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
                    <span className="text-muted-foreground">Pelanggan:</span>
                    <span>{selectedSale.customerName || 'Pelanggan Umum'}</span>
                  </div>
                  {selectedSale.notes && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Catatan:</span>
                      <span>{selectedSale.notes}</span>
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
                          {it.quantity} x {formatRupiah(it.priceAtSale)} • HPP: {formatRupiah(it.costAtSale)}
                        </p>
                      </div>
                      <span className="font-semibold shrink-0">{formatRupiah(it.subtotal)}</span>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="space-y-1 text-[11px] border-b border-border/80 pb-2">
                  {selectedSale.discountAmount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Diskon:</span>
                      <span className="text-red-500">
                        -{formatRupiah(selectedSale.discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold pt-1">
                    <span>TOTAL:</span>
                    <span>{formatRupiah(selectedSale.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Metode:</span>
                    <span className="font-semibold">{selectedSale.paymentMethod}</span>
                  </div>
                  {selectedSale.paymentMethod === 'CASH' && selectedSale.cashReceived && (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tunai:</span>
                        <span>{formatRupiah(selectedSale.cashReceived)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Kembalian:</span>
                        <span className="font-semibold text-emerald-600">
                          {formatRupiah(selectedSale.cashChange || 0)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Profit Margin Info (For Staff/Owner View) */}
                <div className="bg-primary/5 p-2 rounded-lg space-y-1 text-[10px]">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total HPP Transaksi:</span>
                    <span className="font-semibold">{formatRupiah(selectedSale.totalCost)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>Laba Bersih Transaksi:</span>
                    <span>{formatRupiah(selectedSale.grossProfit)} ({selectedSale.profitMarginPct}%)</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrint} className="flex-1 text-xs gap-1.5 h-9">
                  <Printer className="size-3.5" />
                  <span>Cetak Struk</span>
                </Button>
                <Button onClick={() => setIsDetailOpen(false)} className="flex-1 text-xs font-semibold h-9">
                  <span>Tutup</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  QrCode,
  Receipt,
  Printer,
  RotateCcw,
  CheckCircle2,
  History,
  AlertCircle,
  Package,
  TrendingUp,
  X,
  ArrowRight,
  UserRound,
} from 'lucide-react';

import { useQueryClient } from '@tanstack/react-query';
import { useProductsQuery, recipeKeys } from '../../features/recipes/hooks/use-recipes-query';
import { salesService } from '../../features/sales/services/sales-service';
import { customerService } from '../../features/sales/services/customer-service';
import type { CartItem, PaymentMethod, Sale, Customer } from '../../features/sales/types';
import type { Product } from '../../features/recipes/types';
import { useAuthStore } from '../../store/use-auth-store';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { FormattedNumberInput } from '../../components/ui/formatted-number-input';
import { Card } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { CurrencyText } from '@/components/ui/currency-text';

export default function PosPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const cashierName = user?.name || 'Kasir 1';

  const { data: products = [], isLoading: loading, isError, refetch } = useProductsQuery();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('ALL');
  const [onlyInStock, setOnlyInStock] = React.useState(false);

  // Cart State
  const [mobileTab, setMobileTab] = React.useState<'catalog' | 'cart'>('catalog');
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [customerName, setCustomerName] = React.useState('');
  const [matchedCustomer, setMatchedCustomer] = React.useState<Customer | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = React.useState(false);
  const [orderNotes, setOrderNotes] = React.useState('');

  const handleCustomerPhoneChange = async (val: string) => {
    setCustomerPhone(val);
    const cleaned = val.trim();
    if (cleaned.length >= 8) {
      try {
        setIsSearchingCustomer(true);
        const cust = await customerService.searchCustomerByPhone(cleaned);
        if (cust) {
          setMatchedCustomer(cust);
          if (!customerName || customerName === 'Guest') {
            setCustomerName(cust.name);
          }
        } else {
          setMatchedCustomer(null);
        }
      } catch {
        setMatchedCustomer(null);
      } finally {
        setIsSearchingCustomer(false);
      }
    } else {
      setMatchedCustomer(null);
    }
  };

  // Payment Modal State
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = React.useState<string>('');
  const [paymentReference, setPaymentReference] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Success / Receipt Modal State
  const [completedSale, setCompletedSale] = React.useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);

  // Categories list
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const query = searchQuery.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(query) ||
        (p.sku && p.sku.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query));
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchStock = !onlyInStock || p.currentStock > 0;
      return matchSearch && matchCat && matchStock;
    });
  }, [products, searchQuery, selectedCategory, onlyInStock]);

  // Cart Calculations
  const totalItemsCount = React.useMemo(() => {
    return cart.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cart]);

  const subtotal = React.useMemo(() => {
    return cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  }, [cart]);

  const totalCost = React.useMemo(() => {
    return cart.reduce((acc, curr) => acc + curr.cost * curr.quantity, 0);
  }, [cart]);

  const totalBill = subtotal;

  const estimatedGrossProfit = React.useMemo(() => {
    return totalBill - totalCost;
  }, [totalBill, totalCost]);

  const estimatedMarginPct = React.useMemo(() => {
    return totalBill > 0 ? (estimatedGrossProfit / totalBill) * 100 : 0;
  }, [totalBill, estimatedGrossProfit]);

  // Quick cash buttons
  const cashReceivedNum = Number(cashReceived.replace(/\D/g, '')) || 0;
  const cashChange = Math.max(0, cashReceivedNum - totalBill);
  const isCashSufficient = paymentMethod !== 'CASH' || cashReceivedNum >= totalBill;

  // Cart Handlers
  const handleAddToCart = (product: Product) => {
    const isMTO = product.mode === 'MAKE_TO_ORDER';
    if (!isMTO && product.currentStock <= 0) return;

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const item = prev[existingIndex];
        if (!isMTO && item.quantity >= product.currentStock) {
          return prev; // cannot exceed stock for MTS
        }
        const updated = [...prev];
        updated[existingIndex] = {
          ...item,
          quantity: item.quantity + 1,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            price: product.sellingPrice,
            cost: product.latestHpp || 0,
          },
        ];
      }
    });
  };

  const handleUpdateQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const isMTO = item.product.mode === 'MAKE_TO_ORDER';
          const max = isMTO ? Infinity : item.product.currentStock;
          const cappedQty = Math.min(newQty, max);
          return { ...item, quantity: cappedQty };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
  };

  // Payment Handler
  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setCashReceived(String(totalBill)); // default to exact amount
    setIsPaymentOpen(true);
  };

  const handleExecutePayment = async () => {
    if (!isCashSufficient) return;

    try {
      setIsProcessing(true);
      const sale = await salesService.createSale({
        customerPhone: customerPhone.trim() || undefined,
        customerName: customerName.trim() || undefined,
        paymentMethod,
        discountAmount: 0,
        cashReceived: paymentMethod === 'CASH' ? cashReceivedNum : undefined,
        paymentReference: paymentReference.trim() || undefined,
        notes: orderNotes.trim() || undefined,
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
          priceAtSale: c.price,
          costAtSale: c.cost,
        })),
      });

      setCompletedSale(sale);
      setIsPaymentOpen(false);
      setIsReceiptOpen(true);

      // Reset cart
      setCart([]);
      setCustomerPhone('');
      setCustomerName('');
      setMatchedCustomer(null);
      setOrderNotes('');

      // Refresh product list to show updated stock counts
      queryClient.invalidateQueries({ queryKey: recipeKeys.all });
    } catch (err) {
      console.error('Failed to create sale', err);
      alert('Gagal memproses transaksi. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <header className="flex items-start justify-between gap-3 sm:items-center">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight sm:text-2xl">Kasir & Transaksi POS</h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Pilih produk, cek pesanan, lalu terima pembayaran.</p>
        </div>
        <Button variant="outline" asChild className="h-11 shrink-0 gap-2 rounded-xl px-3 text-xs">
          <Link to="/sales/history" aria-label="Riwayat Transaksi"><History className="size-4" /><span className="hidden sm:inline">Riwayat Transaksi</span></Link>
        </Button>
      </header>

      <div className="flex rounded-xl border bg-muted/50 p-1 lg:hidden" aria-label="Tampilan kasir">
        <button type="button" aria-pressed={mobileTab === 'catalog'} onClick={() => setMobileTab('catalog')}
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${mobileTab === 'catalog' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>
          <Package className="size-4" />Katalog
        </button>
        <button type="button" aria-pressed={mobileTab === 'cart'} onClick={() => setMobileTab('cart')}
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${mobileTab === 'cart' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>
          <ShoppingCart className="size-4" />Keranjang
          <span className="rounded-md bg-primary/10 px-1.5 text-xs text-primary">{totalItemsCount}</span>
        </button>
      </div>

      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-label="Katalog produk" className={`${mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'} min-w-0 flex-col gap-4`}>
          <div className="rounded-2xl border bg-card p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Katalog produk</h2>
              <span className="text-xs text-muted-foreground">{filteredProducts.length} produk</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-0 flex-1 basis-48">
                <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
                <Input aria-label="Cari produk" placeholder="Cari nama produk atau kategori..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} className="h-11 rounded-xl bg-background pl-9 pr-11 text-sm" />
                {searchQuery && <button type="button" aria-label="Hapus pencarian" onClick={() => setSearchQuery('')}
                  className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="size-4" /></button>}
              </div>
              <button type="button" aria-pressed={onlyInStock} onClick={() => setOnlyInStock(!onlyInStock)}
                className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${onlyInStock ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                <Package className="size-4" />Hanya Stok Tersedia
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Kategori produk">
              {categories.map((cat) => <button key={cat} type="button" aria-pressed={selectedCategory === cat} onClick={() => setSelectedCategory(cat)}
                className={`min-h-10 rounded-lg px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                {cat === 'ALL' ? 'Semua Produk' : cat}
              </button>)}
            </div>
          </div>

          {loading ? (
            <div role="status" className="flex min-h-64 items-center justify-center rounded-2xl border bg-card text-sm text-muted-foreground">Memuat daftar produk...</div>
          ) : isError ? (
            <div role="alert" className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-6 text-center">
              <AlertCircle className="size-7 text-muted-foreground" /><p className="text-sm font-semibold">Gagal memuat produk</p>
              <p className="text-xs text-muted-foreground">Periksa koneksi lalu coba lagi.</p>
              <Button variant="outline" onClick={() => void refetch()}>Coba lagi</Button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-card p-6 text-center">
              <Search className="mb-3 size-7 text-muted-foreground" />
              <p className="text-sm font-semibold">Tidak ada produk ditemukan</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">{products.length === 0 ? 'Tambahkan produk terlebih dahulu untuk mulai bertransaksi.' : 'Coba ubah kata kunci pencarian atau matikan filter stok.'}</p>
              {products.length === 0 && <Button variant="outline" asChild className="mt-4"><Link to="/production/products/new">Tambah produk</Link></Button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const inCartQty = cart.find((c) => c.product.id === product.id)?.quantity || 0;
                const isMTO = product.mode === 'MAKE_TO_ORDER';
                const isOutOfStock = !isMTO && product.currentStock <= 0;
                return (
                  <Card key={product.id} onClick={() => !isOutOfStock && handleAddToCart(product)}
                    className={`group relative min-w-0 gap-0 rounded-2xl border p-0 shadow-none ring-0 transition-colors ${isOutOfStock ? 'border-border bg-muted/40' : inCartQty > 0 ? 'cursor-pointer border-primary/60 bg-card' : 'cursor-pointer border-border bg-card hover:border-primary/40'}`}>
                    <div className={`relative m-2 mb-0 flex items-center justify-center overflow-hidden rounded-xl bg-muted/70 ${product.imageUrl ? 'h-28 sm:h-32' : 'h-16 sm:h-20'}`}>
                      <Package className="size-9 text-muted-foreground/40" strokeWidth={1.25} aria-hidden="true" />
                      {product.imageUrl && <img src={product.imageUrl} alt="" loading="lazy" className={`absolute inset-0 size-full object-cover ${isOutOfStock ? 'grayscale' : ''}`} onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
                      {inCartQty > 0 && <span className="absolute right-2 top-2 flex min-w-6 items-center justify-center rounded-lg bg-primary px-1.5 py-1 text-[11px] font-bold text-primary-foreground">{inCartQty}×</span>}
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <div className="mb-1 flex items-center gap-1.5 overflow-hidden">
                        {product.sku && (
                          <span className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {product.sku}
                          </span>
                        )}
                        <span className="truncate text-[10px] text-muted-foreground">{product.category || 'Tanpa kategori'}</span>
                      </div>
                      <h3 className="min-h-10 text-sm font-semibold leading-5 [overflow-wrap:anywhere]">{product.name}</h3>
                      <p className="mt-2 text-sm font-bold tabular-nums"><CurrencyText value={product.sellingPrice} /></p>
                      <p className={`mt-1 text-[11px] ${isOutOfStock ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {isMTO ? 'Dibuat saat dipesan' : isOutOfStock ? 'Stok habis' : `Stok ${product.currentStock} ${product.unit || 'pcs'}`}
                      </p>
                      <Button size="sm" disabled={isOutOfStock} variant={inCartQty > 0 ? 'default' : 'outline'}
                        className="mt-3 h-10 w-full gap-1 rounded-lg text-xs shadow-none"
                        onClick={(event) => { event.stopPropagation(); handleAddToCart(product); }}>
                        <Plus className="size-3.5" />{inCartQty > 0 ? 'Tambah Lagi' : 'Pilih Produk'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-2xl border bg-card p-3 shadow-sm lg:hidden">
            <div className="min-w-0"><span className="block text-[11px] text-muted-foreground">{totalItemsCount} item dipilih</span><span className="text-sm font-bold"><CurrencyText value={totalBill} /></span></div>
            <Button onClick={() => setMobileTab('cart')} className="min-h-11 gap-2 rounded-xl text-xs"><ShoppingCart className="size-4" />Lihat Keranjang & Bayar</Button>
          </div>
        </section>

        <section aria-label="Pesanan pelanggan" className={`${mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'} min-w-0 flex-col rounded-2xl border bg-card lg:sticky lg:top-0`}>
          <div className="flex items-center justify-between gap-2 border-b p-4">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold"><ShoppingCart className="size-4" />Pesanan Pelanggan</h2>
              <p className="mt-1 text-[11px] text-muted-foreground">Kasir: {cashierName} · {totalItemsCount} item</p>
            </div>
            {cart.length > 0 && <Button variant="ghost" size="sm" onClick={handleClearCart} className="h-10 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive"><RotateCcw className="size-3.5" />Reset</Button>}
          </div>

          <div className="space-y-4 p-4">
            <Button variant="outline" onClick={() => setMobileTab('catalog')} className="h-10 w-full text-xs lg:hidden">Kembali</Button>
            <div className="max-h-[min(40dvh,380px)] min-h-40 space-y-3 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">
                  <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted"><ShoppingCart className="size-5 text-muted-foreground" /></span>
                  <p className="text-sm font-semibold">Keranjang Masih Kosong</p>
                  <p className="mt-1.5 max-w-52 text-xs leading-5 text-muted-foreground">Pilih produk dari katalog untuk mulai pesanan pertama.</p>
                </div>
              ) : cart.map((item) => (
                <div key={item.product.id} className="border-b border-border/70 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold [overflow-wrap:anywhere]">{item.product.name}</h4>
                      {item.product.sku && (
                        <span className="mt-0.5 inline-block rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          {item.product.sku}
                        </span>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground"><CurrencyText value={item.price} /> / {item.product.unit || 'pcs'}</p>
                    </div>
                    <button type="button" title="Hapus item" aria-label={`Hapus ${item.product.name}`} onClick={() => handleRemoveItem(item.product.id)} className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 className="size-4" /></button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center rounded-lg border bg-background">
                      <button type="button" aria-label={`Kurangi ${item.product.name}`} onClick={() => handleUpdateQty(item.product.id, item.quantity - 1)} className="flex size-10 items-center justify-center rounded-l-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Minus className="size-3.5" /></button>
                      <span className="min-w-7 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                      <button type="button" aria-label={`Tambah ${item.product.name}`} onClick={() => handleUpdateQty(item.product.id, item.quantity + 1)} disabled={item.product.mode !== 'MAKE_TO_ORDER' && item.quantity >= item.product.currentStock} className="flex size-10 items-center justify-center rounded-r-lg hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Plus className="size-3.5" /></button>
                    </div>
                    <span className="text-sm font-semibold tabular-nums"><CurrencyText value={item.price * item.quantity} /></span>
                  </div>
                </div>
              ))}
            </div>

            <details className="group rounded-xl border bg-background" open>
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="flex items-center gap-2"><UserRound className="size-3.5 text-muted-foreground" />Pelanggan & catatan</span><span className="text-[10px] text-muted-foreground">Opsional</span>
              </summary>
              <div className="space-y-2 border-t p-3">
                <Input aria-label="Nomor HP pelanggan" type="tel" placeholder="No. HP / WA Pelanggan" value={customerPhone} onChange={(e) => handleCustomerPhoneChange(e.target.value)} className="h-10 text-xs" />
                <Input aria-label="Nama pelanggan" placeholder="Nama Pelanggan (opsional)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-10 text-xs" />
                {customerPhone.trim().length >= 8 && <div role="status" className="text-[11px] text-muted-foreground">{isSearchingCustomer ? 'Mencari data member...' : matchedCustomer ? `Member: ${matchedCustomer.name} (${matchedCustomer.total_orders ?? 0} pesanan)` : 'Pelanggan baru (tercatat otomatis saat checkout)'}</div>}
                <Input aria-label="Catatan pesanan" placeholder="Catatan Pesanan (opsional)" value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} className="h-10 text-xs" />
              </div>
            </details>
          </div>

          <div className="space-y-3 rounded-b-2xl border-t bg-muted/20 p-4">
            <div className="flex justify-between gap-2 text-xs text-muted-foreground"><span>Subtotal ({totalItemsCount} item)</span><span className="font-medium text-foreground"><CurrencyText value={subtotal} /></span></div>
            {cart.length > 0 && <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><TrendingUp className="size-3.5" />Estimasi laba kotor</span><span className={estimatedGrossProfit < 0 ? 'text-destructive' : 'font-medium text-foreground'}><CurrencyText value={estimatedGrossProfit} /> ({estimatedMarginPct.toFixed(1)}%)</span></div>}
            <Separator />
            <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">Total Tagihan</span><span className="text-xl font-bold tracking-tight tabular-nums"><CurrencyText value={totalBill} /></span></div>
            <Button disabled={cart.length === 0} onClick={handleOpenPayment} className="h-12 w-full justify-between rounded-xl px-4 text-sm font-semibold shadow-none"><span>Bayar <CurrencyText value={totalBill} /></span><ArrowRight className="size-4" /></Button>
            <p className="text-center text-[10px] text-muted-foreground">Tunai, QRIS, atau transfer bank</p>
          </div>
        </section>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Pembayaran Transaksi</DialogTitle>
            <DialogDescription className="text-xs">
              Pilih metode pembayaran dan masukkan jumlah uang yang diterima.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 overflow-y-auto flex-1">
            {/* Total Box */}
            <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-xl text-center">
              <span className="text-xs text-muted-foreground block font-medium">Total yang Harus Dibayar</span>
              <span className="text-2xl font-black text-primary block mt-0.5">
                <CurrencyText value={totalBill} />
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-card hover:bg-muted text-foreground border-border'
                  }`}
                >
                  <Banknote className="size-4" />
                  <span>Tunai (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all ${
                    paymentMethod === 'QRIS'
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-card hover:bg-muted text-foreground border-border'
                  }`}
                >
                  <QrCode className="size-4" />
                  <span>QRIS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all ${
                    paymentMethod === 'TRANSFER'
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-card hover:bg-muted text-foreground border-border'
                  }`}
                >
                  <CreditCard className="size-4" />
                  <span>Transfer Bank</span>
                </button>
              </div>
            </div>

            {/* Cash Input Option */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-2.5 pt-1">
                <label className="text-xs font-semibold text-foreground">Uang Diterima (Rp)</label>
                <FormattedNumberInput
                  value={cashReceived}
                  onChange={(val) => setCashReceived(String(val))}
                  placeholder="0"
                  className="h-10 text-base font-bold text-center bg-background"
                />

                {/* Quick Cash Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCashReceived(String(totalBill))}
                    className="h-7 text-[11px]"
                  >
                    Uang Pas
                  </Button>
                  {[50000, 100000, 200000].map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCashReceived(String(amt))}
                      className="h-7 text-[11px]"
                    >
                      <CurrencyText value={amt} />
                    </Button>
                  ))}
                </div>

                {/* Change calculation */}
                <div
                  className={`p-2.5 rounded-lg border flex items-center justify-between text-xs font-semibold ${
                    cashReceivedNum >= totalBill
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
                  }`}
                >
                  <span>
                    {cashReceivedNum >= totalBill ? 'Kembalian:' : 'Uang Kurang:'}
                  </span>
                  <span className="font-bold text-sm">
                    {cashReceivedNum >= totalBill ? (
                      <CurrencyText value={cashChange} />
                    ) : (
                      <CurrencyText value={totalBill - cashReceivedNum} />
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* QRIS Screen */}
            {paymentMethod === 'QRIS' && (
              <div className="p-4 bg-muted/40 border border-border rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                <div className="size-36 bg-white p-2 rounded-lg border shadow-xs flex items-center justify-center">
                  <QrCode className="size-32 text-slate-900" />
                </div>
                <p className="text-xs font-semibold text-foreground">Scan QRIS Toko Roti Enak</p>
                <p className="text-[10px] text-muted-foreground">
                  Mendukung GoPay, OVO, Dana, ShopeePay, BCA, dan seluruh bank
                </p>
              </div>
            )}

            {/* Transfer Option */}
            {paymentMethod === 'TRANSFER' && (
              <div className="space-y-2 p-3 bg-muted/30 border border-border rounded-xl text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank:</span>
                  <span className="font-bold">BCA (Cabang Jakarta)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. Rekening:</span>
                  <span className="font-mono font-bold">873-091-2384</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Atas Nama:</span>
                  <span className="font-bold">Toko Roti Enak</span>
                </div>
                <div className="pt-2">
                  <Input
                    placeholder="No. Referensi / 4 Digit Rekening Pelanggan"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsPaymentOpen(false)}
              className="flex-1 text-xs"
            >
              Batal
            </Button>
            <Button
              onClick={handleExecutePayment}
              disabled={isProcessing || !isCashSufficient}
              className="flex-1 text-xs font-bold gap-1.5"
            >
              {isProcessing ? (
                'Memproses...'
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>Selesaikan Transaksi</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-500" />
              <span>Transaksi Berhasil Disimpan!</span>
            </DialogTitle>
          </DialogHeader>

          {completedSale && (
            <div className="space-y-4 py-2 overflow-y-auto flex-1">
              {/* Thermal Paper Receipt Style */}
              <div
                id="thermal-receipt"
                className="bg-card border border-border rounded-xl p-4 font-mono text-xs text-foreground shadow-xs space-y-3"
              >
                <div className="text-center border-b border-border/80 pb-2.5">
                  <h3 className="font-bold text-sm tracking-tight">TOKO ROTI ENAK</h3>
                  <p className="text-[10px] text-muted-foreground">Cabang Tebet - Jakarta Selatan</p>
                  <p className="text-[10px] text-muted-foreground">Telp: (021) 829-4567</p>
                </div>

                <div className="space-y-1 text-[11px] border-b border-border/80 pb-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">No. Invoice:</span>
                    <span className="font-bold">{completedSale.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Waktu:</span>
                    <span>
                      {new Date(completedSale.transactionDate).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kasir:</span>
                    <span>{cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pelanggan:</span>
                    <span>{completedSale.customerName}</span>
                  </div>
                  {completedSale.status === 'IN_PROGRESS' && (
                    <div className="flex justify-between font-bold text-amber-600 bg-amber-500/10 px-1 py-0.5 rounded">
                      <span>Status:</span>
                      <span>IN PROCESS (Dapur Sedang Menyiapkan)</span>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div className="space-y-1.5 border-b border-border/80 pb-2">
                  {completedSale.items.map((it) => (
                    <div key={it.id} className="flex justify-between items-baseline text-[11px]">
                      <div className="truncate flex-1 pr-2">
                        <p className="font-medium truncate">{it.productName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {it.quantity} x <CurrencyText value={it.priceAtSale} />
                        </p>
                      </div>
                      <span className="font-semibold shrink-0"><CurrencyText value={it.subtotal} /></span>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="space-y-1 text-[11px] border-b border-border/80 pb-2">
                  {completedSale.discountAmount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Diskon:</span>
                      <span className="text-red-500">
                        -<CurrencyText value={completedSale.discountAmount} />
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold pt-1">
                    <span>TOTAL:</span>
                    <span><CurrencyText value={completedSale.totalAmount} /></span>
                  </div>
                  <div className="flex justify-between text-muted-foreground pt-1">
                    <span>Metode Bayar:</span>
                    <span className="font-semibold">{completedSale.paymentMethod}</span>
                  </div>
                  {completedSale.paymentMethod === 'CASH' && completedSale.cashReceived && (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tunai:</span>
                        <span><CurrencyText value={completedSale.cashReceived} /></span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Kembalian:</span>
                        <span className="font-semibold text-emerald-600">
                          <CurrencyText value={completedSale.cashChange || 0} />
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-center pt-1 text-[10px] text-muted-foreground">
                  <p>Terima kasih atas kunjungan Anda!</p>
                  <p>Stok bahan & produk otomatis diperbarui.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrintReceipt}
                  className="flex-1 text-xs gap-1.5 h-9"
                >
                  <Printer className="size-3.5" />
                  <span>Cetak Struk</span>
                </Button>
                <Button
                  onClick={() => setIsReceiptOpen(false)}
                  className="flex-1 text-xs font-bold gap-1.5 h-9"
                >
                  <Receipt className="size-3.5" />
                  <span>Transaksi Baru</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

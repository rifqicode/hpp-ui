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
} from 'lucide-react';

import { salesService } from '../../features/sales/services/sales-service';
import type { CartItem, PaymentMethod, Sale } from '../../features/sales/types';
import type { Product } from '../../features/recipes/types';
import { useAuthStore } from '../../store/use-auth-store';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

export default function PosPage() {
  const user = useAuthStore((state) => state.user);
  const cashierName = user?.name || 'Kasir 1';

  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('ALL');
  const [onlyInStock, setOnlyInStock] = React.useState(false);

  // Cart State
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [customerName, setCustomerName] = React.useState('');
  const [orderNotes, setOrderNotes] = React.useState('');
  const [discountAmount, setDiscountAmount] = React.useState<number>(0);
  const [showDiscountInput, setShowDiscountInput] = React.useState(false);

  // Payment Modal State
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = React.useState<string>('');
  const [paymentReference, setPaymentReference] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Success / Receipt Modal State
  const [completedSale, setCompletedSale] = React.useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);

  // Load products
  const fetchProducts = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await salesService.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
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

  const totalBill = React.useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

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
    if (product.currentStock <= 0) return;

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const item = prev[existingIndex];
        if (item.quantity >= product.currentStock) {
          return prev; // cannot exceed stock
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
          const max = item.product.currentStock;
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
    setDiscountAmount(0);
    setShowDiscountInput(false);
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
        customerName,
        paymentMethod,
        discountAmount,
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
      setCustomerName('');
      setOrderNotes('');
      setDiscountAmount(0);
      setShowDiscountInput(false);

      // Refresh product list to show updated stock counts
      fetchProducts();
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
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Top Header Bar */}
      <div className="border-b border-border bg-card px-4 py-2.5 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-2xs">
            <ShoppingCart className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-none flex items-center gap-2">
              Kasir & Transaksi POS
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold py-0.5">
                Live POS
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pilih produk pesanan pelanggan, hitung HPP otomatis, dan cetak struk
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" asChild className="gap-2 text-xs h-8">
            <Link to="/sales/history">
              <History className="size-3.5" />
              <span>Riwayat Transaksi</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content: Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        {/* Left Column: Product Selection Catalog (8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full overflow-hidden border-r border-border bg-muted/10">
          {/* Filter & Search Bar */}
          <div className="p-3 bg-card border-b border-border/80 flex flex-col sm:flex-row gap-2.5 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama produk atau kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-background"
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

            {/* In Stock Only Switch */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setOnlyInStock(!onlyInStock)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                  onlyInStock
                    ? 'bg-primary/10 border-primary text-primary font-semibold'
                    : 'bg-background border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <Package className="size-3.5" />
                <span>Hanya Stok Tersedia</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-3 py-2 bg-card/60 border-b border-border/50 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-all font-medium ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-background hover:bg-muted text-muted-foreground border border-border/70'
                }`}
              >
                {cat === 'ALL' ? 'Semua Produk' : cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                Memuat daftar produk...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <AlertCircle className="size-10 mb-2 text-muted-foreground/50" />
                <p className="font-semibold text-foreground text-sm">Tidak ada produk ditemukan</p>
                <p className="text-xs max-w-xs mt-1">
                  Coba ubah kata kunci pencarian atau matikan filter stok.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filteredProducts.map((product) => {
                  const inCartItem = cart.find((c) => c.product.id === product.id);
                  const inCartQty = inCartItem?.quantity || 0;
                  const isOutOfStock = product.currentStock <= 0;
                  const marginPct =
                    product.sellingPrice > 0 && product.latestHpp
                      ? ((product.sellingPrice - product.latestHpp) / product.sellingPrice) * 100
                      : 0;

                  return (
                    <Card
                      key={product.id}
                      onClick={() => !isOutOfStock && handleAddToCart(product)}
                      className={`relative group cursor-pointer transition-all duration-150 overflow-hidden flex flex-col justify-between ${
                        isOutOfStock
                          ? 'opacity-50 cursor-not-allowed bg-muted/40 border-dashed'
                          : inCartQty > 0
                          ? 'border-primary ring-1 ring-primary/40 bg-primary/5 shadow-xs'
                          : 'hover:border-primary/50 hover:shadow-xs bg-card'
                      }`}
                    >
                      {/* In Cart Badge */}
                      {inCartQty > 0 && (
                        <div className="absolute top-2 right-2 z-10">
                          <span className="bg-primary text-primary-foreground font-bold text-[10px] px-1.5 py-0.5 rounded-full shadow-xs">
                            {inCartQty}x
                          </span>
                        </div>
                      )}

                      <CardContent className="p-3 flex flex-col h-full justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 bg-muted px-1.5 py-0.5 rounded">
                              {product.category || 'Roti'}
                            </span>
                            <span
                              className={`text-[10px] font-medium ml-auto flex items-center gap-1 ${
                                isOutOfStock
                                  ? 'text-red-500 font-bold'
                                  : product.currentStock < (product.minStock || 10)
                                  ? 'text-amber-600 font-semibold'
                                  : 'text-emerald-600'
                              }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  isOutOfStock
                                    ? 'bg-red-500'
                                    : product.currentStock < (product.minStock || 10)
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                              />
                              {isOutOfStock ? 'Habis' : `${product.currentStock} ${product.unit || 'pcs'}`}
                            </span>
                          </div>

                          <h3 className="font-semibold text-xs text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                        </div>

                        <div className="pt-2 border-t border-border/50 flex flex-col gap-1">
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs font-bold text-primary">
                              {formatRupiah(product.sellingPrice)}
                            </span>
                            {marginPct > 0 && (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                Marg: {marginPct.toFixed(0)}%
                              </span>
                            )}
                          </div>

                          <Button
                            size="sm"
                            disabled={isOutOfStock}
                            variant={inCartQty > 0 ? 'default' : 'outline'}
                            className="w-full h-7 text-xs font-medium rounded-md mt-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isOutOfStock) handleAddToCart(product);
                            }}
                          >
                            <Plus className="size-3 mr-1" />
                            {inCartQty > 0 ? 'Tambah Lagi' : 'Pilih Produk'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cart & Checkout Summary (4 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full bg-card overflow-hidden">
          {/* Cart Header */}
          <div className="p-3 border-b border-border flex items-center justify-between shrink-0 bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">Pesanan Pelanggan</span>
              <Badge variant="secondary" className="text-[10px] font-bold px-1.5">
                {totalItemsCount} pcs
              </Badge>
            </div>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCart}
                className="h-7 text-xs text-muted-foreground hover:text-red-600 px-2"
              >
                <RotateCcw className="size-3 mr-1" />
                Reset
              </Button>
            )}
          </div>

          {/* Customer & Notes Input */}
          <div className="p-2.5 border-b border-border/70 bg-card space-y-2 shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Nama Pelanggan / No. Meja (opsional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-8 text-xs bg-muted/20"
              />
              <Input
                placeholder="Catatan (opsional)"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="h-8 text-xs bg-muted/20"
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <div className="size-14 rounded-full bg-muted/50 flex items-center justify-center mb-3 text-muted-foreground/60">
                  <ShoppingCart className="size-7" />
                </div>
                <p className="font-semibold text-sm text-foreground">Keranjang Masih Kosong</p>
                <p className="text-xs max-w-xs mt-1">
                  Pilih produk dari katalog di sebelah kiri untuk memulai pencatatan transaksi.
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const itemSubtotal = item.price * item.quantity;
                const itemProfit = (item.price - item.cost) * item.quantity;

                return (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-xl border border-border bg-background shadow-2xs hover:border-primary/40 transition-colors flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-xs text-foreground truncate">
                          {item.product.name}
                        </h4>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span>{formatRupiah(item.price)}</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-medium">
                            Laba: +{formatRupiah(itemProfit)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="text-muted-foreground/60 hover:text-red-500 p-1 rounded-md transition-colors"
                        title="Hapus item"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
                      {/* Stepper Buttons */}
                      <div className="flex items-center border border-border rounded-lg bg-muted/30 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product.id, item.quantity - 1)}
                          className="size-6 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.currentStock}
                          className="size-6 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      <span className="font-bold text-xs text-foreground">
                        {formatRupiah(itemSubtotal)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Pricing Summary Footer */}
          <div className="p-3 border-t border-border bg-card shrink-0 space-y-2.5 shadow-lg">
            {/* Subtotal & Discount toggle */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({totalItemsCount} item)</span>
                <span className="font-semibold text-foreground">{formatRupiah(subtotal)}</span>
              </div>

              {/* Discount Input */}
              {showDiscountInput ? (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Diskon:</span>
                  <Input
                    type="number"
                    min="0"
                    max={subtotal}
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                    placeholder="Rp"
                    className="h-7 text-xs w-28 bg-background"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDiscountAmount(0);
                      setShowDiscountInput(false);
                    }}
                    className="h-7 text-[10px] text-muted-foreground px-2"
                  >
                    Batal
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between items-center text-muted-foreground">
                  <button
                    onClick={() => setShowDiscountInput(true)}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    + Tambah Diskon / Promo
                  </button>
                  {discountAmount > 0 && (
                    <span className="text-red-500 font-semibold">
                      -{formatRupiah(discountAmount)}
                    </span>
                  )}
                </div>
              )}

              {/* Estimated Profit Insight */}
              {cart.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-400">
                  <span className="flex items-center gap-1 font-medium">
                    <TrendingUp className="size-3 text-emerald-600" />
                    Estimasi Laba Kotor:
                  </span>
                  <span className="font-bold">
                    {formatRupiah(estimatedGrossProfit)} ({estimatedMarginPct.toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Total Due */}
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground block">Total Tagihan</span>
                <span className="text-lg font-black text-foreground">
                  {formatRupiah(totalBill)}
                </span>
              </div>

              <Button
                size="lg"
                disabled={cart.length === 0}
                onClick={handleOpenPayment}
                className="h-11 px-5 text-sm font-bold shadow-md gap-2"
              >
                <span>Bayar</span>
                <span>{formatRupiah(totalBill)}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Pembayaran Transaksi</DialogTitle>
            <DialogDescription className="text-xs">
              Pilih metode pembayaran dan masukkan jumlah uang yang diterima.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Total Box */}
            <div className="p-3.5 bg-primary/10 border border-primary/20 rounded-xl text-center">
              <span className="text-xs text-muted-foreground block font-medium">Total yang Harus Dibayar</span>
              <span className="text-2xl font-black text-primary block mt-0.5">
                {formatRupiah(totalBill)}
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
                <Input
                  type="text"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0"
                  className="h-10 text-base font-bold text-center bg-background"
                />

                {/* Quick Cash Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
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
                      {formatRupiah(amt).replace(',00', '')}
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
                    {cashReceivedNum >= totalBill
                      ? formatRupiah(cashChange)
                      : formatRupiah(totalBill - cashReceivedNum)}
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
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-500" />
              <span>Transaksi Berhasil Disimpan!</span>
            </DialogTitle>
          </DialogHeader>

          {completedSale && (
            <div className="space-y-4 py-2">
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
                </div>

                {/* Items Table */}
                <div className="space-y-1.5 border-b border-border/80 pb-2">
                  {completedSale.items.map((it) => (
                    <div key={it.id} className="flex justify-between items-baseline text-[11px]">
                      <div className="truncate flex-1 pr-2">
                        <p className="font-medium truncate">{it.productName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {it.quantity} x {formatRupiah(it.priceAtSale)}
                        </p>
                      </div>
                      <span className="font-semibold shrink-0">{formatRupiah(it.subtotal)}</span>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="space-y-1 text-[11px] border-b border-border/80 pb-2">
                  {completedSale.discountAmount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Diskon:</span>
                      <span className="text-red-500">
                        -{formatRupiah(completedSale.discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold pt-1">
                    <span>TOTAL:</span>
                    <span>{formatRupiah(completedSale.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground pt-1">
                    <span>Metode Bayar:</span>
                    <span className="font-semibold">{completedSale.paymentMethod}</span>
                  </div>
                  {completedSale.paymentMethod === 'CASH' && completedSale.cashReceived && (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tunai:</span>
                        <span>{formatRupiah(completedSale.cashReceived)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Kembalian:</span>
                        <span className="font-semibold text-emerald-600">
                          {formatRupiah(completedSale.cashChange || 0)}
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

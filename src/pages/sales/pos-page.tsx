import { variantViews } from '@/features/recipes/services/recipe-service';
import { cartKey } from '@/features/sales/lib/cart';
import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Trash2,
  Pencil,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  QrCode,
  Copy,
  Check,
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
  Globe,
  Utensils,
  ShoppingBag,
} from 'lucide-react';

import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useProductsQuery } from '../../features/recipes/hooks/use-recipes-query';
import { salesService } from '../../features/sales/services/sales-service';
import { customerService } from '../../features/sales/services/customer-service';
import type { CartItem, PaymentMethod, Sale, Customer } from '../../features/sales/types';
import type { Product, ProductVariantView, ModifierOption } from '../../features/recipes/types';
import { useAuthStore } from '../../store/use-auth-store';
import { settingsService } from '@/features/settings/services/settings-service';
import { FeatureGuidanceTour, GuidanceTourTrigger } from '@/features/guidance';

import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
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
import { OnlineOrdersDrawer } from '../../features/sales/components/online-orders-drawer';

function PosSession() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const activeStoreName = useAuthStore((state) => state.activeStoreName);
  const cashierName = user?.name || 'Kasir 1';

  const { data: storeProfile } = useQuery({
    queryKey: ['store-profile'],
    queryFn: () => settingsService.getStoreProfile(),
    staleTime: 5 * 60 * 1000,
  });
  const receiptConfig = storeProfile?.receipt_config || storeProfile?.receiptConfig;
  const paymentConfig = storeProfile?.payment_config || storeProfile?.paymentConfig;

  const isCashEnabled = paymentConfig ? paymentConfig.enable_cash !== false : true;
  const isQrisEnabled = paymentConfig ? Boolean(paymentConfig.enable_qris) : true;
  const isTransferEnabled = paymentConfig ? Boolean(paymentConfig.enable_bank_transfer) : true;

  const { data: products = [], isLoading: loading, isError, refetch } = useProductsQuery();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('ALL');
  const [onlyInStock, setOnlyInStock] = React.useState(false);

  // Cart State
  const [mobileTab, setMobileTab] = React.useState<'catalog' | 'cart'>('catalog');
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [fulfillmentType, setFulfillmentType] = React.useState<'DINE_IN' | 'TAKE_AWAY'>('DINE_IN');
  const [tableNumber, setTableNumber] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [customerName, setCustomerName] = React.useState('');
  const [matchedCustomer, setMatchedCustomer] = React.useState<Customer | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = React.useState(false);
  const [orderNotes, setOrderNotes] = React.useState('');
  const [internalNotes, setInternalNotes] = React.useState('');

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
  const [copiedBankIndex, setCopiedBankIndex] = React.useState<number | null>(null);

  const handleCopyBankAccount = (accNum: string, index: number) => {
    navigator.clipboard.writeText(accNum);
    setCopiedBankIndex(index);
    setTimeout(() => setCopiedBankIndex(null), 2000);
  };

  React.useEffect(() => {
    if (paymentMethod === 'CASH' && !isCashEnabled) {
      if (isQrisEnabled) setPaymentMethod('QRIS');
      else if (isTransferEnabled) setPaymentMethod('TRANSFER');
    } else if (paymentMethod === 'QRIS' && !isQrisEnabled) {
      if (isCashEnabled) setPaymentMethod('CASH');
      else if (isTransferEnabled) setPaymentMethod('TRANSFER');
    } else if (paymentMethod === 'TRANSFER' && !isTransferEnabled) {
      if (isCashEnabled) setPaymentMethod('CASH');
      else if (isQrisEnabled) setPaymentMethod('QRIS');
    }
  }, [paymentMethod, isCashEnabled, isQrisEnabled, isTransferEnabled]);

  // Success / Receipt Modal State
  const [completedSale, setCompletedSale] = React.useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);

  // Online Orders Queue State
  const [isOnlineDrawerOpen, setIsOnlineDrawerOpen] = React.useState(false);
  const [onlineOrders, setOnlineOrders] = React.useState<Sale[]>([]);
  const [isLoadingOnlineOrders, setIsLoadingOnlineOrders] = React.useState(false);

  const fetchOnlineOrders = React.useCallback(async () => {
    try {
      setIsLoadingOnlineOrders(true);
      const list = await salesService.getSales({ per_page: 50 });
      setOnlineOrders(
        list.filter((s) => (s.orderSource || s.order_source) === 'ONLINE')
      );
    } catch {
      // Ignore background fetch error
    } finally {
      setIsLoadingOnlineOrders(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchOnlineOrders();
    const timer = window.setInterval(() => {
      void fetchOnlineOrders();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [fetchOnlineOrders]);

  const pendingOnlineOrders = React.useMemo(
    () => onlineOrders.filter((o) => o.status === 'PENDING_CONFIRMATION'),
    [onlineOrders]
  );

  const activeOnlineOrders = React.useMemo(
    () => onlineOrders.filter((o) => o.status === 'IN_PROGRESS'),
    [onlineOrders]
  );

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
        p.variants.some(v=>v.sku.toLowerCase().includes(query)||v.variantName.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query));
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchStock = !onlyInStock || p.mode==='MAKE_TO_ORDER' || p.variants.some(v=>v.isActive&&v.currentStock>0);
      return p.variants.some(v=>v.isActive) && matchSearch && matchCat && matchStock;
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


  const [configuring, setConfiguring] = React.useState<Product | null>(null);
  const [editingCartKey, setEditingCartKey] = React.useState<string | null>(null);
  const [chosenVariant, setChosenVariant] = React.useState('');
  const [chosenOptions, setChosenOptions] = React.useState<string[]>([]);
  const [checkoutError, setCheckoutError] = React.useState('');
  const configVariant = configuring?.variants.find((v) => v.id === chosenVariant);
  const configGroups = configuring?.mode === 'MAKE_TO_ORDER' ? configuring.modifierGroups : [];
  const configOptions = (configGroups ?? []).flatMap((g) => g.options).filter((o) => chosenOptions.includes(o.id));
  const configValid = Boolean(configVariant?.isActive) && (configuring?.mode === 'MAKE_TO_ORDER' || Number(configVariant?.currentStock) > 0) && (configGroups ?? []).every((g) => { const count = g.options.filter((o) => chosenOptions.includes(o.id)).length; return count >= g.minSelection && count <= g.maxSelection; });

  const commitCart = (product: ProductVariantView, modifiers: ModifierOption[]) => {
    const key = cartKey(product.id, modifiers.map((o) => o.id));
    setCart((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (product.mode === 'MAKE_TO_STOCK' && (existing?.quantity ?? 0) >= product.currentStock) return prev;
      if (existing) return prev.map((item) => item.key === key ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { key, product, modifiers, quantity: 1, price: product.sellingPrice + modifiers.reduce((sum, o) => sum + o.price, 0), cost: product.latestHpp || product.estimatedHpp || 0 }];
    });
  };

  const handleAddToCart = (product: Product) => {
    setEditingCartKey(null);
    const variants = variantViews([product]);
    if (variants.length === 1 && (product.mode === 'MAKE_TO_STOCK' || product.modifierGroups.length === 0)) {
      if (product.mode === 'MAKE_TO_ORDER' || variants[0].currentStock > 0) commitCart(variants[0], []);
      return;
    }
    setChosenVariant((product.variants.find((v) => v.isActive && v.isDefault) ?? product.variants.find((v) => v.isActive))?.id ?? '');
    setChosenOptions([]);
    setConfiguring(product);
  };

  const handleEditCartItem = (item: CartItem) => {
    const parentProduct = products.find((p) => p.id === item.product.productId);
    if (!parentProduct) return;
    setChosenVariant(item.product.id);
    setChosenOptions(item.modifiers.map((m) => m.id));
    setEditingCartKey(item.key);
    setConfiguring(parentProduct);
  };

  const confirmConfiguration = () => {
    if (!configValid || !configuring) return;
    const variant = variantViews([configuring]).find((v) => v.id === chosenVariant);
    if (!variant) return;

    if (editingCartKey) {
      const existingItem = cart.find((c) => c.key === editingCartKey);
      if (!existingItem) {
        commitCart(variant, configOptions);
        setEditingCartKey(null);
        setConfiguring(null);
        return;
      }
      const newKey = cartKey(variant.id, configOptions.map((o) => o.id));
      const newPrice = variant.sellingPrice + configOptions.reduce((sum, o) => sum + o.price, 0);
      const newCost = variant.latestHpp || variant.estimatedHpp || 0;

      if (newKey === editingCartKey) {
        setCart((prev) =>
          prev.map((item) =>
            item.key === editingCartKey
              ? {
                  ...item,
                  product: variant,
                  modifiers: configOptions,
                  price: newPrice,
                  cost: newCost,
                }
              : item
          )
        );
      } else {
        setCart((prev) => {
          const filtered = prev.filter((item) => item.key !== editingCartKey);
          const target = filtered.find((item) => item.key === newKey);
          if (target) {
            const combinedQty = target.quantity + existingItem.quantity;
            const cappedQty =
              variant.mode === 'MAKE_TO_STOCK'
                ? Math.min(combinedQty, variant.currentStock)
                : combinedQty;
            return filtered.map((item) =>
              item.key === newKey ? { ...item, quantity: cappedQty } : item
            );
          }
          const cappedQty =
            variant.mode === 'MAKE_TO_STOCK'
              ? Math.min(existingItem.quantity, variant.currentStock)
              : existingItem.quantity;
          return [
            ...filtered,
            {
              key: newKey,
              product: variant,
              modifiers: configOptions,
              quantity: cappedQty,
              price: newPrice,
              cost: newCost,
            },
          ];
        });
      }
      setEditingCartKey(null);
      setConfiguring(null);
    } else {
      commitCart(variant, configOptions);
      setConfiguring(null);
    }
  };
  const handleUpdateQty=(key:string,newQty:number)=>{if(newQty<=0){handleRemoveItem(key);return;}setCart(prev=>prev.map(item=>item.key===key?{...item,quantity:Math.min(newQty,item.product.mode==='MAKE_TO_ORDER'?Infinity:item.product.currentStock)}:item));};
  const handleRemoveItem=(key:string)=>setCart(prev=>prev.filter(item=>item.key!==key));

  const handleClearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    setCustomerPhone('');
    setCustomerName('');
    setMatchedCustomer(null);
    setOrderNotes('');
    setInternalNotes('');
    setTableNumber('');
    setFulfillmentType('DINE_IN');
  };

  // Payment Handler
  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setCashReceived(String(totalBill)); // default to exact amount
    setCheckoutError('');
    setIsPaymentOpen(true);
  };

  const handleExecutePayment = async () => {
    if (!isCashSufficient) return;

    try {
      setIsProcessing(true);
      const sale = await salesService.createSale({
        customerPhone: customerPhone.trim() || undefined,
        customerName: customerName.trim() || undefined,
        fulfillmentType,
        tableNumber: fulfillmentType === 'DINE_IN' ? tableNumber.trim() || undefined : undefined,
        paymentMethod,
        discountAmount: 0,
        cashReceived: paymentMethod === 'CASH' ? cashReceivedNum : undefined,
        paymentReference: paymentReference.trim() || undefined,
        notes: orderNotes.trim() || undefined,
        internalNotes: internalNotes.trim() || undefined,
        items: cart.map((c) => ({
          variantId: c.product.id,
          modifierOptionIds: c.modifiers.map((o) => o.id),
          quantity: c.quantity,
          priceAtSale: c.price,
          costAtSale: c.cost,
        })),
      });

      setCompletedSale(sale);
      setIsPaymentOpen(false);
      setIsReceiptOpen(true);
      window.dispatchEvent(
        new CustomEvent('guidance-task-success', { detail: { feature: 'pos' } })
      );

      // Reset cart
      setCart([]);
      setCustomerPhone('');
      setCustomerName('');
      setMatchedCustomer(null);
      setOrderNotes('');
      setInternalNotes('');
      setTableNumber('');
      setFulfillmentType('DINE_IN');

      // Refresh product list to show updated stock counts
      void queryClient.invalidateQueries();
    } catch (err) {
      console.error('Failed to create sale', err);
      setCheckoutError(err instanceof Error ? err.message : 'Gagal memproses transaksi. Silakan coba lagi.');
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
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant={pendingOnlineOrders.length > 0 ? 'default' : 'outline'}
            onClick={() => setIsOnlineDrawerOpen(true)}
            className="h-11 shrink-0 gap-2 rounded-xl px-3 text-xs"
          >
            <Globe className="size-4" />
            <span>Pesanan Online</span>
            {(pendingOnlineOrders.length > 0 || activeOnlineOrders.length > 0) && (
              <Badge
                variant={pendingOnlineOrders.length > 0 ? 'secondary' : 'outline'}
                className="px-1.5 py-0 text-[10px]"
              >
                {pendingOnlineOrders.length > 0
                  ? `${pendingOnlineOrders.length} Baru`
                  : activeOnlineOrders.length}
              </Badge>
            )}
          </Button>
          <Button variant="outline" asChild className="h-11 shrink-0 gap-2 rounded-xl px-3 text-xs">
            <Link to="/sales/history" aria-label="Riwayat Transaksi"><History className="size-4" /><span className="hidden sm:inline">Riwayat Transaksi</span></Link>
          </Button>
          <GuidanceTourTrigger feature="pos" />
        </div>
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
        <section data-guidance="pos-catalog" aria-label="Katalog produk" className={`${mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'} min-w-0 flex-col gap-4`}>
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
                const inCartQty = cart.filter(c=>c.product.productId===product.id).reduce((sum,c)=>sum+c.quantity,0);
                const isMTO = product.mode === 'MAKE_TO_ORDER';
                const isOutOfStock = !product.variants.some(v=>v.isActive) || (!isMTO && !product.variants.some(v=>v.isActive&&v.currentStock>0));
                return (
                  <Card key={product.id}
                    className={`group relative min-w-0 gap-0 rounded-2xl border p-0 shadow-none ring-0 transition-colors ${isOutOfStock ? 'border-border bg-muted/40' : inCartQty > 0 ? 'cursor-pointer border-primary/60 bg-card' : 'cursor-pointer border-border bg-card hover:border-primary/40'}`}>
                    <div className={`relative m-2 mb-0 flex items-center justify-center overflow-hidden rounded-xl bg-muted/70 ${product.imageUrl ? 'h-28 sm:h-32' : 'h-16 sm:h-20'}`}>
                      <Package className="size-9 text-muted-foreground/40" strokeWidth={1.25} aria-hidden="true" />
                      {product.imageUrl && <img src={product.imageUrl} alt="" loading="lazy" className={`absolute inset-0 size-full object-cover ${isOutOfStock ? 'grayscale' : ''}`} onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
                      {inCartQty > 0 && <span className="absolute right-2 top-2 flex min-w-6 items-center justify-center rounded-lg bg-primary px-1.5 py-1 text-[11px] font-bold text-primary-foreground">{inCartQty}×</span>}
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <div className="mb-1 flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[10px] text-muted-foreground">{product.variants.filter(v=>v.isActive).length} varian</span>
                        <span className="truncate text-[10px] text-muted-foreground">{product.category || 'Tanpa kategori'}</span>
                      </div>
                      <h3 className="min-h-10 text-sm font-semibold leading-5 [overflow-wrap:anywhere]">{product.name}</h3>
                      <p className="mt-2 text-sm font-bold tabular-nums"><CurrencyText value={Math.min(...product.variants.filter(v=>v.isActive).map(v=>v.sellingPrice))} /></p>
                      <p className={`mt-1 text-[11px] ${isOutOfStock ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {isMTO ? 'Buat saat dipesan' : isOutOfStock ? 'Stok habis' : product.variants.filter(v=>v.isActive).map(v=>`${v.variantName}: ${v.currentStock} ${v.unit}`).join(' · ')}
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

        <section data-guidance="pos-cart" aria-label="Pesanan pelanggan" className={`${mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'} min-w-0 flex-col rounded-2xl border bg-card lg:sticky lg:top-4 h-[calc(100dvh-10rem)] lg:h-[calc(100dvh-13rem)] overflow-hidden`}>
          <div className="flex items-center justify-between gap-2 border-b p-4 shrink-0">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold"><ShoppingCart className="size-4" />Pesanan Pelanggan</h2>
              <p className="mt-1 text-[11px] text-muted-foreground">Kasir: {cashierName} · {totalItemsCount} item</p>
            </div>
            {cart.length > 0 && <Button variant="ghost" size="sm" onClick={handleClearCart} className="h-10 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive"><RotateCcw className="size-3.5" />Reset</Button>}
          </div>

          <div className="p-4 pb-0 lg:hidden shrink-0">
            <Button variant="outline" onClick={() => setMobileTab('catalog')} className="h-10 w-full text-xs">Kembali</Button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 p-4">
            {cart.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">
                <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted"><ShoppingCart className="size-5 text-muted-foreground" /></span>
                <p className="text-sm font-semibold">Keranjang Masih Kosong</p>
                <p className="mt-1.5 max-w-52 text-xs leading-5 text-muted-foreground">Pilih produk dari katalog untuk mulai pesanan pertama.</p>
              </div>
            ) : cart.map((item) => (
              <div key={item.key} className="border-b border-border/70 pb-3 last:border-0 last:pb-0">
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
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" title="Edit item" aria-label={`Edit ${item.product.name}`} onClick={() => handleEditCartItem(item)} className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Pencil className="size-4" /></button>
                    <button type="button" title="Hapus item" aria-label={`Hapus ${item.product.name}`} onClick={() => handleRemoveItem(item.key)} className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 className="size-4" /></button>
                  </div>
                </div>
                {item.modifiers.length>0&&<ul className="mt-1 space-y-1 text-xs text-muted-foreground">{item.modifiers.map(o=><li key={o.id}>+ {o.name} · <CurrencyText value={o.price}/></li>)}</ul>}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center rounded-lg border bg-background">
                    <button type="button" aria-label={`Kurangi ${item.product.name}`} onClick={() => handleUpdateQty(item.key, item.quantity - 1)} className="flex size-10 items-center justify-center rounded-l-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Minus className="size-3.5" /></button>
                    <span className="min-w-7 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                    <button type="button" aria-label={`Tambah ${item.product.name}`} onClick={() => handleUpdateQty(item.key, item.quantity + 1)} disabled={item.product.mode !== 'MAKE_TO_ORDER' && item.quantity >= item.product.currentStock} className="flex size-10 items-center justify-center rounded-r-lg hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Plus className="size-3.5" /></button>
                  </div>
                  <span className="text-sm font-semibold tabular-nums"><CurrencyText value={item.price * item.quantity} /></span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-b-2xl border-t bg-muted/20 p-4 shrink-0">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1">
              <button
                type="button"
                onClick={() => setFulfillmentType('DINE_IN')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                  fulfillmentType === 'DINE_IN'
                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Utensils className="size-3.5" />
                <span>Dine In</span>
              </button>
              <button
                type="button"
                onClick={() => setFulfillmentType('TAKE_AWAY')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                  fulfillmentType === 'TAKE_AWAY'
                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ShoppingBag className="size-3.5" />
                <span>Take Away</span>
              </button>
            </div>
            <div className="flex justify-between gap-2 text-xs text-muted-foreground"><span>Subtotal ({totalItemsCount} item)</span><span className="font-medium text-foreground"><CurrencyText value={subtotal} /></span></div>
            {cart.length > 0 && <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><TrendingUp className="size-3.5" />Estimasi laba kotor</span><span className={estimatedGrossProfit < 0 ? 'text-destructive' : 'font-medium text-foreground'}><CurrencyText value={estimatedGrossProfit} /> ({estimatedMarginPct.toFixed(1)}%)</span></div>}
            <Separator />
            <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">Total Tagihan</span><span className="text-xl font-bold tracking-tight tabular-nums"><CurrencyText value={totalBill} /></span></div>
            <Button
              data-guidance="pos-checkout"
              disabled={cart.length === 0}
              onClick={handleOpenPayment}
              aria-label="Proses Pesanan"
              className="h-12 w-full justify-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-none"
            >
              <span>Proses Pesanan</span>
              <ArrowRight className="size-4" />
            </Button>
            <p className="text-center text-[10px] text-muted-foreground">Tunai, QRIS, atau transfer bank</p>
          </div>
        </section>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent data-guidance="pos-payment-modal" className="sm:max-w-2xl md:max-w-3xl rounded-2xl max-h-[90dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Pembayaran Transaksi</DialogTitle>
            <DialogDescription className="text-xs">
              Lengkapi data pesanan dan selesaikan pembayaran transaksi.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Left Column: Rekap Item Pesanan, Tipe Layanan & Data Pelanggan */}
              <div className="space-y-4">
                {/* Rekap Item yang Dibeli */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    List Pesanan ({totalItemsCount} item)
                  </label>
                  <div className="max-h-48 overflow-y-auto pr-2 space-y-2 rounded-xl border bg-muted/20 p-2.5 text-xs">
                    {cart.map((item) => (
                      <div key={item.key} className="flex items-start justify-between gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">
                            {item.product.productName || item.product.name}
                          </p>
                          {item.product.variantName && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              Varian: {item.product.variantName}
                            </p>
                          )}
                          {item.modifiers.length > 0 && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {item.modifiers.map((o) => `+ ${o.name}`).join(', ')}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground">
                            {item.quantity} x <CurrencyText value={item.price} />
                          </p>
                        </div>
                        <div className="text-right shrink-0 pr-3">
                          <span className="font-semibold text-foreground tabular-nums">
                            <CurrencyText value={item.price * item.quantity} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Type Switcher */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Tipe Layanan</label>
                  <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1">
                    <button
                      type="button"
                      onClick={() => setFulfillmentType('DINE_IN')}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                        fulfillmentType === 'DINE_IN'
                          ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Utensils className="size-3.5" />
                      <span>Dine In</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFulfillmentType('TAKE_AWAY')}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                        fulfillmentType === 'TAKE_AWAY'
                          ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <ShoppingBag className="size-3.5" />
                      <span>Take Away</span>
                    </button>
                  </div>
                </div>

                {/* Data Pelanggan & Meja */}
                <div className="space-y-2.5 rounded-xl border bg-card p-3">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <UserRound className="size-3.5 text-muted-foreground" />
                      Data Pelanggan & Meja
                    </span>
                    <span className="text-[10px] text-muted-foreground">Opsional</span>
                  </div>
                  <div className="space-y-2">
                    <Input
                      aria-label="Nomor HP pelanggan"
                      type="tel"
                      placeholder="No. HP / WA Pelanggan"
                      value={customerPhone}
                      onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                    <Input
                      aria-label="Nama pelanggan"
                      placeholder="Nama Pelanggan (opsional)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                  </div>
                  {customerPhone.trim().length >= 8 && (
                    <div role="status" className="text-[11px] text-muted-foreground">
                      {isSearchingCustomer
                        ? 'Mencari data member...'
                        : matchedCustomer
                        ? `Member: ${matchedCustomer.name} (${matchedCustomer.total_orders ?? 0} pesanan)`
                        : 'Pelanggan baru (tercatat otomatis saat checkout)'}
                    </div>
                  )}
                  {fulfillmentType === 'DINE_IN' && (
                    <Input
                      aria-label="Nomor meja"
                      placeholder="No. Meja (opsional)"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                  )}
                  <Input
                    aria-label="Catatan pesanan"
                    placeholder="Catatan Pesanan (opsional)"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="h-9 text-xs bg-background"
                  />
                  <div className="space-y-1">
                    <Input
                      aria-label="Catatan internal kasir"
                      placeholder="Catatan Internal Kasir / Backoffice (opsional)"
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                    <p className="text-[10px] text-muted-foreground px-0.5">
                      Khusus internal kasir &amp; backoffice, tidak dicetak di struk
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Total Tagihan, Metode Pembayaran & Tombol Eksekusi */}
              <div className="space-y-3.5">
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
                    {isCashEnabled && (
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
                    )}

                    {isQrisEnabled && (
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
                    )}

                    {isTransferEnabled && (
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
                    )}
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
                  <div className="p-4 bg-muted/40 border border-border rounded-xl flex flex-col items-center justify-center text-center space-y-2.5">
                    <div className="size-40 bg-white p-2 rounded-xl border shadow-xs flex items-center justify-center">
                      {paymentConfig?.qris_image_url ? (
                        <img
                          src={paymentConfig.qris_image_url}
                          alt="QRIS"
                          className="size-36 object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <QrCode className="size-32 text-slate-900" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">
                        {paymentConfig?.qris_merchant_name || activeStoreName || storeProfile?.name || 'Scan QRIS Toko'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Mendukung GoPay, OVO, Dana, ShopeePay, BCA, dan seluruh bank
                      </p>
                    </div>
                    {paymentConfig?.payment_instruction && (
                      <p className="text-[11px] text-primary bg-primary/10 p-2 rounded-lg border border-primary/20 w-full text-left">
                        <span className="font-semibold">Petunjuk: </span>{paymentConfig.payment_instruction}
                      </p>
                    )}
                  </div>
                )}

                {/* Transfer Option */}
                {paymentMethod === 'TRANSFER' && (
                  <div className="space-y-3 p-3.5 bg-muted/30 border border-border rounded-xl text-xs">
                    {paymentConfig?.bank_accounts && paymentConfig.bank_accounts.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-[11px] font-semibold text-muted-foreground">Pilihan Rekening Toko:</div>
                        {paymentConfig.bank_accounts.map((acc, index) => (
                          <div
                            key={acc.id || index}
                            className="p-2.5 bg-card border border-border rounded-lg flex items-center justify-between gap-2"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-bold text-xs uppercase text-foreground">{acc.bank_name || 'BANK'}</div>
                              <div className="font-mono text-xs font-semibold text-foreground tracking-wide">
                                {acc.account_number}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                a.n. {acc.account_holder_name}
                              </div>
                            </div>
                            {acc.account_number && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyBankAccount(acc.account_number, index)}
                                className="h-7 px-2 text-[11px] gap-1 shrink-0"
                              >
                                {copiedBankIndex === index ? (
                                  <>
                                    <Check className="size-3 text-emerald-600" />
                                    <span>Tersalin</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="size-3" />
                                    <span>Salin</span>
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-card border border-border/70 text-muted-foreground text-[11px] italic">
                        Belum ada rekening bank yang diatur pada Pengaturan Toko.
                      </div>
                    )}

                    {paymentConfig?.payment_instruction && (
                      <p className="text-[11px] text-primary bg-primary/10 p-2 rounded-lg border border-primary/20">
                        <span className="font-semibold">Petunjuk: </span>{paymentConfig.payment_instruction}
                      </p>
                    )}

                    <div className="pt-1 space-y-1">
                      <label className="text-[11px] font-medium text-foreground">Konfirmasi Bukti Transfer</label>
                      <Input
                        placeholder="No. Referensi / 4 Digit Rekening Pelanggan"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                  </div>
                )}

                {checkoutError && <p role="alert" className="text-sm text-destructive">{checkoutError}</p>}

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
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(configuring)} onOpenChange={open => { if (!open) { setConfiguring(null); setEditingCartKey(null); } }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCartKey ? `Edit: ${configuring?.name}` : configuring?.name}</DialogTitle>
            <DialogDescription>
              {editingCartKey ? 'Ubah varian dan tambahan untuk item pesanan ini.' : 'Pilih varian dan tambahan untuk satu unit produk.'}
            </DialogDescription>
          </DialogHeader>
          <fieldset className="space-y-2">
            <legend className="mb-2 font-medium">Varian</legend>
            {configuring?.variants.filter(v => v.isActive).map(v => {
              const isOutOfStock = configuring.mode === 'MAKE_TO_STOCK' && Number(v.currentStock) <= 0;
              return (
                <label
                  key={v.id}
                  className={
                    isOutOfStock
                      ? "flex min-h-11 items-center justify-between gap-3 rounded-lg border border-dashed border-border/80 bg-muted/40 p-3 text-sm text-muted-foreground opacity-60 cursor-not-allowed"
                      : "flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm cursor-pointer hover:bg-muted/40 transition-colors"
                  }
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="pos-variant"
                      checked={chosenVariant === v.id}
                      disabled={isOutOfStock}
                      onChange={() => setChosenVariant(v.id)}
                    />
                    {v.variantName}
                  </span>
                  <span>
                    <CurrencyText value={v.sellingPrice} />
                    {configuring.mode === 'MAKE_TO_STOCK' && (
                      isOutOfStock ? (
                        <span className="ml-2 font-medium text-destructive text-xs">Stok Habis</span>
                      ) : (
                        <span className="ml-2 text-muted-foreground text-xs">Stok {v.currentStock} {v.unit}</span>
                      )
                    )}
                  </span>
                </label>
              );
            })}
          </fieldset>
          {(configGroups ?? []).map(g => (
            <fieldset key={g.id} className="space-y-2">
              <legend className="mb-2 font-medium">
                {g.name} <span className="text-xs font-normal text-muted-foreground">Pilih {g.minSelection}–{g.maxSelection}</span>
              </legend>
              {g.options.map(o => (
                <label key={o.id} className="flex min-h-11 items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={chosenOptions.includes(o.id)} disabled={!chosenOptions.includes(o.id) && g.options.filter(o => chosenOptions.includes(o.id)).length >= g.maxSelection} onChange={e => setChosenOptions(ids => e.target.checked ? [...ids, o.id] : ids.filter(id => id !== o.id))} />
                    {o.name}
                  </span>
                  <span>+<CurrencyText value={o.price} /></span>
                </label>
              ))}
            </fieldset>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <span className="font-semibold">
              <CurrencyText value={(configVariant?.sellingPrice ?? 0) + configOptions.reduce((sum, o) => sum + o.price, 0)} />
            </span>
            <Button disabled={!configValid} onClick={confirmConfiguration}>
              {editingCartKey ? 'Simpan Perubahan' : 'Tambah ke pesanan'}
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
                className="print-receipt-container bg-card border border-border rounded-xl p-4 font-mono text-xs text-foreground shadow-xs space-y-3"
                data-paper-size={receiptConfig?.paper_size || '58mm'}
              >
                <div className="text-center border-b border-border/80 pb-2.5">
                  <h3 className="font-bold text-sm tracking-tight">{activeStoreName || storeProfile?.name || 'Struk pesanan'}</h3>
                  {receiptConfig?.header_text && (
                    <p className="text-[10px] text-muted-foreground whitespace-pre-wrap">{receiptConfig.header_text}</p>
                  )}
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
                  {receiptConfig?.show_cashier_name !== false && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kasir:</span>
                      <span>{cashierName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pelanggan:</span>
                    <span>{completedSale.customerName}</span>
                  </div>
                  {receiptConfig?.show_customer_phone !== false && (completedSale.customerPhone || completedSale.customer_phone || customerPhone) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">No. HP:</span>
                      <span>{completedSale.customerPhone || completedSale.customer_phone || customerPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipe Layanan:</span>
                    <span className="font-semibold">
                      {(completedSale.fulfillmentType || completedSale.fulfillment_type) === 'TAKE_AWAY'
                        ? 'TAKE AWAY'
                        : 'DINE IN'}
                    </span>
                  </div>
                  {Boolean(completedSale.tableNumber || completedSale.table_number) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">No. Meja:</span>
                      <span className="font-semibold">{completedSale.tableNumber || completedSale.table_number}</span>
                    </div>
                  )}
                  {receiptConfig?.show_notes !== false && (completedSale.notes || orderNotes) && (
                    <div className="flex justify-between text-[10px] text-muted-foreground italic">
                      <span>Catatan:</span>
                      <span>{completedSale.notes || orderNotes}</span>
                    </div>
                  )}
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
 {it.modifiers.map(m=><p key={m.id} className="text-[10px] text-muted-foreground">+ {m.name} · <CurrencyText value={m.price}/></p>)}
                        <p className="text-[10px] text-muted-foreground">
                          {it.quantity} x <CurrencyText value={it.priceAtSale-it.modifiers.reduce((sum,m)=>sum+m.price,0)} />
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

                <div className="text-center pt-1 text-[10px] text-muted-foreground whitespace-pre-wrap">
                  <p>{receiptConfig?.footer_text || 'Terima kasih atas kunjungan Anda!'}</p>
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

      <OnlineOrdersDrawer
        open={isOnlineDrawerOpen}
        onOpenChange={setIsOnlineDrawerOpen}
        pendingOrders={pendingOnlineOrders}
        activeOrders={activeOnlineOrders}
        isLoading={isLoadingOnlineOrders}
        onRefresh={() => void fetchOnlineOrders()}
        onOrderProcessed={() => {
          void fetchOnlineOrders();
          void queryClient.invalidateQueries();
        }}
      />

      <FeatureGuidanceTour feature="pos" />
    </div>
  );
}

export default function PosPage(){const storeId=useAuthStore(s=>s.activeStoreId);return <PosSession key={storeId}/>;}

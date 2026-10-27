import * as React from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Utensils,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CurrencyText } from '@/components/ui/currency-text';
import { ManualPaymentCard } from './manual-payment-card';
import { calculateStorefrontDeliveryFee } from '../lib/default-config';
import { buildStoreInquiryWhatsAppUrl } from '../lib/whatsapp';
import type { PaymentMethod } from '../../sales/types';
import type {
  CreateOnlineOrderRequest,
  FulfillmentType,
  PublicCatalogProduct,
  PublicStoreProfile,
  StorefrontCartItem,
  StorefrontConfig,
} from '../types';

export interface StorefrontRendererProps {
  store: PublicStoreProfile;
  config: StorefrontConfig;
  products: PublicCatalogProduct[];
  categories: string[];
  cart: StorefrontCartItem[];
  viewMode: 'catalog' | 'checkout';
  onViewModeChange: (mode: 'catalog' | 'checkout') => void;
  onSelectProduct: (product: PublicCatalogProduct) => void;
  onUpdateCartQuantity: (key: string, nextQty: number) => void;
  onSubmitOrder?: (payload: CreateOnlineOrderRequest) => Promise<void>;
  isSubmittingOrder?: boolean;
  submitError?: string;
  previewMode?: boolean;
}

export function StorefrontRenderer({
  store,
  config,
  products,
  categories,
  cart,
  viewMode,
  onViewModeChange,
  onSelectProduct,
  onUpdateCartQuantity,
  onSubmitOrder,
  isSubmittingOrder = false,
  submitError = '',
  previewMode = false,
}: StorefrontRendererProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('ALL');

  const enabledFulfillments = React.useMemo<FulfillmentType[]>(() => {
    const list: FulfillmentType[] = [];
    if (config.checkout.allow_dine_in) list.push('DINE_IN');
    if (config.checkout.allow_pickup) list.push('PICKUP');
    if (config.checkout.allow_delivery) list.push('DELIVERY');
    if (list.length === 0) list.push('PICKUP');
    return list;
  }, [
    config.checkout.allow_dine_in,
    config.checkout.allow_pickup,
    config.checkout.allow_delivery,
  ]);

  const enabledPaymentMethods = React.useMemo<PaymentMethod[]>(() => {
    const list: PaymentMethod[] = [];
    if (config.payment.enable_cash_on_cashier) list.push('CASH');
    if (config.payment.enable_qris) list.push('QRIS');
    if (config.payment.enable_bank_transfer) list.push('TRANSFER');
    if (list.length === 0) list.push('CASH');
    return list;
  }, [
    config.payment.enable_cash_on_cashier,
    config.payment.enable_qris,
    config.payment.enable_bank_transfer,
  ]);

  const [fulfillmentType, setFulfillmentType] = React.useState<FulfillmentType>(
    enabledFulfillments[0] || 'PICKUP'
  );
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(
    enabledPaymentMethods[0] || 'CASH'
  );
  const [customerName, setCustomerName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [customerEmail, setCustomerEmail] = React.useState('');
  const [tableNumber, setTableNumber] = React.useState('');
  const [pickupTime, setPickupTime] = React.useState('');
  const [deliveryAddress, setDeliveryAddress] = React.useState('');
  const [customFieldValue, setCustomFieldValue] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [paymentReference, setPaymentReference] = React.useState('');
  const [formError, setFormError] = React.useState('');

  React.useEffect(() => {
    if (!enabledFulfillments.includes(fulfillmentType)) {
      setFulfillmentType(enabledFulfillments[0] || 'PICKUP');
    }
  }, [enabledFulfillments, fulfillmentType]);

  React.useEffect(() => {
    if (!enabledPaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(enabledPaymentMethods[0] || 'CASH');
    }
  }, [enabledPaymentMethods, paymentMethod]);

  const filteredProducts = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat =
        selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const totalItems = React.useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const subtotal = React.useMemo(
    () => cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
    [cart]
  );

  const deliveryFee = React.useMemo(
    () =>
      calculateStorefrontDeliveryFee(
        subtotal,
        fulfillmentType,
        config.checkout.delivery
      ),
    [subtotal, fulfillmentType, config.checkout.delivery]
  );

  const grandTotal = subtotal + deliveryFee;

  const whatsappInquiryUrl = React.useMemo(
    () =>
      buildStoreInquiryWhatsAppUrl(
        config.contact.whatsapp_number || store.phone,
        store.name,
        config.contact.whatsapp_greeting
      ),
    [
      config.contact.whatsapp_number,
      config.contact.whatsapp_greeting,
      store.phone,
      store.name,
    ]
  );

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (previewMode) {
      return;
    }

    if (cart.length === 0) {
      setFormError('Keranjang pesanan masih kosong.');
      return;
    }
    if (!customerName.trim()) {
      setFormError('Nama lengkap pemesan wajib diisi.');
      return;
    }
    if (!customerPhone.trim()) {
      setFormError('Nomor WhatsApp aktif wajib diisi.');
      return;
    }
    if (
      config.checkout.show_email_field &&
      config.checkout.require_email_field &&
      !customerEmail.trim()
    ) {
      setFormError('Alamat email wajib diisi untuk pengiriman bukti pesanan.');
      return;
    }
    if (fulfillmentType === 'DINE_IN' && !tableNumber.trim()) {
      setFormError('Nomor meja wajib diisi untuk pesanan makan di tempat.');
      return;
    }
    if (fulfillmentType === 'DELIVERY' && !deliveryAddress.trim()) {
      setFormError('Alamat pengiriman lengkap wajib diisi.');
      return;
    }
    if (
      config.checkout.custom_field_enabled &&
      config.checkout.custom_field_required &&
      !customFieldValue.trim()
    ) {
      setFormError(
        `Kolom "${config.checkout.custom_field_label}" wajib diisi.`
      );
      return;
    }

    await onSubmitOrder?.({
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_email: customerEmail.trim() || undefined,
      fulfillment_type: fulfillmentType,
      table_number:
        fulfillmentType === 'DINE_IN' ? tableNumber.trim() : undefined,
      delivery_address:
        fulfillmentType === 'DELIVERY' ? deliveryAddress.trim() : undefined,
      pickup_time:
        fulfillmentType === 'PICKUP' ? pickupTime.trim() : undefined,
      custom_field_label: config.checkout.custom_field_enabled
        ? config.checkout.custom_field_label
        : undefined,
      custom_field_value:
        config.checkout.custom_field_enabled && customFieldValue.trim()
          ? customFieldValue.trim()
          : undefined,
      payment_method: paymentMethod,
      payment_reference: paymentReference.trim() || undefined,
      notes: notes.trim() || undefined,
      items: cart.map((item) => ({
        variant_id: item.variantId,
        modifier_option_ids: item.modifiers.map((m) => m.id),
        quantity: item.quantity,
      })),
    });
  };

  const renderStoreSection = (sectionId: string) => {
    switch (sectionId) {
      case 'announcement_bar': {
        if (!config.copywriting.announcement_text.trim()) return null;
        return (
          <div
            key="announcement_bar"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-accent px-3.5 py-2.5 text-center text-xs font-medium text-accent-foreground"
          >
            <Sparkles className="size-3.5 shrink-0 text-primary" />
            <span>{config.copywriting.announcement_text}</span>
          </div>
        );
      }

      case 'hero_banner': {
        const heroLayout = config.theme.hero_layout || 'SPLIT_SHOWCASE';
        const showHeroImage = config.theme.show_hero_image !== false;
        const brandName = config.copywriting.brand_name || store.name;
        const brandTagline = config.copywriting.brand_tagline;
        const heroTitle = config.copywriting.hero_title || store.name;
        const heroSubtitle =
          config.copywriting.hero_subtitle || store.description;
        const highlights = (config.copywriting.hero_highlights || []).filter(
          (item) => item && item.trim() !== ''
        );
        const primaryCtaText =
          config.copywriting.hero_primary_cta_text || 'Lihat Menu & Pesan';
        const secondaryCtaText =
          config.copywriting.hero_secondary_cta_text || 'Hubungi WhatsApp';
        const isCentered = heroLayout === 'CENTERED_STORY';

        const scrollToCatalog = () => {
          const el = document.getElementById('storefront-catalog-section');
          if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        };

        const renderHeroImageBlock = (heightClass: string) => {
          if (!showHeroImage) return null;
          if (config.theme.banner_url) {
            return (
              <div
                className={`relative w-full overflow-hidden rounded-lg border border-border bg-muted ${heightClass}`}
              >
                <img
                  src={config.theme.banner_url}
                  alt={brandName}
                  className="size-full object-cover"
                />
              </div>
            );
          }

          return (
            <div
              className={`flex flex-col items-center justify-center rounded-lg border border-border bg-accent/50 p-6 text-center ${heightClass}`}
            >
              {config.theme.logo_url ? (
                <img
                  src={config.theme.logo_url}
                  alt={brandName}
                  className="size-16 rounded-lg border border-border bg-background object-cover shadow-xs"
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-lg border border-border bg-primary text-primary-foreground shadow-xs">
                  <Store className="size-8" />
                </div>
              )}
              <p className="mt-3 text-sm font-bold text-foreground">
                {brandName}
              </p>
              {brandTagline && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {brandTagline}
                </p>
              )}
              <Badge variant="secondary" className="mt-3 text-[10px]">
                {store.category || 'Official Storefront'}
              </Badge>
            </div>
          );
        };

        const renderIntroCopy = () => (
          <div
            className={`flex flex-col justify-center space-y-3.5 ${
              isCentered ? 'items-center text-center' : 'items-start text-left'
            }`}
          >
            <div
              className={`flex flex-wrap items-center gap-2.5 ${
                isCentered ? 'justify-center' : ''
              }`}
            >
              {config.theme.logo_url ? (
                <img
                  src={config.theme.logo_url}
                  alt={brandName}
                  className="size-11 shrink-0 rounded-lg border border-border bg-background object-cover"
                />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-primary/10 text-primary">
                  <Store className="size-5" />
                </div>
              )}
              <div className={isCentered ? 'text-center' : 'text-left'}>
                <span className="block text-xs font-bold tracking-wide text-foreground uppercase">
                  {brandName}
                </span>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">
                    {store.category || 'Toko Resmi'}
                  </Badge>
                  {brandTagline && (
                    <Badge variant="outline" className="text-[10px]">
                      {brandTagline}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
                {heroTitle}
              </h1>
              {heroSubtitle && (
                <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {heroSubtitle}
                </p>
              )}
            </div>

            {highlights.length > 0 && (
              <div
                className={`flex flex-wrap gap-2 pt-0.5 ${
                  isCentered ? 'justify-center' : ''
                }`}
              >
                {highlights.map((point, idx) => (
                  <span
                    key={`${point}-${idx}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-foreground"
                  >
                    <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                    <span>{point}</span>
                  </span>
                ))}
              </div>
            )}

            <div
              className={`flex flex-wrap items-center gap-2.5 pt-1 ${
                isCentered ? 'justify-center' : ''
              }`}
            >
              <Button
                type="button"
                onClick={scrollToCatalog}
                className="h-10 gap-1.5 px-4 text-xs font-semibold"
              >
                <span>{primaryCtaText}</span>
                <ArrowDown className="size-3.5" />
              </Button>
              {whatsappInquiryUrl && (
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="h-10 gap-1.5 px-4 text-xs font-semibold"
                >
                  <a
                    href={whatsappInquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="size-3.5 text-success" />
                    <span>{secondaryCtaText}</span>
                  </a>
                </Button>
              )}
            </div>
          </div>
        );

        return (
          <Card key="hero_banner" className="overflow-hidden py-0">
            {heroLayout === 'COVER_BANNER' && showHeroImage && (
              <div className="p-3 pb-0 sm:p-5 sm:pb-0">
                {renderHeroImageBlock('h-44 sm:h-60')}
              </div>
            )}

            <CardContent className="p-4 sm:p-6">
              {heroLayout === 'SPLIT_SHOWCASE' && showHeroImage ? (
                <div className="grid items-center gap-5 lg:grid-cols-12">
                  <div className="lg:col-span-7">{renderIntroCopy()}</div>
                  <div className="lg:col-span-5">
                    {renderHeroImageBlock('h-52 sm:h-64')}
                  </div>
                </div>
              ) : heroLayout === 'CENTERED_STORY' ? (
                <div className="mx-auto max-w-2xl space-y-5">
                  {renderIntroCopy()}
                  {showHeroImage && renderHeroImageBlock('h-48 sm:h-64')}
                </div>
              ) : (
                renderIntroCopy()
              )}
            </CardContent>
          </Card>
        );
      }

      case 'info_and_contact': {
        return (
          <Card key="info_and_contact" className="py-3.5">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 px-4">
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {(store.location || store.address) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0 text-primary" />
                    <span>{store.location || store.address}</span>
                  </span>
                )}
                {config.contact.operational_hours && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5 shrink-0 text-primary" />
                    <span>{config.contact.operational_hours}</span>
                  </span>
                )}
              </div>

              {whatsappInquiryUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-9 gap-1.5 text-xs"
                >
                  <a
                    href={whatsappInquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="size-3.5 text-success" />
                    Tanya via WhatsApp
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        );
      }

      case 'product_catalog': {
        const isListLayout =
          config.theme.catalog_layout === 'list' ||
          config.template_style === 'EXPRESS_MENU';

        return (
          <section
            key="product_catalog"
            id="storefront-catalog-section"
            aria-label="Katalog Produk"
            className="space-y-3"
          >
            <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  Daftar Menu & Produk
                </h2>
                <span className="text-xs text-muted-foreground">
                  {filteredProducts.length} menu tersedia
                </span>
              </div>

              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari menu favorit Anda..."
                  aria-label="Cari produk"
                  className="h-10 pl-9 pr-9 text-xs sm:text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Bersihkan pencarian"
                    className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {categories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('ALL')}
                    className={`min-h-9 rounded-md px-3 text-xs font-medium transition-colors ${
                      selectedCategory === 'ALL'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Semua Menu
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`min-h-9 rounded-md px-3 text-xs font-medium transition-colors ${
                        selectedCategory === cat
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-6 text-center">
                <Package className="mb-2 size-7 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">
                  Menu tidak ditemukan
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Coba gunakan kata kunci pencarian atau kategori lain.
                </p>
              </div>
            ) : (
              <div
                className={
                  isListLayout
                    ? 'grid grid-cols-1 gap-2.5 sm:grid-cols-2'
                    : 'grid grid-cols-2 gap-3 sm:grid-cols-3'
                }
              >
                {filteredProducts.map((product) => {
                  const isMTO = product.mode === 'MAKE_TO_ORDER';
                  const activeVariants = product.variants.filter(
                    (v) => v.is_active
                  );
                  const isOutOfStock =
                    activeVariants.length === 0 ||
                    (!isMTO &&
                      !activeVariants.some((v) => v.current_stock > 0));
                  const minPrice =
                    activeVariants.length > 0
                      ? Math.min(...activeVariants.map((v) => v.selling_price))
                      : 0;
                  const qtyInCart = cart
                    .filter((c) => c.productId === product.id)
                    .reduce((acc, c) => acc + c.quantity, 0);

                  if (isListLayout) {
                    return (
                      <Card
                        key={product.id}
                        className={`flex flex-row items-center gap-3 p-3 ${
                          isOutOfStock ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                          <Package className="size-6 text-muted-foreground/40" />
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              loading="lazy"
                              className="absolute inset-0 size-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[10px] text-muted-foreground">
                              {product.category}
                            </span>
                            {isMTO && (
                              <Badge
                                variant="secondary"
                                className="px-1.5 py-0 text-[9px]"
                              >
                                Fresh / Pre-Order
                              </Badge>
                            )}
                          </div>
                          <h3 className="truncate text-sm font-semibold text-foreground">
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                              {product.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-sm font-bold tabular-nums text-foreground">
                              <CurrencyText value={minPrice} />
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              disabled={isOutOfStock}
                              variant={qtyInCart > 0 ? 'default' : 'outline'}
                              onClick={() => onSelectProduct(product)}
                              className="h-8 gap-1 px-2.5 text-xs"
                            >
                              <Plus className="size-3.5" />
                              {isOutOfStock
                                ? 'Habis'
                                : qtyInCart > 0
                                ? `${qtyInCart} Dipilih`
                                : 'Tambah'}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  }

                  return (
                    <Card
                      key={product.id}
                      className={`flex flex-col justify-between gap-0 overflow-hidden p-0 ${
                        isOutOfStock ? 'opacity-60' : ''
                      }`}
                    >
                      <div>
                        <div className="relative flex h-32 w-full items-center justify-center overflow-hidden bg-muted sm:h-36">
                          <Package className="size-8 text-muted-foreground/40" />
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              loading="lazy"
                              className="absolute inset-0 size-full object-cover"
                            />
                          )}
                          {qtyInCart > 0 && (
                            <Badge className="absolute right-2 top-2 text-[10px]">
                              {qtyInCart}x
                            </Badge>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">
                              {product.category}
                            </span>
                            {isMTO && (
                              <Badge
                                variant="secondary"
                                className="px-1.5 py-0 text-[9px]"
                              >
                                Pre-Order
                              </Badge>
                            )}
                          </div>
                          <h3 className="mt-1 line-clamp-2 text-xs font-semibold text-foreground sm:text-sm">
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="p-3 pt-0">
                        <p className="text-sm font-bold tabular-nums text-foreground">
                          <CurrencyText value={minPrice} />
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isOutOfStock}
                          variant={qtyInCart > 0 ? 'default' : 'outline'}
                          onClick={() => onSelectProduct(product)}
                          className="mt-2 h-9 w-full gap-1 text-xs"
                        >
                          <Plus className="size-3.5" />
                          {isOutOfStock
                            ? 'Stok Habis'
                            : qtyInCart > 0
                            ? 'Tambah Lagi'
                            : 'Pilih Menu'}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        );
      }

      case 'payment_and_order_info': {
        return (
          <Card key="payment_and_order_info" className="py-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Informasi Pembayaran & Pengiriman
              </CardTitle>
              <CardDescription className="text-xs">
                Metode pembayaran resmi dan ketentuan pengiriman toko kami
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex flex-wrap gap-1.5">
                {config.payment.enable_cash_on_cashier && (
                  <Badge variant="secondary">Tunai / Kasir</Badge>
                )}
                {config.payment.enable_qris && (
                  <Badge variant="secondary">QRIS Resmi</Badge>
                )}
                {config.payment.enable_bank_transfer && (
                  <Badge variant="secondary">Transfer Bank</Badge>
                )}
                {config.checkout.allow_dine_in && (
                  <Badge variant="outline">Makan di Tempat</Badge>
                )}
                {config.checkout.allow_pickup && (
                  <Badge variant="outline">Ambil di Toko (Pickup)</Badge>
                )}
                {config.checkout.allow_delivery && (
                  <Badge variant="outline">Pesan Antar (Delivery)</Badge>
                )}
              </div>

              {config.checkout.allow_delivery && (
                <div className="rounded-md border border-border bg-muted/40 p-2.5 text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <Truck className="size-3.5 text-primary" />
                    <span>Ketentuan Pengiriman Kurir:</span>
                  </div>
                  <p className="mt-1">
                    {config.checkout.delivery.delivery_fee_mode === 'FLAT_RATE'
                      ? `Tarif pengiriman flat Rp ${config.checkout.delivery.flat_delivery_fee.toLocaleString('id-ID')}${
                          config.checkout.delivery.free_delivery_min_order > 0
                            ? ` (Gratis ongkir min. belanja Rp ${config.checkout.delivery.free_delivery_min_order.toLocaleString('id-ID')})`
                            : ''
                        }.`
                      : 'Ongkos kirim dikonfirmasi oleh kasir sesuai jarak alamat pengiriman.'}{' '}
                    {config.checkout.delivery.delivery_instruction}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      }

      default:
        return null;
    }
  };

  const renderCheckoutSection = (sectionId: string) => {
    switch (sectionId) {
      case 'order_summary': {
        return (
          <Card key="order_summary" className="py-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Ringkasan Pesanan</CardTitle>
              <CardDescription className="text-xs">
                Periksa kembali item dan jumlah pesanan Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Belum ada item di keranjang.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {cart.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground">
                          {item.productName} — {item.variantName}
                        </p>
                        {item.modifiers.length > 0 && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            + {item.modifiers.map((m) => m.name).join(', ')}
                          </p>
                        )}
                        <p className="mt-1 text-xs font-bold tabular-nums text-foreground">
                          <CurrencyText
                            value={item.unitPrice * item.quantity}
                          />
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          onClick={() =>
                            onUpdateCartQuantity(item.key, item.quantity - 1)
                          }
                          aria-label="Kurangi jumlah"
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-6 text-center text-xs font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          onClick={() =>
                            onUpdateCartQuantity(item.key, item.quantity + 1)
                          }
                          aria-label="Tambah jumlah"
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal ({totalItems} item)</span>
                  <span className="font-medium tabular-nums text-foreground">
                    <CurrencyText value={subtotal} />
                  </span>
                </div>

                {fulfillmentType === 'DELIVERY' && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Ongkos Kirim</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {config.checkout.delivery.delivery_fee_mode ===
                      'COURIER_CONFIRMATION' ? (
                        <Badge variant="outline" className="text-[10px]">
                          Dikonfirmasi Kasir
                        </Badge>
                      ) : deliveryFee === 0 ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Gratis Ongkir
                        </Badge>
                      ) : (
                        <CurrencyText value={deliveryFee} />
                      )}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-sm font-bold text-foreground">
                  <span>Total Tagihan</span>
                  <span className="tabular-nums">
                    <CurrencyText value={grandTotal} />
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }

      case 'fulfillment_method': {
        return (
          <Card key="fulfillment_method" className="py-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Metode Penerimaan Pesanan
              </CardTitle>
              <CardDescription className="text-xs">
                Pilih cara Anda menerima pesanan ini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {config.checkout.allow_dine_in && (
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('DINE_IN')}
                    className={`flex min-h-11 items-center gap-2.5 rounded-lg border p-3 text-left text-xs font-semibold transition-colors ${
                      fulfillmentType === 'DINE_IN'
                        ? 'border-primary bg-accent/60 text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Utensils className="size-4 shrink-0 text-primary" />
                    <span>Makan di Tempat</span>
                  </button>
                )}

                {config.checkout.allow_pickup && (
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('PICKUP')}
                    className={`flex min-h-11 items-center gap-2.5 rounded-lg border p-3 text-left text-xs font-semibold transition-colors ${
                      fulfillmentType === 'PICKUP'
                        ? 'border-primary bg-accent/60 text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <ShoppingBag className="size-4 shrink-0 text-primary" />
                    <span>Ambil di Toko</span>
                  </button>
                )}

                {config.checkout.allow_delivery && (
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('DELIVERY')}
                    className={`flex min-h-11 items-center gap-2.5 rounded-lg border p-3 text-left text-xs font-semibold transition-colors ${
                      fulfillmentType === 'DELIVERY'
                        ? 'border-primary bg-accent/60 text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Truck className="size-4 shrink-0 text-primary" />
                    <span>Pesan Antar (Kurir)</span>
                  </button>
                )}
              </div>

              {fulfillmentType === 'DINE_IN' && (
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-table" className="text-xs font-medium text-foreground">
                    Nomor Meja <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="checkout-table"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Contoh: Meja 04 / Outdoor 2"
                    className="h-11 text-sm"
                  />
                </div>
              )}

              {fulfillmentType === 'PICKUP' &&
                config.checkout.show_pickup_time && (
                  <div className="space-y-1.5">
                    <Label htmlFor="checkout-pickup-time" className="text-xs font-medium text-foreground">
                      Perkiraan Waktu Ambil (Opsional)
                    </Label>
                    <Input
                      id="checkout-pickup-time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      placeholder="Contoh: Pukul 14:30 / 30 menit lagi"
                      className="h-11 text-sm"
                    />
                  </div>
                )}

              {fulfillmentType === 'DELIVERY' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="checkout-address" className="text-xs font-medium text-foreground">
                      Alamat Lengkap Pengiriman{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="checkout-address"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, dan patokan lokasi..."
                      rows={3}
                      className="min-h-24 text-sm"
                    />
                  </div>

                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Info Pengiriman:{' '}
                    </span>
                    {config.checkout.delivery.delivery_instruction ||
                      'Pesanan akan dikirimkan setelah dikonfirmasi oleh kasir.'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      }

      case 'customer_identity': {
        return (
          <Card key="customer_identity" className="py-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {config.copywriting.customer_section_title ||
                  'Data Pembeli'}
              </CardTitle>
              <CardDescription className="text-xs">
                Digunakan oleh kasir untuk konfirmasi dan pengiriman status pesanan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="checkout-name" className="text-xs font-medium text-foreground">
                  Nama Lengkap <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="checkout-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="h-11 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="checkout-phone" className="text-xs font-medium text-foreground">
                  Nomor WhatsApp Aktif{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="checkout-phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="h-11 text-sm"
                />
              </div>

              {config.checkout.show_email_field && (
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-email" className="text-xs font-medium text-foreground">
                    Alamat Email{' '}
                    {config.checkout.require_email_field ? (
                      <span className="text-destructive">*</span>
                    ) : (
                      <span className="text-muted-foreground">(Opsional)</span>
                    )}
                  </Label>
                  <Input
                    id="checkout-email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="nama@email.com (untuk terima bukti pesanan & link pelacakan)"
                    className="h-11 text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      }

      case 'custom_field_and_notes': {
        if (
          !config.checkout.custom_field_enabled &&
          !config.checkout.show_notes_field
        ) {
          return null;
        }
        return (
          <Card key="custom_field_and_notes" className="py-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Catatan & Permintaan Tambahan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.checkout.custom_field_enabled && (
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-custom-field" className="text-xs font-medium text-foreground">
                    {config.checkout.custom_field_label}{' '}
                    {config.checkout.custom_field_required && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  <Input
                    id="checkout-custom-field"
                    value={customFieldValue}
                    onChange={(e) => setCustomFieldValue(e.target.value)}
                    placeholder={config.checkout.custom_field_placeholder}
                    className="h-11 text-sm"
                  />
                </div>
              )}

              {config.checkout.show_notes_field && (
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-notes" className="text-xs font-medium text-foreground">
                    Catatan Pesanan (Opsional)
                  </Label>
                  <Textarea
                    id="checkout-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={config.copywriting.notes_placeholder}
                    rows={3}
                    className="min-h-24 text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      }

      case 'payment_showcase': {
        return (
          <Card key="payment_showcase" className="py-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cara Pembayaran</CardTitle>
              <CardDescription className="text-xs">
                Pilih cara pembayaran yang paling mudah untuk Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ManualPaymentCard
                paymentConfig={config.payment}
                selectedMethod={paymentMethod}
                onSelectMethod={setPaymentMethod}
                totalAmount={grandTotal}
              />

              {paymentMethod !== 'CASH' && (
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="checkout-pay-ref" className="text-xs font-medium text-foreground">
                    Nama Pengirim Rekening / Catatan Bayar (Opsional)
                  </Label>
                  <Input
                    id="checkout-pay-ref"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Contoh: Transfer a.n. Budi Santoso BCA"
                    className="h-11 text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      className="storefront-scope min-h-full w-full transition-colors"
      data-accent={config.theme.accent_color}
      data-surface={config.theme.surface_mode}
      data-radius={config.theme.border_radius}
    >
      <div className="mx-auto max-w-4xl space-y-4 px-3 py-4 sm:px-6 sm:py-6">
        {viewMode === 'catalog' ? (
          <>
            {config.store_sections
              .filter((section) => section.enabled)
              .map((section) => renderStoreSection(section.id))}

            {totalItems > 0 && (
              <div className="sticky bottom-3 z-20 flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-md">
                <div className="min-w-0">
                  <span className="block text-[11px] text-muted-foreground">
                    {totalItems} item di keranjang
                  </span>
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    <CurrencyText value={subtotal} />
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={() => onViewModeChange('checkout')}
                  className="h-11 gap-2 px-4 text-xs font-semibold"
                >
                  <ShoppingBag className="size-4" />
                  Lanjut ke Checkout
                </Button>
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleCheckoutSubmit} className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 sm:p-4">
              <div className="min-w-0">
                <h1 className="text-base font-bold text-foreground sm:text-lg">
                  {config.copywriting.checkout_title}
                </h1>
                {config.copywriting.checkout_subtitle && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {config.copywriting.checkout_subtitle}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onViewModeChange('catalog')}
                className="h-9 shrink-0 gap-1.5 text-xs"
              >
                <ArrowLeft className="size-3.5" />
                Kembali ke Menu
              </Button>
            </div>

            {(formError || submitError) && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{formError || submitError}</span>
              </div>
            )}

            {config.checkout_sections
              .filter((section) => section.enabled)
              .map((section) => renderCheckoutSection(section.id))}

            <div className="sticky bottom-3 z-20 flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-md sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="block text-[11px] text-muted-foreground">
                  Total Pembayaran ({totalItems} item)
                </span>
                <span className="text-base font-bold tabular-nums text-foreground">
                  <CurrencyText value={grandTotal} />
                </span>
              </div>
              <Button
                type="submit"
                disabled={isSubmittingOrder || (!previewMode && cart.length === 0)}
                className="h-11 gap-2 px-6 text-xs font-semibold sm:text-sm"
              >
                {isSubmittingOrder && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {config.copywriting.submit_button_text ||
                  'Kirim Pesanan Sekarang'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

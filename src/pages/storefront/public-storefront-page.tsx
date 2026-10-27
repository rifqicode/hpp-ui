import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2,
  MessageCircle,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CurrencyText } from '@/components/ui/currency-text';
import { StorefrontRenderer } from '@/features/storefront/components/storefront-renderer';
import { storefrontService } from '@/features/storefront/services/storefront-service';
import { buildStoreInquiryWhatsAppUrl } from '@/features/storefront/lib/whatsapp';
import type {
  CreateOnlineOrderRequest,
  PublicCatalogProduct,
  PublicStorefrontResponse,
  StorefrontCartItem,
} from '@/features/storefront/types';

function buildCartItemKey(variantId: string, modifierIds: string[]): string {
  return `${variantId}::${[...modifierIds].sort().join(',')}`;
}

export default function PublicStorefrontPage() {
  const { storeSlug = '' } = useParams<{ storeSlug: string }>();
  const navigate = useNavigate();

  const [data, setData] = React.useState<PublicStorefrontResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'catalog' | 'checkout'>('catalog');
  const [cart, setCart] = React.useState<StorefrontCartItem[]>([]);

  // Product Variant / Modifier Dialog state
  const [configuringProduct, setConfiguringProduct] =
    React.useState<PublicCatalogProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = React.useState<string>('');
  const [selectedModifierIds, setSelectedModifierIds] = React.useState<
    string[]
  >([]);

  // Order Submission state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState('');

  const storageKey = `hpp_storefront_cart_${storeSlug}`;

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }, [storageKey]);

  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {
      // Ignore storage write errors
    }
  }, [cart, storageKey]);

  const loadStorefront = React.useCallback(async () => {
    if (!storeSlug) return;
    try {
      setLoading(true);
      setError('');
      const res = await storefrontService.getPublicStorefront(storeSlug);
      setData(res);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Toko tidak ditemukan atau sedang tidak aktif.'
      );
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  React.useEffect(() => {
    void loadStorefront();
  }, [loadStorefront]);

  const commitAddToCart = (
    product: PublicCatalogProduct,
    variantId: string,
    modifierOptionIds: string[]
  ) => {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) return;

    const allOptions = product.modifier_groups.flatMap((g) => g.options);
    const chosenModifiers = allOptions.filter((o) =>
      modifierOptionIds.includes(o.id)
    );
    const modifiersPrice = chosenModifiers.reduce((acc, m) => acc + m.price, 0);
    const unitPrice = variant.selling_price + modifiersPrice;
    const key = buildCartItemKey(variant.id, modifierOptionIds);
    const maxStock =
      product.mode === 'MAKE_TO_ORDER' ? 999 : variant.current_stock;

    setCart((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        if (existing.quantity >= maxStock) return prev;
        return prev.map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          productName: product.name,
          productMode: product.mode,
          imageUrl: product.image_url,
          variantId: variant.id,
          variantName: variant.variant_name,
          unit: variant.unit,
          basePrice: variant.selling_price,
          unitPrice,
          maxStock,
          quantity: 1,
          modifiers: chosenModifiers,
        },
      ];
    });
  };

  const handleSelectProduct = (product: PublicCatalogProduct) => {
    const activeVariants = product.variants.filter((v) => v.is_active);
    if (activeVariants.length === 0) return;

    const hasModifiers =
      product.mode === 'MAKE_TO_ORDER' && product.modifier_groups.length > 0;

    if (activeVariants.length === 1 && !hasModifiers) {
      const single = activeVariants[0];
      if (product.mode === 'MAKE_TO_ORDER' || single.current_stock > 0) {
        commitAddToCart(product, single.id, []);
      }
      return;
    }

    const defaultVariant =
      activeVariants.find((v) => v.is_default) || activeVariants[0];
    setSelectedVariantId(defaultVariant?.id || '');
    setSelectedModifierIds([]);
    setConfiguringProduct(product);
  };

  const handleUpdateCartQuantity = (key: string, nextQty: number) => {
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((item) => item.key !== key));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, quantity: Math.min(nextQty, item.maxStock) }
          : item
      )
    );
  };

  const activeVariantInModal = configuringProduct?.variants.find(
    (v) => v.id === selectedVariantId
  );
  const modalModifierGroups =
    configuringProduct?.mode === 'MAKE_TO_ORDER'
      ? configuringProduct.modifier_groups
      : [];

  const isModalValid = React.useMemo(() => {
    if (!configuringProduct || !activeVariantInModal) return false;
    if (
      configuringProduct.mode === 'MAKE_TO_STOCK' &&
      activeVariantInModal.current_stock <= 0
    ) {
      return false;
    }
    return modalModifierGroups.every((group) => {
      const count = group.options.filter((o) =>
        selectedModifierIds.includes(o.id)
      ).length;
      return count >= group.min_selection && count <= group.max_selection;
    });
  }, [
    configuringProduct,
    activeVariantInModal,
    modalModifierGroups,
    selectedModifierIds,
  ]);

  const handleConfirmModal = () => {
    if (!configuringProduct || !isModalValid) return;
    commitAddToCart(configuringProduct, selectedVariantId, selectedModifierIds);
    setConfiguringProduct(null);
  };

  const handleSubmitOrder = async (payload: CreateOnlineOrderRequest) => {
    try {
      setIsSubmitting(true);
      setSubmitError('');
      const created = await storefrontService.createOnlineOrder(
        storeSlug,
        payload
      );
      setCart([]);
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Ignore
      }
      navigate(`/s/${storeSlug}/orders/${created.public_tracking_token}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Gagal mengirim pesanan. Silakan periksa kembali data Anda.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <div className="flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span className="text-xs font-medium text-muted-foreground">
            Memuat halaman toko...
          </span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
          <Store className="size-6" />
        </div>
        <h1 className="mt-4 text-base font-bold text-foreground sm:text-lg">
          Halaman Toko Tidak Tersedia
        </h1>
        <p className="mt-1 max-w-md text-xs text-muted-foreground sm:text-sm">
          {error ||
            'Toko online yang Anda cari belum diaktifkan atau alamat tautan tidak ditemukan.'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadStorefront()}
          className="mt-4 h-9 text-xs"
        >
          Muat Ulang Halaman
        </Button>
      </div>
    );
  }

  const { store, products, categories } = data;
  const config = store.storefront_config;
  const floatingWaUrl = config.contact.show_floating_whatsapp
    ? buildStoreInquiryWhatsAppUrl(
        config.contact.whatsapp_number || store.phone,
        store.name,
        config.contact.whatsapp_greeting
      )
    : '';

  return (
    <div className="min-h-screen bg-background">
      <StorefrontRenderer
        store={store}
        config={config}
        products={products}
        categories={categories}
        cart={cart}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSelectProduct={handleSelectProduct}
        onUpdateCartQuantity={handleUpdateCartQuantity}
        onSubmitOrder={handleSubmitOrder}
        isSubmittingOrder={isSubmitting}
        submitError={submitError}
      />

      {floatingWaUrl && viewMode === 'catalog' && (
        <div className="fixed bottom-20 right-4 z-30 sm:bottom-6 sm:right-6">
          <Button
            asChild
            size="sm"
            className="h-10 gap-2 rounded-full px-4 text-xs font-semibold shadow-md"
          >
            <a href={floatingWaUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" />
              Chat Toko
            </a>
          </Button>
        </div>
      )}

      <Dialog
        open={Boolean(configuringProduct)}
        onOpenChange={(open) => !open && setConfiguringProduct(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{configuringProduct?.name}</DialogTitle>
            <DialogDescription className="text-xs">
              Pilih varian dan tambahan menu sebelum memasukkan ke keranjang
            </DialogDescription>
          </DialogHeader>

          {configuringProduct && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground">
                  Pilih Varian
                </span>
                <div className="grid gap-2">
                  {configuringProduct.variants
                    .filter((v) => v.is_active)
                    .map((variant) => {
                      const out =
                        configuringProduct.mode === 'MAKE_TO_STOCK' &&
                        variant.current_stock <= 0;
                      const isChosen = selectedVariantId === variant.id;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          disabled={out}
                          onClick={() => setSelectedVariantId(variant.id)}
                          className={`flex min-h-11 items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                            out
                              ? 'border-border bg-muted/40 opacity-50'
                              : isChosen
                              ? 'border-primary bg-accent/60 font-semibold text-foreground'
                              : 'border-border bg-card text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <div>
                            <span className="block">{variant.variant_name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {configuringProduct.mode === 'MAKE_TO_ORDER'
                                ? 'Buat saat dipesan'
                                : out
                                ? 'Stok habis'
                                : `Stok tersedia: ${variant.current_stock} ${variant.unit}`}
                            </span>
                          </div>
                          <span className="font-bold tabular-nums">
                            <CurrencyText value={variant.selling_price} />
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {modalModifierGroups.map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      {group.name}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {group.min_selection > 0
                        ? `Wajib ${group.min_selection}-${group.max_selection}`
                        : `Maks ${group.max_selection}`}
                    </Badge>
                  </div>
                  <div className="grid gap-1.5">
                    {group.options.map((option) => {
                      const checked = selectedModifierIds.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setSelectedModifierIds((prev) => {
                              if (checked) {
                                return prev.filter((id) => id !== option.id);
                              }
                              const groupIds = group.options.map((o) => o.id);
                              const currentCount = prev.filter((id) =>
                                groupIds.includes(id)
                              ).length;
                              if (group.max_selection === 1) {
                                return [
                                  ...prev.filter((id) => !groupIds.includes(id)),
                                  option.id,
                                ];
                              }
                              if (currentCount >= group.max_selection) {
                                return prev;
                              }
                              return [...prev, option.id];
                            });
                          }}
                          className={`flex min-h-10 items-center justify-between rounded-md border px-3 py-1.5 text-xs transition-colors ${
                            checked
                              ? 'border-primary bg-accent/60 font-medium text-foreground'
                              : 'border-border bg-card text-foreground hover:bg-muted/40'
                          }`}
                        >
                          <span>{option.name}</span>
                          <span className="tabular-nums text-muted-foreground">
                            +<CurrencyText value={option.price} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfiguringProduct(null)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={!isModalValid}
              onClick={handleConfirmModal}
              className="text-xs font-semibold"
            >
              Masukkan ke Keranjang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

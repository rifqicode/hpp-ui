import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Loader2,
  Palette,
  Plus,
  QrCode,
  Save,
  Sparkles,
  Trash2,
  Upload,
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
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionDndList } from '@/features/storefront/components/section-dnd-list';
import { StorefrontRenderer } from '@/features/storefront/components/storefront-renderer';
import {
  CHECKOUT_SECTION_METADATA,
  normalizeStorefrontConfig,
  slugifyStoreName,
  STORE_SECTION_METADATA,
} from '@/features/storefront/lib/default-config';
import { storefrontService } from '@/features/storefront/services/storefront-service';
import { settingsService } from '@/features/settings/services/settings-service';
import { useAuthStore } from '@/store/use-auth-store';
import type { StoreInfo } from '@/features/settings/types';
import type {
  PublicCatalogProduct,
  StorefrontAccentColor,
  StorefrontBorderRadius,
  StorefrontCartItem,
  StorefrontCatalogLayout,
  StorefrontConfig,
  StorefrontDeliveryFeeMode,
  StorefrontHeroLayout,
  StorefrontSurfaceMode,
  StorefrontTemplateStyle,
} from '@/features/storefront/types';

export interface StorefrontBuilderPageProps {
  initialStore?: StoreInfo | null;
}

const PREVIEW_SAMPLE_PRODUCTS: PublicCatalogProduct[] = [
  {
    id: 'sample-1',
    name: 'Kopi Susu Gula Aren Signature',
    category: 'Minuman Kopi',
    mode: 'MAKE_TO_ORDER',
    image_url: null,
    description:
      'Espresso arabika pilihan dengan susu segar dan gula aren organik.',
    variants: [
      {
        id: 'var-1',
        product_id: 'sample-1',
        variant_name: 'Regular Cup',
        sku: 'KOP-REG',
        unit: 'cup',
        selling_price: 22000,
        current_stock: 25,
        is_default: true,
        is_active: true,
      },
    ],
    modifier_groups: [],
  },
  {
    id: 'sample-2',
    name: 'Croissant Butter Artisan',
    category: 'Pastry & Bakery',
    mode: 'MAKE_TO_STOCK',
    image_url: null,
    description:
      'Croissant renyah berlapis dengan french butter panggang harian.',
    variants: [
      {
        id: 'var-2',
        product_id: 'sample-2',
        variant_name: 'Original',
        sku: 'CRO-ORI',
        unit: 'pcs',
        selling_price: 28000,
        current_stock: 12,
        is_default: true,
        is_active: true,
      },
    ],
    modifier_groups: [],
  },
];

const PREVIEW_SAMPLE_CART: StorefrontCartItem[] = [
  {
    key: 'sample-cart-1',
    productId: 'sample-1',
    productName: 'Kopi Susu Gula Aren Signature',
    productMode: 'MAKE_TO_ORDER',
    imageUrl: null,
    variantId: 'var-1',
    variantName: 'Regular Cup',
    unit: 'cup',
    basePrice: 22000,
    unitPrice: 22000,
    maxStock: 99,
    quantity: 2,
    modifiers: [],
  },
];

export default function StorefrontBuilderPage({
  initialStore,
}: StorefrontBuilderPageProps = {}) {
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const [store, setStore] = React.useState<StoreInfo | null>(
    initialStore ?? null
  );
  const [isLoadingStore, setIsLoadingStore] = React.useState<boolean>(
    initialStore === undefined
  );

  React.useEffect(() => {
    if (initialStore !== undefined) {
      setStore(initialStore);
      setIsLoadingStore(false);
      return;
    }
    let mounted = true;
    const loadStore = async () => {
      try {
        setIsLoadingStore(true);
        const profile = await settingsService.getStoreProfile();
        if (mounted) {
          setStore(profile);
        }
      } catch {
        // Fallback to default state if network fails
      } finally {
        if (mounted) {
          setIsLoadingStore(false);
        }
      }
    };
    void loadStore();
    return () => {
      mounted = false;
    };
  }, [initialStore, activeStoreId]);

  const initialSlug = React.useMemo(
    () => store?.slug || slugifyStoreName(store?.name || 'toko-kami'),
    [store?.slug, store?.name]
  );

  const [slug, setSlug] = React.useState(initialSlug);
  const [isActive, setIsActive] = React.useState<boolean>(
    Boolean(store?.isStorefrontActive ?? store?.is_storefront_active ?? false)
  );
  const [config, setConfig] = React.useState<StorefrontConfig>(() =>
    normalizeStorefrontConfig(
      store?.storefrontConfig ?? store?.storefront_config,
      store?.name || 'Toko Kami',
      store?.phone || ''
    )
  );

  React.useEffect(() => {
    if (store) {
      setSlug(store.slug || slugifyStoreName(store.name || 'toko-kami'));
      setIsActive(
        Boolean(store.isStorefrontActive ?? store.is_storefront_active ?? false)
      );
      setConfig(
        normalizeStorefrontConfig(
          store.storefrontConfig ?? store.storefront_config,
          store.name,
          store.phone || ''
        )
      );
    }
  }, [store]);

  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState('');
  const [saveError, setSaveError] = React.useState('');
  const [uploadingField, setUploadingField] = React.useState<
    'logo' | 'banner' | 'qris' | null
  >(null);
  const [previewModeTab, setPreviewModeTab] = React.useState<
    'catalog' | 'checkout'
  >('catalog');

  const publicUrl = `${window.location.origin}/s/${slug || 'toko'}`;

  const handleUploadImage = async (
    field: 'logo' | 'banner' | 'qris',
    file?: File
  ) => {
    if (!file) return;
    try {
      setUploadingField(field);
      setSaveError('');
      const uploadedUrl = await storefrontService.uploadStorefrontImage(file);
      if (field === 'logo') {
        setConfig((prev) => ({
          ...prev,
          theme: { ...prev.theme, logo_url: uploadedUrl },
        }));
      } else if (field === 'banner') {
        setConfig((prev) => ({
          ...prev,
          theme: { ...prev.theme, banner_url: uploadedUrl },
        }));
      } else if (field === 'qris') {
        setConfig((prev) => ({
          ...prev,
          payment: { ...prev.payment, qris_image_url: uploadedUrl },
        }));
      }
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Gagal mengunggah gambar.'
      );
    } finally {
      setUploadingField(null);
    }
  };

  const handleAddBankAccount = () => {
    setConfig((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        bank_accounts: [
          ...prev.payment.bank_accounts,
          {
            id: `bank-${Date.now()}`,
            bank_name: 'BCA',
            account_number: '',
            account_holder_name: store?.name || '',
          },
        ],
      },
    }));
  };

  const handleUpdateBankAccount = (
    id: string,
    key: 'bank_name' | 'account_number' | 'account_holder_name',
    val: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        bank_accounts: prev.payment.bank_accounts.map((acc) =>
          acc.id === id ? { ...acc, [key]: val } : acc
        ),
      },
    }));
  };

  const handleRemoveBankAccount = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        bank_accounts: prev.payment.bank_accounts.filter(
          (acc) => acc.id !== id
        ),
      },
    }));
  };

  const handleSaveStorefront = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedSlug = slugifyStoreName(slug || store?.name || 'toko-kami');

    try {
      setIsSaving(true);
      setSaveError('');
      setSaveSuccess('');
      await storefrontService.updateStorefrontSettings({
        slug: cleanedSlug,
        is_storefront_active: isActive,
        storefront_config: config,
      });
      setSlug(cleanedSlug);
      setSaveSuccess('Tampilan & pengaturan checkout berhasil disimpan!');
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan pengaturan toko online.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingStore) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <div className="flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2 shadow-xs">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Memuat editor toko online...
          </span>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSaveStorefront}
      className="w-full min-w-0 space-y-5 pb-8"
    >
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="space-y-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            asChild
            className="-ml-2 h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link to="/settings/store?tab=storefront">
              <ArrowLeft className="size-3.5" />
              Kembali ke Pengaturan Toko
            </Link>
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Palette className="size-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Kustomisasi Toko Online & Checkout
              </h1>
              <p className="text-xs text-muted-foreground">
                Atur gaya tampilan, banner perkenalan, metode layanan, dan pembayaran sambil melihat pratinjau langsung di sebelah kanan.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            asChild
            className="h-11 gap-1.5 px-4 text-xs font-medium"
          >
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Buka Toko
            </a>
          </Button>

          <Button
            type="submit"
            disabled={isSaving}
            className="h-11 gap-2 px-5 text-xs font-semibold"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Simpan Perubahan
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-accent p-3.5 text-xs font-medium text-accent-foreground">
          <CheckCircle2 className="size-4 shrink-0 text-success" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Full-Width Side-by-Side Workspace */}
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-4 lg:col-span-5">
          <Tabs
            defaultValue="appearance"
            onValueChange={(val) => {
              if (val === 'checkout' || val === 'payment') {
                setPreviewModeTab('checkout');
              } else if (val === 'appearance') {
                setPreviewModeTab('catalog');
              }
            }}
            className="space-y-4"
          >
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1.5 sm:grid-cols-3">
              <TabsTrigger value="appearance" className="h-9 text-xs">
                1. Tampilan
              </TabsTrigger>
              <TabsTrigger value="sections" className="h-9 text-xs">
                2. Urutan Bagian
              </TabsTrigger>
              <TabsTrigger value="checkout" className="h-9 text-xs">
                3. Layanan & Ongkir
              </TabsTrigger>
              <TabsTrigger value="payment" className="h-9 text-xs">
                4. Pembayaran
              </TabsTrigger>
              <TabsTrigger value="copywriting" className="h-9 text-xs">
                5. Teks & Kontak
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Tampilan */}
            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Gaya Tampilan & Foto Toko
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Pilih model katalog, warna tombol, serta unggah logo dan foto sampul toko Anda.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5 p-4 sm:p-5">
                  <section className="space-y-3 first:border-t-0 first:pt-0">
                    <Label className="text-xs font-medium text-foreground">
                      Model Halaman Toko
                    </Label>
                    <div className="space-y-2.5">
                      {(
                        [
                          {
                            id: 'EXPRESS_MENU',
                            title: 'Menu Cepat (F&B & Warung)',
                            desc: 'Daftar menu ringkas agar pembeli bisa langsung memilih dan memesan.',
                          },
                          {
                            id: 'VISUAL_CATALOG',
                            title: 'Katalog Foto Besar',
                            desc: 'Menampilkan foto produk lebih besar, cocok untuk roti, kue, atau hampers.',
                          },
                          {
                            id: 'PRE_ORDER_STORY',
                            title: 'Cerita Toko & Pre-Order',
                            desc: 'Menonjolkan profil usaha dan informasi pemesanan di bagian atas.',
                          },
                        ] as {
                          id: StorefrontTemplateStyle;
                          title: string;
                          desc: string;
                        }[]
                      ).map((tpl) => {
                        const selected = config.template_style === tpl.id;
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() =>
                              setConfig((prev) => ({
                                ...prev,
                                template_style: tpl.id,
                              }))
                            }
                            className={`flex w-full flex-col items-start rounded-xl border p-3.5 text-left transition-colors ${
                              selected
                                ? 'border-primary bg-accent/60'
                                : 'border-border bg-card hover:bg-muted/40'
                            }`}
                          >
                            <div className="flex w-full items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-foreground">
                                {tpl.title}
                              </span>
                              {selected && (
                                <Badge variant="default" className="text-[10px]">
                                  Dipilih
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {tpl.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="space-y-4 border-t border-border pt-5">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="theme-accent-select"
                        className="text-xs font-medium text-foreground"
                      >
                        Warna Utama Tombol & Sorotan
                      </Label>
                      <select
                        id="theme-accent-select"
                        value={config.theme.accent_color}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: {
                              ...prev.theme,
                              accent_color: e.target
                                .value as StorefrontAccentColor,
                            },
                          }))
                        }
                        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="default">
                          Biru Indigo (Standar Aplikasi)
                        </option>
                        <option value="emerald">Hijau Segar (Emerald)</option>
                        <option value="teal">Biru Toska (Teal)</option>
                        <option value="amber">
                          Kuning Hangat (Cocok untuk Roti/Kopi)
                        </option>
                        <option value="rose">Merah Muda (Rose)</option>
                        <option value="slate">Hitam Abu Minimalis</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="theme-surface-select"
                        className="text-xs font-medium text-foreground"
                      >
                        Warna Latar Halaman
                      </Label>
                      <select
                        id="theme-surface-select"
                        value={config.theme.surface_mode}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: {
                              ...prev.theme,
                              surface_mode: e.target
                                .value as StorefrontSurfaceMode,
                            },
                          }))
                        }
                        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="light">Putih Bersih</option>
                        <option value="warm">Krem Hangat</option>
                        <option value="dark">Gelap (Dark Mode)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="theme-catalog-layout"
                        className="text-xs font-medium text-foreground"
                      >
                        Bentuk Daftar Menu
                      </Label>
                      <select
                        id="theme-catalog-layout"
                        value={config.theme.catalog_layout}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: {
                              ...prev.theme,
                              catalog_layout: e.target
                                .value as StorefrontCatalogLayout,
                            },
                          }))
                        }
                        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="grid">Kotak Foto (2-3 Kolom)</option>
                        <option value="list">Daftar Memanjang ke Bawah</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="theme-radius-select"
                        className="text-xs font-medium text-foreground"
                      >
                        Lengkungan Sudut Kartu & Tombol
                      </Label>
                      <select
                        id="theme-radius-select"
                        value={config.theme.border_radius}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: {
                              ...prev.theme,
                              border_radius: e.target
                                .value as StorefrontBorderRadius,
                            },
                          }))
                        }
                        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="rounded">Sedang (Standar)</option>
                        <option value="sharp">Kotak Tegas</option>
                        <option value="pill">Sangat Membulat</option>
                      </select>
                    </div>
                  </section>

                  <section className="space-y-4 border-t border-border pt-5">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="theme-hero-layout"
                        className="text-xs font-medium text-foreground"
                      >
                        Tata Letak Bagian Atas (Perkenalan Toko)
                      </Label>
                      <select
                        id="theme-hero-layout"
                        value={config.theme.hero_layout}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: {
                              ...prev.theme,
                              hero_layout: e.target
                                .value as StorefrontHeroLayout,
                            },
                          }))
                        }
                        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="SPLIT_SHOWCASE">
                          Teks & Foto Berdampingan
                        </option>
                        <option value="COVER_BANNER">
                          Foto Sampul di Atas
                        </option>
                        <option value="CENTERED_STORY">
                          Tampilan Rata Tengah
                        </option>
                      </select>
                    </div>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3.5">
                      <div>
                        <span className="block text-xs font-semibold text-foreground">
                          Tampilkan Kotak Foto Sampul di Bagian Atas
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Matikan jika Anda hanya ingin menampilkan teks perkenalan toko.
                        </span>
                      </div>
                      <Switch
                        checked={config.theme.show_hero_image}
                        onCheckedChange={(checked) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: {
                              ...prev.theme,
                              show_hero_image: checked,
                            },
                          }))
                        }
                      />
                    </label>
                  </section>

                  {/* Stacked Media Control: Logo Toko */}
                  <section className="space-y-3 border-t border-border pt-5">
                    <Label className="text-xs font-medium text-foreground">
                      Logo Toko
                    </Label>
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
                      {config.theme.logo_url ? (
                        <img
                          src={config.theme.logo_url}
                          alt="Logo Toko"
                          className="size-12 shrink-0 rounded-lg border border-border bg-background object-cover"
                        />
                      ) : (
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-background text-muted-foreground">
                          <ImageIcon className="size-5" />
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-xs font-medium text-foreground hover:bg-muted">
                          {uploadingField === 'logo' ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Upload className="size-3.5" />
                          )}
                          <span>Pilih Foto Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              void handleUploadImage(
                                'logo',
                                e.target.files?.[0]
                              )
                            }
                          />
                        </label>
                        {config.theme.logo_url && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setConfig((prev) => ({
                                ...prev,
                                theme: { ...prev.theme, logo_url: '' },
                              }))
                            }
                            className="h-10 text-xs text-destructive hover:text-destructive"
                          >
                            Hapus Foto
                          </Button>
                        )}
                      </div>
                    </div>
                    <Input
                      value={config.theme.logo_url}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          theme: { ...prev.theme, logo_url: e.target.value },
                        }))
                      }
                      placeholder="Atau tempel link gambar logo (https://...)"
                      className="h-11 text-sm"
                    />
                  </section>

                  {/* Stacked Media Control: Foto Sampul */}
                  <section className="space-y-3 border-t border-border pt-5">
                    <Label className="text-xs font-medium text-foreground">
                      Foto Sampul Toko (Banner Atas)
                    </Label>
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
                      {config.theme.banner_url ? (
                        <img
                          src={config.theme.banner_url}
                          alt="Foto Sampul"
                          className="h-12 w-20 shrink-0 rounded-lg border border-border bg-background object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-background text-muted-foreground">
                          <ImageIcon className="size-5" />
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-xs font-medium text-foreground hover:bg-muted">
                          {uploadingField === 'banner' ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Upload className="size-3.5" />
                          )}
                          <span>Pilih Foto Sampul</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              void handleUploadImage(
                                'banner',
                                e.target.files?.[0]
                              )
                            }
                          />
                        </label>
                        {config.theme.banner_url && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setConfig((prev) => ({
                                ...prev,
                                theme: { ...prev.theme, banner_url: '' },
                              }))
                            }
                            className="h-10 text-xs text-destructive hover:text-destructive"
                          >
                            Hapus Foto
                          </Button>
                        )}
                      </div>
                    </div>
                    <Input
                      value={config.theme.banner_url}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          theme: { ...prev.theme, banner_url: e.target.value },
                        }))
                      }
                      placeholder="Atau tempel link foto sampul (https://...)"
                      className="h-11 text-sm"
                    />
                  </section>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Urutan Bagian */}
            <TabsContent value="sections" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Urutan Bagian Halaman Toko
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Gunakan tombol panah atas/bawah atau geser untuk mengatur urutan tampilan, dan sakelar untuk menyembunyikan bagian tertentu.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  <SectionDndList
                    items={config.store_sections}
                    metadata={STORE_SECTION_METADATA}
                    lockedIds={['product_catalog']}
                    onChange={(next) =>
                      setConfig((prev) => ({ ...prev, store_sections: next }))
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Urutan Bagian Halaman Checkout
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Atur urutan pengisian data saat pembeli menyelesaikan pesanan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  <SectionDndList
                    items={config.checkout_sections}
                    metadata={CHECKOUT_SECTION_METADATA}
                    lockedIds={[
                      'order_summary',
                      'customer_identity',
                      'payment_showcase',
                    ]}
                    onChange={(next) =>
                      setConfig((prev) => ({
                        ...prev,
                        checkout_sections: next,
                      }))
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Layanan & Ongkir */}
            <TabsContent value="checkout" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Layanan Pesanan & Aturan Ongkir
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Pilih cara pesanan diterima pembeli serta pengaturan ongkos kirim.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5 p-4 sm:p-5">
                  <section className="space-y-3 first:border-t-0 first:pt-0">
                    <Label className="text-xs font-medium text-foreground">
                      Cara Terima Pesanan yang Disediakan
                    </Label>
                    <div className="space-y-2.5">
                      <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5">
                        <div>
                          <span className="block text-xs font-semibold text-foreground sm:text-sm">
                            Makan di Tempat (Dine-in)
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            Pembeli mengisi nomor meja saat memesan
                          </span>
                        </div>
                        <Switch
                          checked={config.checkout.allow_dine_in}
                          onCheckedChange={(v) =>
                            setConfig((prev) => ({
                              ...prev,
                              checkout: { ...prev.checkout, allow_dine_in: v },
                            }))
                          }
                        />
                      </label>

                      <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5">
                        <div>
                          <span className="block text-xs font-semibold text-foreground sm:text-sm">
                            Ambil Sendiri di Toko (Pickup)
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            Pembeli datang mengambil pesanan yang sudah siap
                          </span>
                        </div>
                        <Switch
                          checked={config.checkout.allow_pickup}
                          onCheckedChange={(v) =>
                            setConfig((prev) => ({
                              ...prev,
                              checkout: { ...prev.checkout, allow_pickup: v },
                            }))
                          }
                        />
                      </label>

                      <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5">
                        <div>
                          <span className="block text-xs font-semibold text-foreground sm:text-sm">
                            Diantar Kurir (Delivery)
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            Pembeli mengisi alamat lengkap pengiriman
                          </span>
                        </div>
                        <Switch
                          checked={config.checkout.allow_delivery}
                          onCheckedChange={(v) =>
                            setConfig((prev) => ({
                              ...prev,
                              checkout: { ...prev.checkout, allow_delivery: v },
                            }))
                          }
                        />
                      </label>
                    </div>
                  </section>

                  <section className="space-y-4 border-t border-border pt-5">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-foreground">
                        Aturan Ongkos Kirim (Jika Diantar Kurir)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Pilih apakah ongkos kirim dihitung otomatis atau diinfokan lewat kasir.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="delivery-fee-mode-select"
                        className="text-xs font-medium text-foreground"
                      >
                        Cara Hitung Ongkos Kirim
                      </Label>
                      <select
                        id="delivery-fee-mode-select"
                        value={config.checkout.delivery.delivery_fee_mode}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            checkout: {
                              ...prev.checkout,
                              delivery: {
                                ...prev.checkout.delivery,
                                delivery_fee_mode: e.target
                                  .value as StorefrontDeliveryFeeMode,
                              },
                            },
                          }))
                        }
                        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="FLAT_RATE">
                          Tarif Flat Otomatis (Satu Harga)
                        </option>
                        <option value="COURIER_CONFIRMATION">
                          Dikonfirmasi Kasir Sesuai Jarak / Ojek Online
                        </option>
                      </select>
                    </div>

                    {config.checkout.delivery.delivery_fee_mode ===
                      'FLAT_RATE' && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-foreground">
                            Biaya Ongkir Flat (Rp)
                          </Label>
                          <FormattedNumberInput
                            value={String(
                              config.checkout.delivery.flat_delivery_fee
                            )}
                            onValueChange={(vals) =>
                              setConfig((prev) => ({
                                ...prev,
                                checkout: {
                                  ...prev.checkout,
                                  delivery: {
                                    ...prev.checkout.delivery,
                                    flat_delivery_fee: vals.floatValue || 0,
                                  },
                                },
                              }))
                            }
                            placeholder="10000"
                            className="h-11 text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-foreground">
                            Minimal Belanja Gratis Ongkir (Isi 0 jika tidak ada)
                          </Label>
                          <FormattedNumberInput
                            value={String(
                              config.checkout.delivery.free_delivery_min_order
                            )}
                            onValueChange={(vals) =>
                              setConfig((prev) => ({
                                ...prev,
                                checkout: {
                                  ...prev.checkout,
                                  delivery: {
                                    ...prev.checkout.delivery,
                                    free_delivery_min_order:
                                      vals.floatValue || 0,
                                  },
                                },
                              }))
                            }
                            placeholder="0"
                            className="h-11 text-sm"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">
                        Keterangan Pengiriman untuk Pembeli
                      </Label>
                      <Input
                        value={config.checkout.delivery.delivery_instruction}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            checkout: {
                              ...prev.checkout,
                              delivery: {
                                ...prev.checkout.delivery,
                                delivery_instruction: e.target.value,
                              },
                            },
                          }))
                        }
                        placeholder="Contoh: Dikirim kurir toko (maks. 5 km) atau GoSend Instant."
                        className="h-11 text-sm"
                      />
                    </div>
                  </section>

                  <section className="space-y-3 border-t border-border pt-5">
                    <Label className="text-xs font-medium text-foreground">
                      Kolom Data Pembeli & Pertanyaan Tambahan
                    </Label>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5">
                      <div>
                        <span className="block text-xs font-semibold text-foreground sm:text-sm">
                          Tampilkan Kolom Email Pembeli
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Pembeli otomatis mendapat email bukti pesanan & info kurir
                        </span>
                      </div>
                      <Switch
                        checked={config.checkout.show_email_field}
                        onCheckedChange={(v) =>
                          setConfig((prev) => ({
                            ...prev,
                            checkout: {
                              ...prev.checkout,
                              show_email_field: v,
                            },
                          }))
                        }
                      />
                    </label>

                    {config.checkout.show_email_field && (
                      <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5">
                        <div>
                          <span className="block text-xs font-semibold text-foreground sm:text-sm">
                            Wajibkan Pembeli Mengisi Email
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            Jika dinyalakan, kolom email tidak boleh dikosongkan
                          </span>
                        </div>
                        <Switch
                          checked={config.checkout.require_email_field}
                          onCheckedChange={(v) =>
                            setConfig((prev) => ({
                              ...prev,
                              checkout: {
                                ...prev.checkout,
                                require_email_field: v,
                              },
                            }))
                          }
                        />
                      </label>
                    )}

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5">
                      <div>
                        <span className="block text-xs font-semibold text-foreground sm:text-sm">
                          Tanyakan Perkiraan Jam Ambil (Pickup)
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Pembeli bisa menulis jam berapa pesanan akan diambil
                        </span>
                      </div>
                      <Switch
                        checked={config.checkout.show_pickup_time}
                        onCheckedChange={(v) =>
                          setConfig((prev) => ({
                            ...prev,
                            checkout: {
                              ...prev.checkout,
                              show_pickup_time: v,
                            },
                          }))
                        }
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5">
                      <div>
                        <span className="block text-xs font-semibold text-foreground sm:text-sm">
                          Pertanyaan Tambahan untuk Pembeli
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Contoh: Ucapan di kartu hampers atau tanggal acara
                        </span>
                      </div>
                      <Switch
                        checked={config.checkout.custom_field_enabled}
                        onCheckedChange={(v) =>
                          setConfig((prev) => ({
                            ...prev,
                            checkout: {
                              ...prev.checkout,
                              custom_field_enabled: v,
                            },
                          }))
                        }
                      />
                    </label>

                    {config.checkout.custom_field_enabled && (
                      <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-foreground">
                            Judul Pertanyaan
                          </Label>
                          <Input
                            value={config.checkout.custom_field_label}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                checkout: {
                                  ...prev.checkout,
                                  custom_field_label: e.target.value,
                                },
                              }))
                            }
                            placeholder="Contoh: Ucapan Kartu / Permintaan Khusus"
                            className="h-11 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-foreground">
                            Contoh Jawaban (Placeholder)
                          </Label>
                          <Input
                            value={config.checkout.custom_field_placeholder}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                checkout: {
                                  ...prev.checkout,
                                  custom_field_placeholder: e.target.value,
                                },
                              }))
                            }
                            placeholder="Contoh: Selamat ulang tahun..."
                            className="h-11 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </section>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 4: Pembayaran */}
            <TabsContent value="payment" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Cara Pembayaran yang Diterima
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tampilkan pilihan bayar tunai, kode QRIS toko, dan nomor rekening bank tanpa potongan biaya admin.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5 p-4 sm:p-5">
                  {/* 1. Tunai */}
                  <section className="space-y-3 first:border-t-0 first:pt-0">
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5">
                      <div>
                        <span className="block text-xs font-semibold text-foreground sm:text-sm">
                          Bayar di Kasir (Tunai)
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Pembeli membayar saat pesanan diambil atau diterima
                        </span>
                      </div>
                      <Switch
                        checked={config.payment.enable_cash_on_cashier}
                        onCheckedChange={(v) =>
                          setConfig((prev) => ({
                            ...prev,
                            payment: {
                              ...prev.payment,
                              enable_cash_on_cashier: v,
                            },
                          }))
                        }
                      />
                    </label>

                    {config.payment.enable_cash_on_cashier && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-foreground">
                          Petunjuk Bayar Tunai
                        </Label>
                        <Input
                          value={config.payment.cash_instruction}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              payment: {
                                ...prev.payment,
                                cash_instruction: e.target.value,
                              },
                            }))
                          }
                          placeholder="Contoh: Bayar langsung di kasir saat mengambil pesanan."
                          className="h-11 text-sm"
                        />
                      </div>
                    )}
                  </section>

                  {/* 2. QRIS Toko */}
                  <section className="space-y-3 border-t border-border pt-5">
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5">
                      <div>
                        <span className="block text-xs font-semibold text-foreground sm:text-sm">
                          QRIS Toko
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Tampilkan gambar kode QRIS agar bisa di-scan pembeli
                        </span>
                      </div>
                      <Switch
                        checked={config.payment.enable_qris}
                        onCheckedChange={(v) =>
                          setConfig((prev) => ({
                            ...prev,
                            payment: { ...prev.payment, enable_qris: v },
                          }))
                        }
                      />
                    </label>

                    {config.payment.enable_qris && (
                      <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-foreground">
                            Nama Toko yang Tertera di QRIS
                          </Label>
                          <Input
                            value={config.payment.qris_merchant_name}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                payment: {
                                  ...prev.payment,
                                  qris_merchant_name: e.target.value,
                                },
                              }))
                            }
                            placeholder="Contoh: KOPI SENJA NUSANTARA"
                            className="h-11 text-sm"
                          />
                        </div>

                        <div className="space-y-2.5">
                          <Label className="text-xs font-medium text-foreground">
                            Foto Kode QRIS
                          </Label>
                          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background p-3">
                            {config.payment.qris_image_url ? (
                              <img
                                src={config.payment.qris_image_url}
                                alt="QRIS Toko"
                                className="size-16 shrink-0 rounded-lg border border-border object-contain p-1"
                              />
                            ) : (
                              <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
                                <QrCode className="size-6" />
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-xs font-medium text-foreground hover:bg-muted">
                                {uploadingField === 'qris' ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Upload className="size-3.5" />
                                )}
                                <span>Pilih Foto QRIS</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    void handleUploadImage(
                                      'qris',
                                      e.target.files?.[0]
                                    )
                                  }
                                />
                              </label>
                              {config.payment.qris_image_url && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setConfig((prev) => ({
                                      ...prev,
                                      payment: {
                                        ...prev.payment,
                                        qris_image_url: '',
                                      },
                                    }))
                                  }
                                  className="h-10 text-xs text-destructive hover:text-destructive"
                                >
                                  Hapus Foto
                                </Button>
                              )}
                            </div>
                          </div>
                          <Input
                            value={config.payment.qris_image_url}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                payment: {
                                  ...prev.payment,
                                  qris_image_url: e.target.value,
                                },
                              }))
                            }
                            placeholder="Atau tempel link gambar QRIS (https://...)"
                            className="h-11 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </section>

                  {/* 3. Transfer Bank */}
                  <section className="space-y-3 border-t border-border pt-5">
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5">
                      <div>
                        <span className="block text-xs font-semibold text-foreground sm:text-sm">
                          Transfer Bank
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Pembeli bisa menyalin nomor rekening toko dengan 1 klik
                        </span>
                      </div>
                      <Switch
                        checked={config.payment.enable_bank_transfer}
                        onCheckedChange={(v) =>
                          setConfig((prev) => ({
                            ...prev,
                            payment: {
                              ...prev.payment,
                              enable_bank_transfer: v,
                            },
                          }))
                        }
                      />
                    </label>

                    {config.payment.enable_bank_transfer && (
                      <div className="space-y-3">
                        {config.payment.bank_accounts.map((acc, idx) => (
                          <div
                            key={acc.id}
                            className="space-y-3 rounded-xl border border-border bg-muted/20 p-4"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-foreground">
                                Rekening #{idx + 1}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveBankAccount(acc.id)}
                                aria-label="Hapus rekening"
                                className="h-8 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                                Hapus
                              </Button>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-foreground">
                                Nama Bank / E-Wallet
                              </Label>
                              <Input
                                value={acc.bank_name}
                                onChange={(e) =>
                                  handleUpdateBankAccount(
                                    acc.id,
                                    'bank_name',
                                    e.target.value
                                  )
                                }
                                placeholder="Contoh: BCA, Mandiri, BRI, GoPay"
                                className="h-11 text-sm"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-foreground">
                                Nomor Rekening
                              </Label>
                              <Input
                                value={acc.account_number}
                                onChange={(e) =>
                                  handleUpdateBankAccount(
                                    acc.id,
                                    'account_number',
                                    e.target.value
                                  )
                                }
                                placeholder="Contoh: 1234567890"
                                className="h-11 font-mono text-sm"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-foreground">
                                Atas Nama Pemilik Rekening
                              </Label>
                              <Input
                                value={acc.account_holder_name}
                                onChange={(e) =>
                                  handleUpdateBankAccount(
                                    acc.id,
                                    'account_holder_name',
                                    e.target.value
                                  )
                                }
                                placeholder="Contoh: Budi Santoso"
                                className="h-11 text-sm"
                              />
                            </div>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddBankAccount}
                          className="h-10 w-full gap-1.5 text-xs font-medium"
                        >
                          <Plus className="size-4" />
                          Tambah Nomor Rekening
                        </Button>
                      </div>
                    )}
                  </section>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 5: Teks & Kontak */}
            <TabsContent value="copywriting" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Perkenalan Toko & Kontak WhatsApp
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Atur kalimat perkenalan di bagian atas toko serta nomor WhatsApp penerima pesanan.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5 p-4 sm:p-5">
                  <section className="space-y-4 first:border-t-0 first:pt-0">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">
                        Nama Toko / Brand
                      </Label>
                      <Input
                        value={config.copywriting.brand_name}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            copywriting: {
                              ...prev.copywriting,
                              brand_name: e.target.value,
                            },
                          }))
                        }
                        placeholder="Contoh: Kopi Senja Roastery"
                        className="h-11 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">
                        Label Singkat
                      </Label>
                      <Input
                        value={config.copywriting.brand_tagline}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            copywriting: {
                              ...prev.copywriting,
                              brand_tagline: e.target.value,
                            },
                          }))
                        }
                        placeholder="Contoh: Dibuat segar setiap hari"
                        className="h-11 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">
                        Kalimat Utama Toko
                      </Label>
                      <Input
                        value={config.copywriting.hero_title}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            copywriting: {
                              ...prev.copywriting,
                              hero_title: e.target.value,
                            },
                          }))
                        }
                        placeholder="Contoh: Kopi & Roti Hangat untuk Harimu"
                        className="h-11 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">
                        Deskripsi Perkenalan
                      </Label>
                      <Textarea
                        value={config.copywriting.hero_subtitle}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            copywriting: {
                              ...prev.copywriting,
                              hero_subtitle: e.target.value,
                            },
                          }))
                        }
                        rows={3}
                        placeholder="Ceritakan secara singkat menu andalan atau keunikan toko Anda..."
                        className="min-h-24 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-foreground">
                        Keunggulan Toko (Maks. 3 Poin)
                      </Label>
                      <div className="space-y-2.5">
                        {[0, 1, 2].map((idx) => (
                          <Input
                            key={idx}
                            value={
                              config.copywriting.hero_highlights[idx] ?? ''
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              setConfig((prev) => {
                                const next = [
                                  ...prev.copywriting.hero_highlights,
                                ];
                                while (next.length < 3) next.push('');
                                next[idx] = val;
                                return {
                                  ...prev,
                                  copywriting: {
                                    ...prev.copywriting,
                                    hero_highlights: next,
                                  },
                                };
                              });
                            }}
                            placeholder={`Keunggulan #${idx + 1} (opsional)`}
                            className="h-11 text-sm"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">
                        Teks Tombol Lihat Menu
                      </Label>
                      <Input
                        value={config.copywriting.hero_primary_cta_text}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            copywriting: {
                              ...prev.copywriting,
                              hero_primary_cta_text: e.target.value,
                            },
                          }))
                        }
                        placeholder="Lihat Menu & Pesan"
                        className="h-11 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">
                        Teks Tombol Chat WhatsApp
                      </Label>
                      <Input
                        value={config.copywriting.hero_secondary_cta_text}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            copywriting: {
                              ...prev.copywriting,
                              hero_secondary_cta_text: e.target.value,
                            },
                          }))
                        }
                        placeholder="Hubungi WhatsApp"
                        className="h-11 text-sm"
                      />
                    </div>
                  </section>

                  <section className="space-y-4 border-t border-border pt-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">
                        Nomor WhatsApp Penerima Pesanan
                      </Label>
                      <Input
                        value={config.contact.whatsapp_number}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            contact: {
                              ...prev.contact,
                              whatsapp_number: e.target.value,
                            },
                          }))
                        }
                        placeholder="Contoh: 081234567890"
                        className="h-11 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">
                        Jam Buka Toko
                      </Label>
                      <Input
                        value={config.contact.operational_hours}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            contact: {
                              ...prev.contact,
                              operational_hours: e.target.value,
                            },
                          }))
                        }
                        placeholder="Contoh: Setiap Hari, 08:00 - 21:00"
                        className="h-11 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">
                        Kalimat Pengumuman / Promo di Paling Atas
                      </Label>
                      <Input
                        value={config.copywriting.announcement_text}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            copywriting: {
                              ...prev.copywriting,
                              announcement_text: e.target.value,
                            },
                          }))
                        }
                        placeholder="Contoh: Pesan online lebih praktis — langsung disiapkan kasir!"
                        className="h-11 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">
                        Judul Halaman Checkout
                      </Label>
                      <Input
                        value={config.copywriting.checkout_title}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            copywriting: {
                              ...prev.copywriting,
                              checkout_title: e.target.value,
                            },
                          }))
                        }
                        className="h-11 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">
                        Teks Tombol Kirim Pesanan
                      </Label>
                      <Input
                        value={config.copywriting.submit_button_text}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            copywriting: {
                              ...prev.copywriting,
                              submit_button_text: e.target.value,
                            },
                          }))
                        }
                        className="h-11 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">
                        Pesan Setelah Pembeli Mengirim Pesanan
                      </Label>
                      <Textarea
                        value={config.copywriting.order_success_message}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            copywriting: {
                              ...prev.copywriting,
                              order_success_message: e.target.value,
                            },
                          }))
                        }
                        rows={3}
                        className="min-h-24 text-sm"
                      />
                    </div>
                  </section>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sticky Side-by-Side Live Preview Panel */}
        <aside
          data-testid="storefront-live-preview-panel"
          aria-label="Pratinjau Langsung Toko Online"
          className="min-w-0 space-y-3 lg:sticky lg:top-4 lg:col-span-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-primary" />
              <Sparkles className="size-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                Live Preview (Berdampingan)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant={previewModeTab === 'catalog' ? 'default' : 'outline'}
                onClick={() => setPreviewModeTab('catalog')}
                className="h-9 text-xs"
              >
                Halaman Toko
              </Button>
              <Button
                type="button"
                size="sm"
                variant={previewModeTab === 'checkout' ? 'default' : 'outline'}
                onClick={() => setPreviewModeTab('checkout')}
                className="h-9 text-xs"
              >
                Halaman Checkout
              </Button>
            </div>
          </div>

          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-xl border border-border bg-background shadow-xs">
            <StorefrontRenderer
              store={{
                id: store?.id || 'preview',
                name: store?.name || 'Toko Kami',
                slug: slug || 'toko-kami',
                category: store?.category || 'Cafe & Bakery',
                location: store?.location || 'Jakarta',
                phone: store?.phone || '',
                description: store?.description || '',
                is_storefront_active: isActive,
                storefront_config: config,
              }}
              config={config}
              products={PREVIEW_SAMPLE_PRODUCTS}
              categories={['Minuman Kopi', 'Pastry & Bakery']}
              cart={PREVIEW_SAMPLE_CART}
              viewMode={previewModeTab}
              onViewModeChange={setPreviewModeTab}
              onSelectProduct={() => setPreviewModeTab('checkout')}
              onUpdateCartQuantity={() => {}}
              previewMode
            />
          </div>
        </aside>
      </div>
    </form>
  );
}

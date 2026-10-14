import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  CreditCard,
  Sparkles,
  Zap,
  XCircle,
  AlertTriangle,
  Package,
  Factory,
  History,
  Users,
  Store,
  Building2,
  UserCheck,
  RefreshCw,
  Calendar,
  ShieldCheck,
  Receipt,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuthStore } from "@/store/use-auth-store"
import {
  useSubscriptionUsage,
  useInvoices,
  subscriptionKeys,
  SUBSCRIPTION_USAGE_QUERY_KEY,
} from "@/features/subscription/hooks"
import { UpgradeModal } from "@/features/subscription/components/UpgradeModal"
import { subscriptionService } from "@/features/subscription/services/subscriptionService"
import { loadMidtransSnap, payWithSnap } from "@/lib/midtrans"
import type {
  SubscriptionQuotas,
  SubscriptionFeatures,
  SubscriptionInvoice,
  SubscriptionTier,
} from "@/features/subscription/types/subscription"

function formatCurrencyIdr(val: number | string | undefined | null): string {
  const num = typeof val === "string" ? parseFloat(val) || 0 : (val ?? 0)
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

function formatDateId(dateStr?: string | null): string {
  if (!dateStr) return "-"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d)
  } catch {
    return dateStr
  }
}

interface QuotaResourceMeta {
  key: keyof SubscriptionQuotas
  label: string
  sublabel: string
  icon: React.ComponentType<{ className?: string }>
}

const QUOTA_RESOURCES: QuotaResourceMeta[] = [
  { key: "stocks", label: "Bahan Baku", sublabel: "Total bahan & stok", icon: Package },
  { key: "products", label: "Produk & Resep", sublabel: "Resep menu aktif", icon: Factory },
  { key: "batches", label: "Produksi Bulanan", sublabel: "Batch produksi berjalan", icon: History },
  { key: "staff", label: "Staf Toko", sublabel: "Kapasitas anggota tim", icon: Users },
  { key: "stores", label: "Jumlah Cabang", sublabel: "Outlet & toko aktif", icon: Store },
  { key: "suppliers", label: "Supplier", sublabel: "Pemasok bahan baku", icon: Building2 },
  { key: "customers", label: "Pelanggan", sublabel: "Data kontak pelanggan", icon: UserCheck },
]

interface FeatureMeta {
  key: keyof SubscriptionFeatures
  title: string
  description: string
}

const FEATURE_METAS: FeatureMeta[] = [
  {
    key: "export_reports",
    title: "Export Laporan Excel & PDF",
    description: "Unduh laporan rincian HPP, data pembelian stok, dan rekap omzet ke Excel atau PDF.",
  },
  {
    key: "production_analytics",
    title: "Simulasi HPP & Analisis Biaya",
    description: "Kalkulator HPP mendalam, simulasi produksi real-time, dan kalkulasi margin keuntungan.",
  },
  {
    key: "multi_role_customization",
    title: "Kustomisasi Role & Izin Akses Staf",
    description: "Atur hak akses secara terperinci untuk tim kasir, staf dapur, pengawas, dan manajer.",
  },
  {
    key: "advanced_pos",
    title: "Fitur Kasir POS & Multi-Diskon",
    description: "Sistem kasir fleksibel dengan multi-diskon, struk cetak instan, dan penanganan order cepat.",
  },
]

export default function SubscriptionPage() {
  const queryClient = useQueryClient()
  const activeStoreId = useAuthStore((state) => state.activeStoreId)

  const {
    data: usage,
    isLoading: isUsageLoading,
    isRefetching: isUsageRefetching,
    error: usageError,
    refetch: refetchUsage,
  } = useSubscriptionUsage()

  const {
    data: invoices = [],
    isLoading: isInvoicesLoading,
    isRefetching: isInvoicesRefetching,
    refetch: refetchInvoices,
  } = useInvoices()

  const [isUpgradeOpen, setIsUpgradeOpen] = React.useState<boolean>(false)
  const [initialSelectedTier, setInitialSelectedTier] = React.useState<SubscriptionTier | undefined>()
  const [payingInvoiceId, setPayingInvoiceId] = React.useState<string | null>(null)

  const handleRefresh = async () => {
    await Promise.all([refetchUsage(), refetchInvoices()])
  }

  const handleOpenUpgrade = (tier?: SubscriptionTier) => {
    setInitialSelectedTier(tier)
    setIsUpgradeOpen(true)
  }

  const handlePayInvoice = async (invoice: SubscriptionInvoice) => {
    setPayingInvoiceId(invoice.id)
    try {
      if (invoice.snap_token) {
        const config = await subscriptionService.getMidtransConfig()
        await loadMidtransSnap(config.client_key)
        payWithSnap(invoice.snap_token, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.invoices() })
            queryClient.invalidateQueries({
              queryKey: [SUBSCRIPTION_USAGE_QUERY_KEY, activeStoreId],
            })
          },
        })
      } else if (invoice.snap_redirect_url) {
        window.open(invoice.snap_redirect_url, "_blank")
      }
    } catch {
      if (invoice.snap_redirect_url) {
        window.open(invoice.snap_redirect_url, "_blank")
      }
    } finally {
      setPayingInvoiceId(null)
    }
  }

  const isRefreshing = isUsageRefetching || isInvoicesRefetching

  const getTierBadgeStyle = (tier?: SubscriptionTier) => {
    switch (tier) {
      case "MAX_GROWTH":
        return "border-purple-300 bg-purple-100 text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
      case "GROWTH":
        return "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
      case "FREE":
      default:
        return "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success">Aktif</Badge>
      case "IN_GRACE_PERIOD":
        return <Badge variant="warning">Masa Tenggang</Badge>
      case "EXPIRED":
        return <Badge variant="destructive">Kedaluwarsa</Badge>
      case "CANCELLED":
        return <Badge variant="secondary">Dibatalkan</Badge>
      default:
        return <Badge variant="outline">{status || "-"}</Badge>
    }
  }

  const getInvoiceStatusBadge = (status?: string) => {
    switch (status) {
      case "PAID":
        return <Badge variant="success">Lunas</Badge>
      case "PENDING":
        return <Badge variant="warning">Menunggu Pembayaran</Badge>
      case "FAILED":
        return <Badge variant="destructive">Gagal</Badge>
      case "CANCELLED":
        return <Badge variant="secondary">Dibatalkan</Badge>
      default:
        return <Badge variant="outline">{status || "-"}</Badge>
    }
  }

  if (isUsageLoading) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Memuat informasi paket dan langganan...</p>
      </div>
    )
  }

  if (usageError || !usage) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h2 className="text-lg font-semibold">Gagal Memuat Data Langganan</h2>
        <p className="text-sm text-muted-foreground max-w-md mt-1 mb-4">
          Terjadi kendala saat mengambil rincian paket toko Anda. Silakan coba beberapa saat lagi.
        </p>
        <Button onClick={handleRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </Button>
      </div>
    )
  }

  const isGracePeriod = Boolean(usage.is_in_grace_period)
  const graceDate = usage.grace_period_until ? new Date(usage.grace_period_until) : null
  const now = new Date()
  const diffDays = graceDate
    ? Math.max(0, Math.ceil((graceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paket & Langganan</h1>
          <p className="text-sm text-muted-foreground">
            Pantau status paket toko, kapasitas kuota operasional, dan riwayat tagihan Anda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            Segarkan
          </Button>
          <Button
            size="sm"
            onClick={() => handleOpenUpgrade()}
            className="gap-1.5 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-primary-foreground shadow-xs font-medium"
          >
            <Sparkles className="h-4 w-4" />
            Upgrade / Ganti Paket
          </Button>
        </div>
      </div>

      {/* Grace Period Alert Banner */}
      {isGracePeriod && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-200/80 dark:bg-amber-900/70 shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-900 dark:text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Masa Tenggang Berjalan</span>
                <Badge variant="warning" className="text-[10px] uppercase font-bold py-0">
                  {diffDays} Hari Tersisa
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300/90 mt-0.5">
                Paket <strong>{usage.tier}</strong> Anda telah melewati masa aktif. Selesaikan
                perpanjangan sebelum <strong>{formatDateId(usage.grace_period_until)}</strong> agar
                akses staf dan fitur tidak ditangguhkan.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleOpenUpgrade(usage.tier)}
            className="shrink-0 bg-amber-900 hover:bg-amber-950 text-amber-50 font-semibold"
          >
            Perpanjang Sekarang
          </Button>
        </div>
      )}

      {/* Plan Status Hero Card */}
      <Card className="border shadow-xs bg-gradient-to-br from-card via-card to-muted/20">
        <CardContent className="p-5 sm:p-6">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Paket Saat Ini
              </span>
              <div className="flex items-center gap-2">
                <Badge className={cn("text-sm px-2.5 py-0.5 font-bold", getTierBadgeStyle(usage.tier))}>
                  {usage.tier}
                </Badge>
                {usage.effective_tier && usage.effective_tier !== usage.tier && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Efektif: {usage.effective_tier}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status Langganan
              </span>
              <div>{getStatusBadge(usage.status)}</div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Masa Berlaku
              </span>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>
                  {usage.tier === "FREE"
                    ? "Selamanya Bebas Biaya"
                    : formatDateId(usage.current_period_end)}
                </span>
              </div>
            </div>

            <div className="flex items-center md:justify-end">
              <Button
                onClick={() => handleOpenUpgrade()}
                variant="outline"
                className="w-full md:w-auto gap-2 border-primary/30 text-primary hover:bg-primary/5"
              >
                <Zap className="h-4 w-4 fill-primary/20" />
                Pilih Paket Baru
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quota Usage Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Penggunaan Kuota Toko</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Monitor batas kapasitas data operasional sesuai alokasi paket langganan Anda.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {QUOTA_RESOURCES.map((res) => {
            const item = usage.quotas[res.key] || { current: 0, limit: 0, remaining: 0 }
            const Icon = res.icon
            const isUnlimited = item.limit === -1
            const percentage =
              isUnlimited || item.limit <= 0
                ? 0
                : Math.min(100, Math.round((item.current / item.limit) * 100))

            // Determine status color styling
            let barColor = "bg-emerald-500"
            let badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
            let statusText = "Tersedia"

            if (isUnlimited) {
              barColor = "bg-emerald-500"
              badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
              statusText = "Unlimited"
            } else if (item.current >= item.limit) {
              barColor = "bg-rose-500"
              badgeBg = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
              statusText = "Batas Tercapai"
            } else if (percentage >= 80) {
              barColor = "bg-amber-500"
              badgeBg = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
              statusText = `${percentage}% Terpakai`
            } else {
              statusText = `${percentage}% Terpakai`
            }

            return (
              <Card key={res.key} className="shadow-xs hover:border-border/80 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">{res.label}</CardTitle>
                        <CardDescription className="text-[11px] leading-tight">
                          {res.sublabel}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] font-semibold px-1.5 py-0", badgeBg)}>
                      {statusText}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5 pt-0">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-muted-foreground">Kapasitas:</span>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {item.current}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        / {isUnlimited ? "∞" : item.limit}
                      </span>
                    </span>
                  </div>

                  {isUnlimited ? (
                    <div className="w-full bg-emerald-100 dark:bg-emerald-950/30 rounded-full h-2 overflow-hidden">
                      <div className="h-2 rounded-full bg-emerald-500 w-full opacity-60" />
                    </div>
                  ) : (
                    <Progress
                      value={percentage}
                      indicatorClassName={barColor}
                      className="h-2"
                    />
                  )}

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {isUnlimited
                        ? "Tanpa batas alokasi"
                        : `Tersisa: ${Math.max(0, item.limit - item.current)}`}
                    </span>
                    {!isUnlimited && item.current >= item.limit && (
                      <button
                        type="button"
                        onClick={() => handleOpenUpgrade()}
                        className="text-primary hover:underline font-semibold cursor-pointer"
                      >
                        Tambah Kuota
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Plan Features Checklist Section */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Fitur & Layanan Aktif</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Rincian fungsionalitas sistem yang terbuka berdasarkan paket langganan Anda saat ini.
              </CardDescription>
            </div>
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURE_METAS.map((feat) => {
              const isEnabled = Boolean(usage.features?.[feat.key])
              return (
                <div
                  key={feat.key}
                  className={cn(
                    "flex items-start gap-3 p-3.5 rounded-lg border transition-colors",
                    isEnabled
                      ? "bg-card border-border/80"
                      : "bg-muted/30 border-dashed border-border/50 opacity-60"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 rounded-full p-1 shrink-0",
                      isEnabled
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isEnabled ? (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {feat.title}
                      </span>
                      {isEnabled ? (
                        <Badge variant="success" className="text-[10px] py-0 px-1.5 h-4">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                          Terkunci
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{feat.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Invoices / Billing History Table Section */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Riwayat Tagihan & Transaksi
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Catatan invoice resmi dan riwayat pembayaran perpanjangan paket toko Anda.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchInvoices()}
              disabled={isInvoicesLoading || isInvoicesRefetching}
              className="h-8 px-2 text-xs gap-1"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isInvoicesRefetching && "animate-spin")}
              />
              Segarkan Tabel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isInvoicesLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <CreditCard className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <h3 className="text-sm font-semibold text-foreground">Belum Ada Tagihan</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                Riwayat tagihan invoice dan pembayaran Midtrans akan tercatat otomatis di sini
                setelah Anda melakukan transaksi paket.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">No. Invoice</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Metode Pembayaran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const isPending = inv.status === "PENDING"
                  const isPayingThis = payingInvoiceId === inv.id
                  const dateStr = inv.paid_at || inv.created_at || inv.billing_period_start

                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {inv.invoice_number || inv.id.slice(0, 12)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateId(dateStr)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("text-[11px] font-semibold", getTierBadgeStyle(inv.tier))}
                        >
                          {inv.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-medium">
                        {formatCurrencyIdr(inv.amount)}
                      </TableCell>
                      <TableCell className="text-xs uppercase text-muted-foreground">
                        {inv.payment_method || "-"}
                      </TableCell>
                      <TableCell>{getInvoiceStatusBadge(inv.status)}</TableCell>
                      <TableCell className="text-right">
                        {isPending ? (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handlePayInvoice(inv)}
                            disabled={isPayingThis}
                            className="h-7 px-2.5 text-xs font-medium gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            {isPayingThis ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ExternalLink className="h-3.5 w-3.5" />
                            )}
                            Bayar
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upgrade / Change Plan Modal */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => {
          setIsUpgradeOpen(false)
          setInitialSelectedTier(undefined)
        }}
        initialSelectedTier={initialSelectedTier}
        reason="Pilih paket langganan yang sesuai dengan kebutuhan kapasitas dan fitur operasional toko Anda."
      />
    </div>
  )
}

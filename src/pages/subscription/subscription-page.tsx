import { SUBSCRIPTION_TIER_LABELS } from "@/features/subscription/types/subscription"
import * as React from "react"
import {
  CreditCard,
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
} from "@/features/subscription/hooks"
import { UpgradeModal } from "@/features/subscription/components/UpgradeModal"
import { NativePaymentDisplay } from "@/features/subscription/components/NativePaymentDisplay"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { subscriptionService } from "@/features/subscription/services/subscriptionService"
import { useSubscriptionPayment } from '@/features/subscription/hooks/useSubscriptionPayment'
import { idlePayment, usePaymentState } from '@/features/subscription/lib/payment-state'
import type {
  SubscriptionQuotas,
  SubscriptionFeatures,
  SubscriptionInvoice,
  SubscriptionTier,
  PaymentInstructions,
} from "@/features/subscription/types/subscription"
import { CurrencyText } from "@/components/ui/currency-text"
import '@/features/subscription/styles/subscription.css'

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
  { key: "products", label: "Produk", sublabel: "Menu & bahan baku aktif", icon: Factory },
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
  const activeStoreId = useAuthStore((state) => state.activeStoreId)
  const userId = useAuthStore((state) => state.user?.id)
  const payment = useSubscriptionPayment()

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
    isError: isInvoicesError,
    refetch: refetchInvoices,
  } = useInvoices()

  const [isUpgradeOpen, setIsUpgradeOpen] = React.useState<boolean>(false)
  const [initialSelectedTier, setInitialSelectedTier] = React.useState<SubscriptionTier | undefined>()
  const [cancelConfirmation, setCancelConfirmation] = React.useState<string | null>(null)
  const [cancellingInvoiceId, setCancellingInvoiceId] = React.useState<string | null>(null)
  const [billingError, setBillingError] = React.useState('')
  const canManageBilling = usage?.can_manage_billing === true
  const checkedReturn = React.useRef('')
  React.useEffect(() => {
    const order = new URLSearchParams(window.location.search).get('order_id')
    if (!order || !canManageBilling) return
    const scope = `${userId}:${activeStoreId}:${order}`
    if (checkedReturn.current === scope) return

    const invoice = invoices.find((item) => item.invoice_number === order)
    if (invoice) {
      checkedReturn.current = scope
      payment.checkStatus(invoice.id)
      return
    }

    if (order.startsWith('A12') || !invoices.some((item) => item.invoice_number === order)) {
      const pending = invoices.find((item) => item.status === 'PENDING' || item.status === 'CHALLENGE')
      if (pending) {
        checkedReturn.current = scope
        payment.checkStatus(pending.id, order)
      }
    }
  }, [invoices, canManageBilling, userId, activeStoreId, payment])

  const [activePaymentModal, setActivePaymentModal] = React.useState<{
    invoice: SubscriptionInvoice
    instructions?: PaymentInstructions
  } | null>(null)

  React.useEffect(() => {
    if (payment.phase === 'confirmed' && activePaymentModal) {
      setActivePaymentModal(null)
    }
  }, [payment.phase, activePaymentModal])

  const handleRefresh = async () => {
    await Promise.all([refetchUsage(), ...(canManageBilling ? [refetchInvoices()] : [])])
  }

  const checkStatusRef = React.useRef(payment.checkStatus)
  checkStatusRef.current = payment.checkStatus
  const handleRefreshRef = React.useRef(handleRefresh)
  handleRefreshRef.current = handleRefresh

  React.useEffect(() => {
    const invoiceId = activePaymentModal?.invoice?.id
    if (!invoiceId) return

    const interval = window.setInterval(async () => {
      await checkStatusRef.current(invoiceId, undefined, true)
      await handleRefreshRef.current()
    }, 5000)

    return () => window.clearInterval(interval)
  }, [activePaymentModal])

  const handleOpenUpgrade = (tier?: SubscriptionTier) => {
    setInitialSelectedTier(tier)
    setIsUpgradeOpen(true)
  }

  const handlePayInvoice = async (invoice: SubscriptionInvoice) => {
    let instructions: PaymentInstructions | undefined
    if (invoice.metadata) {
      try {
        const meta = typeof invoice.metadata === 'string' ? JSON.parse(invoice.metadata) : invoice.metadata
        instructions = meta?.instructions
      } catch {}
    }
    if (!instructions) {
      try {
        const res = await subscriptionService.checkout(invoice.tier, invoice.payment_method)
        if (res.instructions) {
          instructions = res.instructions
        }
      } catch {}
    }
    if (instructions) {
      setActivePaymentModal({ invoice, instructions })
    } else {
      await payment.openInvoice(invoice)
    }
  }

  const handleCancelInvoice = async (invoice: SubscriptionInvoice) => {
    setCancellingInvoiceId(invoice.id)
    setBillingError('')
    try {
      await subscriptionService.cancelInvoice(invoice.id)
      usePaymentState.getState().update({ ...idlePayment, scope: `${userId}:${activeStoreId}` })
      setCancelConfirmation(null)
      await payment.refresh()
    } catch (error) {
      setBillingError(error instanceof Error ? error.message : 'Tagihan belum dapat dibatalkan. Silakan coba lagi.')
    } finally {
      setCancellingInvoiceId(null)
    }
  }

  const isRefreshing = isUsageRefetching || isInvoicesRefetching

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
      case "DENY":
        return <Badge variant="destructive">Gagal</Badge>
      case "CANCELLED":
      case "CANCEL":
        return <Badge variant="secondary">Dibatalkan</Badge>
      case "EXPIRED":
        return <Badge variant="secondary">Kedaluwarsa</Badge>
      case "CHALLENGE":
        return <Badge variant="warning">Dalam Peninjauan</Badge>
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
    <div className="subscription-page space-y-6">
      {/* Page Header */}
      <div className="subscription-page-heading">
        <div>
          <h1>Paket & Langganan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola paket, pantau kapasitas, dan lihat riwayat pembayaran Anda.
          </p>
        </div>
        <div className="subscription-page-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="subscription-button gap-1.5"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          {canManageBilling && usage.tier === 'GROWTH' && <Button
            size="sm"
            onClick={() => handleOpenUpgrade()}
            variant="outline"
            className="subscription-button"
          >
            Bandingkan paket
          </Button>}
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
                Paket <strong>{SUBSCRIPTION_TIER_LABELS[usage.tier]}</strong> Anda telah melewati masa aktif. Selesaikan
                perpanjangan sebelum <strong>{formatDateId(usage.grace_period_until)}</strong> agar
                akses staf dan fitur tidak ditangguhkan.
              </p>
            </div>
          </div>
          {canManageBilling && <Button
            size="sm"
            onClick={() => handleOpenUpgrade(usage.tier)}
            className="shrink-0 bg-amber-900 hover:bg-amber-950 text-amber-50 font-semibold"
          >
            Perpanjang Sekarang
          </Button>}
        </div>
      )}

      <section className="subscription-current-plan" aria-label="Ringkasan paket aktif">
        <div className="subscription-plan-identity" data-tier={usage.effective_tier || usage.tier}>
          <p>Paket saat ini</p>
          <div className="subscription-plan-name">{SUBSCRIPTION_TIER_LABELS[usage.tier]}</div>
          <p>{usage.tier === 'FREE' ? 'Mulai kelola operasional toko, lalu tingkatkan kapasitas saat bisnis berkembang.' : 'Kapasitas dan fitur untuk mendukung aktivitas toko dan seluruh cabang Anda.'}</p>
        </div>
        <div className="subscription-plan-meta">
          <dl className="subscription-plan-facts">
            <div><dt>Status langganan</dt><dd>{getStatusBadge(usage.status)}</dd></div>
            <div><dt>Masa berlaku</dt><dd className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{usage.tier === 'FREE' ? 'Tanpa batas waktu' : formatDateId(usage.current_period_end)}</dd></div>
          </dl>
          {usage.effective_tier && usage.effective_tier !== usage.tier && <p className="text-sm text-muted-foreground">Akses saat ini mengikuti paket {SUBSCRIPTION_TIER_LABELS[usage.effective_tier]}.</p>}
          <div className="subscription-plan-meta-footer">
            <p>{usage.tier === 'FREE' ? 'Pilih paket sesuai kebutuhan kapasitas toko.' : 'Pembayaran satu kali. Perpanjang kapan saja tanpa kehilangan sisa hari.'}</p>
            {canManageBilling ? <Button className="subscription-button" onClick={() => handleOpenUpgrade(usage.tier)}>
              {usage.tier === 'FREE' ? 'Mulai berlangganan' : 'Perpanjang paket'}
            </Button> : <span className="text-sm text-muted-foreground">Dikelola pemilik toko</span>}
          </div>
        </div>
      </section>

      <p className="subscription-account-note"><Store className="h-3.5 w-3.5" aria-hidden="true" /><span>{canManageBilling
        ? 'Satu langganan untuk seluruh cabang milik akun Anda. Kuota di bawah mengikuti toko yang sedang dipilih, kecuali jumlah cabang.'
        : 'Paket ini mengikuti langganan pemilik toko. Hubungi pemilik untuk mengelola pembayaran atau perubahan paket.'}</span></p>

      {canManageBilling && payment.phase === 'confirmed' && payment.message && (
        <div role="status" className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-foreground flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>{payment.message}</span>
        </div>
      )}
      {billingError && <p role="alert" className="text-sm text-destructive">{billingError}</p>}
      {canManageBilling && isInvoicesError && <div role="alert" className="rounded-lg border p-4 space-y-2">
        <p>Tagihan belum dapat dimuat. Coba lagi sebelum memulai pembayaran baru.</p>
        <Button variant="outline" size="sm" onClick={() => void refetchInvoices()}>Muat ulang tagihan</Button>
      </div>}
      {canManageBilling && !isInvoicesError && invoices.filter((invoice) => invoice.status === 'PENDING' || invoice.status === 'CHALLENGE').map((invoice) => {
        const isCurrentChecking = payment.isChecking && payment.invoiceId === invoice.id
        const hasPaymentFeedback = payment.invoiceId === invoice.id && payment.phase !== 'idle' && payment.message
        const isError = payment.invoiceId === invoice.id && payment.phase === 'error'

        return (
          <Card key={invoice.id} className={cn("subscription-pending", isError && "border-destructive/60 bg-destructive/5")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className={cn("subscription-pending-icon h-5 w-5 shrink-0", isError && "text-destructive")} aria-hidden="true" />
                Pembayaran belum selesai
              </CardTitle>
              <CardDescription>{invoice.invoice_number} · {SUBSCRIPTION_TIER_LABELS[invoice.tier]}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="subscription-pending-amount"><CurrencyText value={invoice.amount} /></p>
              {hasPaymentFeedback ? (
                <div
                  role={isError ? "alert" : "status"}
                  className={cn(
                    "subscription-pending-description text-sm rounded-md p-2.5",
                    isError
                      ? "bg-destructive/10 text-destructive border border-destructive/20 font-medium"
                      : "bg-amber-500/10 text-foreground border border-amber-500/20"
                  )}
                >
                  {payment.message}
                </div>
              ) : (
                <p className="subscription-pending-description text-sm">
                  {invoice.status === 'CHALLENGE'
                    ? 'Pembayaran sedang ditinjau oleh penyedia pembayaran. Periksa status sebelum mencoba lagi.'
                    : 'Lanjutkan pembayaran yang sudah dibuat atau batalkan untuk memilih paket lain.'}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {invoice.status === 'PENDING' && (
                  <Button
                    size="sm"
                    disabled={payment.phase === 'opening' || isCurrentChecking || !!cancellingInvoiceId}
                    onClick={() => void handlePayInvoice(invoice)}
                  >
                    Lanjutkan pembayaran
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isCurrentChecking || payment.phase === 'opening' || !!cancellingInvoiceId}
                  aria-busy={isCurrentChecking}
                  onClick={() => void payment.checkStatus(invoice.id)}
                >
                  {isCurrentChecking ? (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      Memeriksa…
                    </>
                  ) : (
                    'Cek status'
                  )}
                </Button>
                {invoice.status === 'PENDING' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isCurrentChecking || !!cancellingInvoiceId}
                    onClick={() => setCancelConfirmation(invoice.id)}
                  >
                    Batalkan tagihan
                  </Button>
                )}
              </div>
              {cancelConfirmation === invoice.id && (
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm">Batalkan tagihan ini? Setelah pembatalan dikonfirmasi, pembayaran ini tidak dapat dilanjutkan.</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={!!cancellingInvoiceId}
                      onClick={() => void handleCancelInvoice(invoice)}
                    >
                      {cancellingInvoiceId ? 'Membatalkan…' : 'Ya, batalkan tagihan'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!!cancellingInvoiceId}
                      onClick={() => setCancelConfirmation(null)}
                    >
                      Tetap lanjutkan
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      <div className="subscription-details-grid">
        <section className="subscription-panel" aria-labelledby="subscription-quota-title">
          <div className="subscription-panel-heading">
            <div><h2 id="subscription-quota-title">Penggunaan Kuota Toko</h2><p>Kapasitas yang tersedia untuk aktivitas toko Anda.</p></div>
          </div>
          <div className="subscription-quota-grid">
            {QUOTA_RESOURCES.map((res) => {
              const item = usage.quotas[res.key] || { current: 0, limit: 0, remaining: 0 }
              const Icon = res.icon
              const isUnlimited = item.limit === -1
              const percentage = isUnlimited || item.limit <= 0 ? 0 : Math.min(100, Math.round((item.current / item.limit) * 100))
              const reached = !isUnlimited && item.current >= item.limit
              return <div key={res.key} className="subscription-quota">
                <div className="subscription-quota-top"><Icon className="h-4 w-4" aria-hidden="true" />{res.label}</div>
                <div className="subscription-quota-value"><strong>{item.current.toLocaleString('id-ID')}</strong><span>/ {isUnlimited ? 'tanpa batas' : item.limit.toLocaleString('id-ID')}</span></div>
                <Progress value={isUnlimited ? 0 : percentage} indicatorClassName={reached ? 'bg-destructive' : percentage >= 80 ? 'bg-warning' : 'bg-primary'} className="h-1.5" aria-label={`Penggunaan ${res.label}`} />
                <div className="subscription-quota-caption">
                  <span>{isUnlimited ? 'Kapasitas tanpa batas' : reached ? 'Batas tercapai' : `${Math.max(0, item.limit - item.current).toLocaleString('id-ID')} tersedia`}</span>
                  {canManageBilling && usage.tier !== 'MAX_GROWTH' && reached && <button type="button" onClick={() => handleOpenUpgrade()} className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Lihat pilihan paket</button>}
                </div>
              </div>
            })}
          </div>
        </section>
        <section className="subscription-panel" aria-labelledby="subscription-features-title">
          <div className="subscription-panel-heading"><div><h2 id="subscription-features-title">Fitur & Layanan Aktif</h2><p>Akses fitur sesuai paket langganan.</p></div></div>
          <div className="subscription-feature-list">
            {FEATURE_METAS.map((feature) => {
              const enabled = Boolean(usage.features?.[feature.key])
              return <div key={feature.key} className="subscription-feature" data-enabled={enabled}>
                <span className="subscription-feature-mark" aria-hidden="true">{enabled ? <Check className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}</span>
                <div><h3>{feature.title}</h3><p>{feature.description}</p><span className="subscription-feature-state">{enabled ? 'Termasuk dalam paket' : 'Belum tersedia di paket Anda'}</span></div>
              </div>
            })}
          </div>
        </section>
      </div>

      {/* Invoices / Billing History Table Section */}
      {canManageBilling && <Card className="subscription-panel shadow-none">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
              className="self-start sm:self-center shrink-0 h-8 px-2 text-xs gap-1"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isInvoicesRefetching && "animate-spin")}
              />
              Refresh Tabel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isInvoicesError ? <div role="alert" className="p-4 text-sm">Riwayat tagihan gagal dimuat. Gunakan tombol refresh untuk mencoba lagi.</div> : isInvoicesLoading ? (
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
            <Table className="min-w-[720px]">
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
                  const isPayingThis = payment.phase === 'opening'
                  const dateStr = inv.paid_at || inv.created_at || inv.billing_period_start

                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="text-xs font-medium text-foreground">
                        {inv.invoice_number || inv.id.slice(0, 12)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateId(dateStr)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          data-tier={inv.tier}
                          className="subscription-tier text-[11px] font-semibold"
                        >
                          {SUBSCRIPTION_TIER_LABELS[inv.tier]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs tabular-nums font-medium">
                        <CurrencyText value={inv.amount} />
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
                            className="h-8 px-3 text-xs font-medium gap-1"
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
      </Card>}

      {/* Upgrade / Change Plan Modal */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => {
          setIsUpgradeOpen(false)
          setInitialSelectedTier(undefined)
        }}
        initialSelectedTier={initialSelectedTier}
      />

      {/* Active Native Payment Instructions Modal */}
      {activePaymentModal && (
        <Dialog
          open={!!activePaymentModal}
          onOpenChange={(open) => {
            if (!open) setActivePaymentModal(null)
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Instruksi Pembayaran</DialogTitle>
              <DialogDescription>
                Selesaikan pembayaran untuk mengaktifkan paket langganan Anda.
              </DialogDescription>
            </DialogHeader>
            <NativePaymentDisplay
              invoice={activePaymentModal.invoice}
              instructions={activePaymentModal.instructions}
              onCheckStatus={async (id) => {
                await payment.checkStatus(id)
                await handleRefresh()
                if (payment.phase === 'confirmed') {
                  setActivePaymentModal(null)
                }
              }}
              onCancelInvoice={async (inv) => {
                await handleCancelInvoice(inv)
                setActivePaymentModal(null)
              }}
              isChecking={payment.isChecking}
              statusMessage={payment.message}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

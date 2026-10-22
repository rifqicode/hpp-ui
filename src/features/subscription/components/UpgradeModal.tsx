import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Check, CreditCard, Crown, Loader2, Lock, RefreshCw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CurrencyText } from '@/components/ui/currency-text'
import { useSubscriptionUsage } from '../hooks/useSubscriptionUsage'
import { usePlans } from '../hooks/usePlans'
import { useCheckout } from '../hooks/useCheckout'
import { useInvoices } from '../hooks/useInvoices'
import { usePaymentChannels } from '../hooks/usePaymentChannels'
import { useSubscriptionPayment } from '../hooks/useSubscriptionPayment'
import { subscriptionService } from '../services/subscriptionService'
import { PaymentChannelSelector } from './PaymentChannelSelector'
import { NativePaymentDisplay } from './NativePaymentDisplay'
import {
  SUBSCRIPTION_TIER_LABELS,
  type CheckoutResponseData,
  type PaymentChannelConfig,
  type PaymentInstructions,
  type PlanConfig,
  type SubscriptionInvoice,
  type SubscriptionTier,
} from '../types/subscription'
import '../styles/subscription.css'

const DEFAULT_PAYMENT_CHANNELS: PaymentChannelConfig[] = [
  { code: 'qris', name: 'QRIS', category: 'QRIS', description: 'GoPay, OVO, DANA, ShopeePay, BCA, Livin, dll', enabled: true },
  { code: 'bca_va', name: 'BCA Virtual Account', category: 'VIRTUAL_ACCOUNT', description: 'Transfer via BCA Mobile, KlikBCA, atau ATM', enabled: true },
  { code: 'mandiri_va', name: 'Mandiri Virtual Account', category: 'VIRTUAL_ACCOUNT', description: 'Transfer via Livin\' by Mandiri atau ATM', enabled: true },
  { code: 'bni_va', name: 'BNI Virtual Account', category: 'VIRTUAL_ACCOUNT', description: 'Transfer via BNI Mobile atau ATM', enabled: true },
  { code: 'bri_va', name: 'BRI Virtual Account (BRIVA)', category: 'VIRTUAL_ACCOUNT', description: 'Transfer via BRImo atau ATM', enabled: true },
]

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: string
  initialSelectedTier?: SubscriptionTier
}

function PlanSelection({
  plans,
  channels,
  currentTier,
  periodEnd,
  initialTier,
  pending,
  onConfirm,
}: {
  plans: PlanConfig[]
  channels: PaymentChannelConfig[]
  currentTier: SubscriptionTier
  periodEnd?: string | null
  initialTier?: SubscriptionTier
  pending: boolean
  onConfirm: (tier: SubscriptionTier, channel: string) => void
}) {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(
    initialTier && initialTier !== 'FREE' ? initialTier : currentTier === 'FREE' ? 'GROWTH' : currentTier
  )
  const [selectedChannel, setSelectedChannel] = useState<string>('qris')
  const plan = plans.find((item) => item.tier === selectedTier)
  const [reviewing, setReviewing] = useState(false)
  const isRenewal = currentTier === selectedTier
  const activeUntil = periodEnd ? new Date(periodEnd) : null
  const isDowngrade = currentTier === 'MAX_GROWTH' && selectedTier === 'GROWTH' && Boolean(activeUntil && activeUntil > new Date())
  const start = isRenewal && activeUntil && activeUntil > new Date() ? activeUntil : new Date()
  const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000)
  const date = (value: Date) => value.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const limit = (value: number) => (value === -1 ? 'Tanpa batas' : value.toLocaleString('id-ID'))

  if (reviewing && plan)
    return (
      <div className="space-y-4">
        <div className="subscription-review space-y-3">
          <h3 className="font-semibold">
            Ringkasan {isRenewal ? 'perpanjangan' : 'pembelian'} {SUBSCRIPTION_TIER_LABELS[plan.tier]}
          </h3>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between gap-4">
              <dt>Total pembayaran</dt>
              <dd className="font-semibold">
                <CurrencyText value={plan.price} />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Durasi</dt>
              <dd>30 hari</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Perkiraan aktif sampai</dt>
              <dd>{date(end)}</dd>
            </div>
          </dl>
          <p className="text-sm text-muted-foreground">
            {isRenewal
              ? 'Sisa masa aktif tetap dipertahankan. Tambahan 30 hari dihitung dari akhir masa aktif, atau dari pembayaran jika paket sudah berakhir.'
              : currentTier === 'FREE'
              ? 'Paket mulai aktif setelah pembayaran terverifikasi untuk 30 hari. Tanggal akhir menyesuaikan waktu pembayaran.'
              : 'Paket berlaku setelah pembayaran terverifikasi, dengan harga penuh untuk 30 hari baru. Sisa masa aktif paket sebelumnya tidak dikonversi atau dikembalikan.'}
          </p>
          <p className="text-sm text-muted-foreground">
            Pembayaran satu kali, tanpa perpanjangan otomatis. Paket mencakup seluruh cabang milik akun Anda sesuai batas paket.
          </p>
        </div>

        <div className="pt-1">
          <PaymentChannelSelector
            channels={channels}
            selectedChannelCode={selectedChannel}
            onSelectChannel={setSelectedChannel}
            disabled={pending}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button className="subscription-button" variant="outline" disabled={pending} onClick={() => setReviewing(false)}>
            Kembali memilih
          </Button>
          <Button
            className="subscription-button"
            disabled={pending}
            onClick={() => onConfirm(plan.tier, selectedChannel)}
          >
            {pending ? 'Menyiapkan pembayaran…' : 'Lanjut ke pembayaran'}
          </Button>
        </div>
      </div>
    )

  return (
    <div className="space-y-4">
      <fieldset disabled={pending} className="subscription-plan-options grid sm:grid-cols-2">
        <legend className="sr-only">Pilih paket langganan</legend>
        {plans.map((item) => (
          <label key={item.tier} className="subscription-plan-option" data-selected={selectedTier === item.tier}>
            <div>
              <div className="subscription-plan-option-title">
                <input
                  type="radio"
                  name="subscription-plan"
                  value={item.tier}
                  checked={selectedTier === item.tier}
                  onChange={() => setSelectedTier(item.tier)}
                />
                <span>{SUBSCRIPTION_TIER_LABELS[item.tier]}</span>
                <span
                  data-tier={item.tier}
                  className="subscription-tier inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold border"
                >
                  {item.tier === 'MAX_GROWTH' && <Crown className="size-2.5 shrink-0" aria-hidden="true" />}
                  {SUBSCRIPTION_TIER_LABELS[item.tier]}
                </span>
              </div>
              {item.tier === currentTier && <p className="subscription-plan-option-current">Paket saat ini</p>}
            </div>
            <p className="subscription-plan-price">
              <CurrencyText value={item.price} />
              <span> / 30 hari</span>
            </p>
            <ul className="subscription-plan-benefits">
              <li>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{limit(item.limits.max_stores)} cabang</span>
              </li>
              <li>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{limit(item.limits.max_stocks)} bahan baku</span>
              </li>
              <li>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{limit(item.limits.max_products)} produk</span>
              </li>
              <li>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{limit(item.limits.max_batches_per_mo)} batch produksi per bulan</span>
              </li>
              <li>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{limit(item.limits.max_staff_per_store)} staf per toko</span>
              </li>
              {item.features.export_reports && (
                <li>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Ekspor laporan</span>
                </li>
              )}
              {item.features.multi_role_customization && (
                <li>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Kustomisasi izin staf</span>
                </li>
              )}
            </ul>
          </label>
        ))}
      </fieldset>
      {isDowngrade && (
        <p role="status" className="text-sm text-muted-foreground">
          Downgrade tersedia setelah masa aktif paket saat ini berakhir pada {date(activeUntil!)}. Kapasitas dan fitur Anda tetap
          mengikuti paket saat ini.
        </p>
      )}
      <div className="flex justify-end">
        <Button
          className="subscription-button"
          disabled={!plan || isDowngrade || pending}
          onClick={() => setReviewing(true)}
        >
          {isRenewal ? 'Tinjau perpanjangan' : 'Tinjau pilihan paket'}
        </Button>
      </div>
    </div>
  )
}

export function UpgradeModal({ isOpen, onClose, reason, initialSelectedTier }: UpgradeModalProps) {
  const { data: usage, error: usageError, refetch: refetchUsage } = useSubscriptionUsage()
  const { data: plans, isLoading, error, refetch } = usePlans(isOpen)
  const { data: rawChannels } = usePaymentChannels(isOpen)
  const { data: invoices, isPending: invoicesLoading, isError: invoicesError, refetch: refetchInvoices } = useInvoices()
  const checkout = useCheckout()
  const payment = useSubscriptionPayment()
  const pendingPayment = useRef<CheckoutResponseData | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeNativePayment, setActiveNativePayment] = useState<{
    invoice: SubscriptionInvoice
    instructions?: PaymentInstructions
  } | null>(null)

  const channels = rawChannels && rawChannels.length > 0 ? rawChannels : DEFAULT_PAYMENT_CHANNELS
  const pendingInvoice = invoices?.find((item) => item.status === 'PENDING' || item.status === 'CHALLENGE')

  const confirm = async (tier: SubscriptionTier, paymentMethod: string = 'qris') => {
    setErrorMessage('')
    try {
      const res = await checkout.mutateAsync({ tier, paymentMethod })
      if (res.instructions) {
        setActiveNativePayment({ invoice: res.invoice, instructions: res.instructions })
      } else {
        pendingPayment.current = res
        onClose()
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Pembayaran belum dapat dimulai. Silakan coba lagi.')
    }
  }

  const handleResumePending = async (inv: SubscriptionInvoice) => {
    let instructions: PaymentInstructions | undefined
    if (inv.metadata) {
      try {
        const meta = typeof inv.metadata === 'string' ? JSON.parse(inv.metadata) : inv.metadata
        instructions = meta?.instructions
      } catch {}
    }
    if (!instructions) {
      try {
        const res = await checkout.mutateAsync({ tier: inv.tier, paymentMethod: inv.payment_method })
        if (res.instructions) {
          instructions = res.instructions
        }
      } catch {}
    }
    if (instructions) {
      setActiveNativePayment({ invoice: inv, instructions })
    } else {
      void payment.openInvoice(inv)
    }
  }

  const isCheckingPendingInvoice = !!(pendingInvoice && payment.phase === 'verifying' && payment.invoiceId === pendingInvoice.id)

  const handleClose = () => {
    if (!checkout.isPending) {
      setErrorMessage('')
      setActiveNativePayment(null)
      onClose()
    }
  }

  const checkStatusRef = useRef(payment.checkStatus)
  checkStatusRef.current = payment.checkStatus
  const refetchInvoicesRef = useRef(refetchInvoices)
  refetchInvoicesRef.current = refetchInvoices
  const refetchUsageRef = useRef(refetchUsage)
  refetchUsageRef.current = refetchUsage

  useEffect(() => {
    const invoiceId = activeNativePayment?.invoice?.id
    if (!invoiceId) return

    const interval = window.setInterval(async () => {
      await checkStatusRef.current(invoiceId, undefined, true)
      await Promise.all([refetchInvoicesRef.current(), refetchUsageRef.current()])
    }, 5000)

    return () => window.clearInterval(interval)
  }, [activeNativePayment])

  useEffect(() => {
    if (payment.phase === 'confirmed' && isOpen) {
      handleClose()
    }
  }, [payment.phase, isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent
        className="max-w-2xl max-h-[90dvh] overflow-y-auto"
        onCloseAutoFocus={(event) => {
          const data = pendingPayment.current
          if (!data) return
          event.preventDefault()
          pendingPayment.current = null
          requestAnimationFrame(() => {
            void payment.openInvoice(data.invoice, { client_key: data.client_key ?? '', is_production: data.is_production })
          })
        }}
      >
        <DialogHeader>
          <DialogTitle>Kelola Paket Langganan</DialogTitle>
          <DialogDescription>
            Pilih paket yang sesuai untuk membuka fitur dan meningkatkan kapasitas operasional Anda.
          </DialogDescription>
        </DialogHeader>

        {reason && (
          <div className="border border-primary/20 bg-primary/5 p-3.5 rounded-lg flex items-start gap-3 text-sm">
            <Lock className="h-4 w-4 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            <div className="space-y-0.5">
              <p className="font-medium text-foreground leading-snug">{reason}</p>
            </div>
          </div>
        )}

        {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}

        {activeNativePayment ? (
          <div className="space-y-4">
            <NativePaymentDisplay
              invoice={activeNativePayment.invoice}
              instructions={activeNativePayment.instructions}
              onCheckStatus={async (id) => {
                await payment.checkStatus(id)
                const [updatedInvoices] = await Promise.all([refetchInvoices(), refetchUsage()])
                const isPaid = updatedInvoices.data?.find((item) => item.id === id)?.status === 'PAID'
                if (isPaid || payment.phase === 'confirmed') {
                  handleClose()
                }
              }}
              onCancelInvoice={async (inv) => {
                await subscriptionService.cancelInvoice(inv.id)
                await Promise.all([refetchInvoices(), refetchUsage()])
                setActiveNativePayment(null)
              }}
              isChecking={payment.isChecking}
              statusMessage={payment.message}
            />
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Tutup
              </Button>
            </div>
          </div>
        ) : usageError ? (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3 text-sm">
            <div className="flex items-center gap-2 font-semibold text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Gagal Memuat Informasi Langganan</span>
            </div>
            <p className="text-muted-foreground">
              Informasi langganan belum dapat dimuat. Jika akses staf ditangguhkan, hubungi pemilik toko.
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetchUsage()}>
              Muat Ulang Langganan
            </Button>
          </div>
        ) : !usage ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground font-medium">Memuat informasi langganan…</p>
          </div>
        ) : !usage.can_manage_billing ? (
          <div className="rounded-xl border bg-muted/40 p-4 space-y-2 text-sm">
            <p className="font-medium text-foreground">Akses Tagihan Terbatas</p>
            <p className="text-muted-foreground">
              Langganan toko dikelola oleh pemilik toko. Hubungi pemilik untuk memperpanjang atau mengganti paket.
            </p>
          </div>
        ) : invoicesError ? (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3 text-sm">
            <div className="flex items-center gap-2 font-semibold text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Gagal Memuat Tagihan</span>
            </div>
            <p className="text-muted-foreground">Tagihan belum dapat dimuat. Periksa tagihan sebelum memulai pembayaran baru.</p>
            <Button variant="outline" size="sm" onClick={() => void refetchInvoices()}>
              Coba Muat Tagihan
            </Button>
          </div>
        ) : invoicesLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground font-medium">Memeriksa tagihan berjalan…</p>
          </div>
        ) : pendingInvoice ? (
          <Card className="subscription-pending">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <AlertCircle
                    className="subscription-pending-icon h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500"
                    aria-hidden="true"
                  />
                  Pembayaran Belum Selesai
                </CardTitle>
                <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-900 dark:text-amber-200">
                  {pendingInvoice.invoice_number}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Paket {SUBSCRIPTION_TIER_LABELS[pendingInvoice.tier]} · Durasi 30 Hari
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="subscription-pending-amount">
                <CurrencyText value={pendingInvoice.amount} />
              </p>
              <p className="subscription-pending-description text-sm">
                Masih ada pembayaran untuk paket {SUBSCRIPTION_TIER_LABELS[pendingInvoice.tier]} yang belum selesai. Anda dapat
                langsung melanjutkan pembayaran tagihan ini atau mengelolanya di halaman langganan.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  disabled={payment.phase === 'opening' || isCheckingPendingInvoice}
                  onClick={() => void handleResumePending(pendingInvoice)}
                  className="gap-1.5"
                >
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  {payment.phase === 'opening' ? 'Membuka…' : 'Lanjutkan Pembayaran'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={payment.phase === 'opening' || isCheckingPendingInvoice}
                  onClick={() => void payment.checkStatus(pendingInvoice.id)}
                  className="gap-1.5"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isCheckingPendingInvoice ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  {isCheckingPendingInvoice ? 'Memeriksa…' : 'Cek Status'}
                </Button>
                <Button asChild size="sm" variant="ghost" onClick={handleClose}>
                  <Link to="/subscription">Kelola di Halaman Tagihan</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground font-medium">Memuat pilihan paket…</p>
          </div>
        ) : error || !plans?.some((item) => item.tier !== 'FREE') ? (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3 text-sm">
            <div className="flex items-center gap-2 font-semibold text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Gagal Memuat Pilihan Paket</span>
            </div>
            <p className="text-muted-foreground">Pilihan paket belum dapat dimuat.</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Coba Lagi
            </Button>
          </div>
        ) : (
          isOpen && (
            <PlanSelection
              plans={plans.filter((item) => item.tier !== 'FREE')}
              channels={channels}
              currentTier={usage.tier}
              periodEnd={usage.current_period_end}
              initialTier={initialSelectedTier}
              pending={checkout.isPending}
              onConfirm={(tier, channel) => void confirm(tier, channel)}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  )
}

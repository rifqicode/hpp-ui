import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarDays, Check, CreditCard, Receipt } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogPortal, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CurrencyText } from '@/components/ui/currency-text'
import { useAuthStore } from '@/store/use-auth-store'
import { useSubscriptionPayment } from '../hooks/useSubscriptionPayment'
import { useSubscriptionUsage } from '../hooks/useSubscriptionUsage'
import { useInvoices } from '../hooks/useInvoices'
import { usePaymentState } from '../lib/payment-state'
import { claimSubscriptionWelcome } from '../lib/welcome-receipt'
import { SUBSCRIPTION_TIER_LABELS } from '../types/subscription'
import { SubscriptionConfetti } from './SubscriptionConfetti'
import '../styles/subscription.css'

export function SubscriptionWelcome() {
  const userId = useAuthStore((state) => state.user?.id)
  const storeId = useAuthStore((state) => state.activeStoreId)
  const payment = useSubscriptionPayment()
  const { data: usage } = useSubscriptionUsage()
  const { data: invoices } = useInvoices()
  const update = usePaymentState((state) => state.update)
  const welcomeInvoiceId = usePaymentState((state) => state.scope === `${userId}:${storeId}` ? state.welcomeInvoiceId : null)
  const navigate = useNavigate()
  const invoice = payment.invoice
  const verified = Boolean(userId && usage?.can_manage_billing && usage.owner_id === userId
    && payment.phase === 'confirmed' && invoice?.status === 'PAID' && usage.status === 'ACTIVE'
    && usage.tier === invoice.tier && usage.current_period_end
    && new Date(usage.current_period_end) >= new Date(invoice.billing_period_end))

  useEffect(() => {
    if (!verified || !userId || !invoice) return
    if (claimSubscriptionWelcome(userId, invoice.id)) {
      update({ scope: `${userId}:${storeId}`, welcomeInvoiceId: invoice.id })
    }
  }, [verified, userId, storeId, invoice, update])

  if (!verified || !invoice || !usage || welcomeInvoiceId !== invoice.id) return null
  const tierLabel = SUBSCRIPTION_TIER_LABELS[invoice.tier]
  const renewed = invoices?.some((item) => item.id !== invoice.id && item.status === 'PAID'
    && item.tier === invoice.tier && new Date(item.billing_period_end) < new Date(invoice.billing_period_end))
  const expiry = new Date(usage.current_period_end!).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const dismiss = () => update({ scope: `${userId}:${storeId}`, welcomeInvoiceId: null })

  return <Dialog open onOpenChange={(open) => { if (!open) dismiss() }}>
    <DialogPortal><SubscriptionConfetti /></DialogPortal>
    <DialogContent className="subscription-welcome" onOpenAutoFocus={(event) => {
      event.preventDefault()
      document.getElementById('subscription-welcome-action')?.focus()
    }}>
      <div className="subscription-welcome-header">
        <div className="subscription-welcome-emblem" aria-hidden="true"><Check className="h-8 w-8" strokeWidth={2.5} /></div>
        <DialogHeader className="text-center sm:text-center">
        <DialogTitle className="subscription-welcome-title">{renewed ? `Paket ${tierLabel} kamu diperpanjang.` : `Paket ${tierLabel} kamu sudah aktif!`}</DialogTitle>
        <DialogDescription className="subscription-welcome-description">{renewed
          ? 'Terima kasih sudah melanjutkan langganan. Masa aktif sudah ditambahkan dan sisa hari sebelumnya tetap tersimpan.'
          : 'Terima kasih sudah berlangganan. Kapasitas dan fitur toko kamu kini mengikuti paket yang dipilih.'}</DialogDescription>
        </DialogHeader>
      </div>
      <div className="subscription-welcome-body">
        <div className="subscription-welcome-receipt">
          <dl className="subscription-welcome-facts">
            <div><dt><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />Aktif sampai</dt><dd>{expiry}</dd></div>
            <div><dt><CreditCard className="h-3.5 w-3.5" aria-hidden="true" />Pembayaran terverifikasi</dt><dd><CurrencyText value={invoice.amount} /></dd></div>
          </dl>
          <p className="subscription-welcome-invoice"><Receipt className="h-3.5 w-3.5" aria-hidden="true" /><span>Tagihan {invoice.invoice_number} telah lunas.</span></p>
        </div>
        <p className="subscription-welcome-note">Paket berlaku untuk seluruh cabang milik akun kamu, sesuai kapasitas paket.</p>
        <div className="subscription-welcome-actions">
          <Button id="subscription-welcome-action" className="subscription-button" onClick={() => { dismiss(); navigate('/subscription') }}>Lihat paket & penggunaan<ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" /></Button>
          <Button variant="ghost" onClick={dismiss}>Tutup</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
}

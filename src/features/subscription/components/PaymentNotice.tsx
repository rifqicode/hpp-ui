import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSubscriptionPayment } from '../hooks/useSubscriptionPayment'

export function PaymentNotice({ compact = false }: { compact?: boolean }) {
  const payment = useSubscriptionPayment()
  if (payment.phase === 'idle') return null
  const isChecking = !!payment.isChecking
  const isError = payment.phase === 'error'
  const title = isError ? 'Kendala Pembayaran' : 'Menunggu Konfirmasi Pembayaran'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className="border border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15 p-4 rounded-xl shadow-xs space-y-2.5"
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <h4 className="font-semibold text-sm text-foreground">{title}</h4>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">{payment.message}</p>
      {compact ? (
        <div className="pt-1">
          <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-foreground font-medium">
            <Link to="/subscription">
              Lihat langganan dan tagihan
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 pt-1">
          {payment.phase !== 'confirmed' && payment.invoiceId && (
            <Button
              variant="outline"
              size="sm"
              disabled={isChecking}
              aria-busy={isChecking}
              onClick={() => void payment.checkStatus()}
            >
              {isChecking ? 'Sedang memeriksa...' : 'Cek status pembayaran'}
            </Button>
          )}
          {payment.phase === 'error' && payment.invoice?.snap_redirect_url && (
            <Button asChild variant="outline" size="sm">
              <a href={payment.invoice.snap_redirect_url} target="_blank" rel="noopener noreferrer">
                Buka halaman pembayaran
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

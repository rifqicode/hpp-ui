import { CurrencyText } from '@/components/ui/currency-text'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Clock, Receipt, Truck } from 'lucide-react'
import type { usePurchaseOrders } from '../hooks/use-purchase-orders'

interface Props {
  list: ReturnType<typeof usePurchaseOrders>
}

export function PurchaseOrderSummary({ list }: Props) {
  const metrics = [
    {
      label: 'Semua pembelian', value: list.totalCount, status: 'ALL',
      description: 'Seluruh pengajuan tercatat', icon: Receipt,
      color: 'text-primary', background: 'bg-primary/10',
    },
    {
      label: 'Menunggu persetujuan', value: list.requestCount, status: 'PURCHASE_REQUEST',
      description: 'Pengajuan menunggu diproses', icon: Clock,
      color: 'text-blue-700 dark:text-blue-300', background: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      label: 'Sedang diproses', value: list.orderCount, status: 'PURCHASE_ORDER',
      description: 'Penerimaan dan pembayaran', icon: Truck,
      color: 'text-amber-700 dark:text-amber-300', background: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      label: 'Selesai', value: list.completedCount, status: 'COMPLETED',
      description: 'Nilai pembelian selesai', icon: CheckCircle2,
      color: 'text-emerald-700 dark:text-emerald-300', background: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
  ]

  return <section aria-label="Ringkasan pembelian" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {metrics.map((metric) => <Card
        key={metric.status}
        className="min-w-0 gap-0 border-border/80 bg-card p-0 shadow-2xs"
      ><button
        type="button"
        aria-pressed={list.statusFilter === metric.status}
        onClick={() => list.setStatusFilter(metric.status)}
        className="h-full w-full rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring aria-pressed:bg-primary/5"
      >
        <CardContent className="flex items-center justify-between gap-2 p-0">
          <div className="min-w-0 space-y-0.5">
            <span className="block text-xs font-medium text-muted-foreground">{metric.label}</span>
            <span className={`block text-2xl font-bold tabular-nums tracking-tight ${metric.color}`}>
              {list.summaryLoading ? '…' : list.summaryError ? '-' : metric.value}
            </span>
            <span className="block text-xs text-muted-foreground">{metric.description}</span>
            {metric.status === 'COMPLETED' && <span className="block text-xs font-semibold tabular-nums">
              {list.summaryLoading ? 'Memuat ringkasan...' : list.summaryError ? 'Ringkasan belum tersedia' : <CurrencyText value={list.totalCompletedAmount} />}
            </span>}
          </div>
          <span className={`shrink-0 rounded-xl p-2.5 ${metric.background} ${metric.color}`}>
            <metric.icon className="h-5 w-5" aria-hidden="true" />
          </span>
        </CardContent>
      </button></Card>)}
  </section>
}

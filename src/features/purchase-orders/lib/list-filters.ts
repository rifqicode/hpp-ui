import type { usePurchaseOrders } from '../hooks/use-purchase-orders'

export function hasPurchaseOrderFilters(list: ReturnType<typeof usePurchaseOrders>) {
  return Boolean(list.search.trim()) ||
    list.categoryFilter !== 'ALL' ||
    list.statusFilter !== 'ALL' ||
    list.receiptStatusFilter !== 'ALL' ||
    list.paymentStatusFilter !== 'ALL' ||
    list.sortBy !== 'date-desc'
}

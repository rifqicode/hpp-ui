import { ListFilters } from '@/components/ui/list-filters'
import type { usePurchaseOrders } from '../hooks/use-purchase-orders'
import type { PurchaseOrderCategory } from '../types'

interface Props {
  list: ReturnType<typeof usePurchaseOrders>
}

export function PurchaseOrderListFilters({ list }: Props) {
  const hasFilters = Boolean(list.search.trim()) || list.categoryFilter !== 'ALL' || list.statusFilter !== 'ALL'

  function resetFilters() {
    list.setSearch('')
    list.setCategoryFilter('ALL')
    list.setStatusFilter('ALL')
  }

  return <ListFilters
    label="Filter pembelian"
    search={{
      label: 'Cari pembelian',
      placeholder: 'Cari nomor pembelian, supplier, atau bahan baku...',
      value: list.search,
      onChange: list.setSearch,
    }}
    filters={[
      {
        id: 'category', label: 'Kategori', value: list.categoryFilter,
        onChange: (value) => list.setCategoryFilter(value as PurchaseOrderCategory | 'ALL'),
        options: [
          { value: 'ALL', label: 'Semua kategori' },
          { value: 'PURCHASE_ORDER', label: 'Purchase Order' },
          { value: 'DIRECT_ORDER', label: 'Direct Order' },
        ],
      },
      {
        id: 'status', label: 'Status', value: list.statusFilter, onChange: list.setStatusFilter,
        options: [
          { value: 'ALL', label: 'Semua status' },
          { value: 'PURCHASE_REQUEST', label: 'Purchase Request' },
          { value: 'PURCHASE_ORDER', label: 'Purchase Order' },
          { value: 'COMPLETED', label: 'Selesai' },
          { value: 'REJECTED', label: 'Ditolak' },
          { value: 'CANCELLED', label: 'Dibatalkan' },
        ],
      },
    ]}
    hasFilters={hasFilters}
    onReset={resetFilters}
    isFetching={list.isFetching && !list.loading}
    fetchingLabel="Memperbarui pembelian"
  />
}

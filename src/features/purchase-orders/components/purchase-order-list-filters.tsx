import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ListFilters } from '@/components/ui/list-filters'
import type { usePurchaseOrders } from '../hooks/use-purchase-orders'
import type { PurchaseOrderCategory } from '../types'
import { hasPurchaseOrderFilters } from '../lib/list-filters'

interface Props {
  list: ReturnType<typeof usePurchaseOrders>
}

const sorts = {
  'date-desc': 'Tanggal Terbaru', 'date-asc': 'Tanggal Terlama',
  'amount-desc': 'Nominal Tertinggi', 'amount-asc': 'Nominal Terendah',
}

export function PurchaseOrderListFilters({ list }: Props) {
  const hasFilters = hasPurchaseOrderFilters(list)

  function resetFilters() {
    list.setSearch('')
    list.setCategoryFilter('ALL')
    list.setStatusFilter('ALL')
    list.setReceiptStatusFilter('ALL')
    list.setPaymentStatusFilter('ALL')
    list.setSortBy('date-desc')
  }

  return <ListFilters
    label="Filter pembelian"
    search={{
      label: 'Cari pembelian',
      placeholder: 'Cari pembelian...',
      value: list.search, onChange: list.setSearch,
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
        id: 'status', label: 'Status Dokumen', value: list.statusFilter, onChange: list.setStatusFilter,
        options: [
          { value: 'ALL', label: 'Semua status dokumen' },
          { value: 'PURCHASE_REQUEST', label: 'Purchase Request' },
          { value: 'PURCHASE_ORDER', label: 'Purchase Order' },
          { value: 'COMPLETED', label: 'Selesai' },
          { value: 'REJECTED', label: 'Ditolak' },
          { value: 'CANCELLED', label: 'Dibatalkan' },
        ],
      },
      {
        id: 'receipt', label: 'Penerimaan', value: list.receiptStatusFilter, onChange: list.setReceiptStatusFilter,
        options: [{ value: 'ALL', label: 'Semua penerimaan' }, { value: 'NOT_RECEIVED', label: 'Belum Diterima' }, { value: 'RECEIVED', label: 'Sudah Diterima' }],
      },
      {
        id: 'payment', label: 'Pembayaran', value: list.paymentStatusFilter, onChange: list.setPaymentStatusFilter,
        options: [{ value: 'ALL', label: 'Semua pembayaran' }, { value: 'UNPAID', label: 'Belum Dibayar' }, { value: 'PAID', label: 'Sudah Dibayar' }],
      },
    ]}
    summary={list.loading ? 'Memuat pembelian...' : list.error ? 'Data belum tersedia' : `${list.total} pembelian${hasFilters && !list.summaryError ? ` dari ${list.totalCount}` : ''}`}
    hasFilters={hasFilters}
    onReset={resetFilters}
    isFetching={list.isFetching && !list.loading}
    fetchingLabel="Memperbarui pembelian"
    trailingActions={
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-10 gap-1.5 text-xs rounded-md shadow-2xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            Urutkan
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 text-xs">
          <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">Urutan</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(sorts).map(([value, label]) => <DropdownMenuItem key={value} onClick={() => list.setSortBy(value)} className="cursor-pointer">{label}</DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>
    }
  />
}

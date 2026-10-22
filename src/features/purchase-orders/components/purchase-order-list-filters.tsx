import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ListFilters } from '@/components/ui/list-filters'
import type { usePurchaseOrders } from '../hooks/use-purchase-orders'
import type { PurchaseOrderCategory } from '../types'

interface Props {
  list: ReturnType<typeof usePurchaseOrders>
}

export function PurchaseOrderListFilters({ list }: Props) {
  const hasFilters = Boolean(list.search.trim()) || list.categoryFilter !== 'ALL' || list.statusFilter !== 'ALL' || list.sortBy !== 'date-desc'

  function resetFilters() {
    list.setSearch('')
    list.setCategoryFilter('ALL')
    list.setStatusFilter('ALL')
    list.setSortBy('date-desc')
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
    trailingActions={
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-10 gap-1.5 text-xs rounded-md shadow-2xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            Urutkan
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 text-xs">
          <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
            Urutan
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => list.setSortBy("date-desc")}
            className="cursor-pointer"
          >
            Tanggal Terbaru
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => list.setSortBy("date-asc")}
            className="cursor-pointer"
          >
            Tanggal Terlama
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => list.setSortBy("amount-desc")}
            className="cursor-pointer"
          >
            Nominal Tertinggi
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => list.setSortBy("amount-asc")}
            className="cursor-pointer"
          >
            Nominal Terendah
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    }
  />
}

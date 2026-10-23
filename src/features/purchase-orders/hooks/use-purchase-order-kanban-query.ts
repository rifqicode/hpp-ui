import { useInfiniteQuery } from '@tanstack/react-query'
import { purchaseOrderService } from '../services/po-service'
import { purchaseOrderKeys } from './use-purchase-orders-query'
import type { PurchaseOrderKanbanColumn, PurchaseOrderQueryParams } from '../types'

function useColumn(column: PurchaseOrderKanbanColumn, params: PurchaseOrderQueryParams, enabled: boolean) {
  const filters = {
    search: params.search, status: params.status, category: params.category,
    receipt_status: params.receipt_status, payment_status: params.payment_status, sort_by: params.sort_by,
  }
  const query = useInfiniteQuery({
    queryKey: [...purchaseOrderKeys.all, 'kanban', column, filters],
    queryFn: ({ pageParam }) => purchaseOrderService.getPurchaseOrders({
      ...filters, kanban_column: column, page: pageParam, limit: 10,
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled,
  })
  const orders = [...new Map(query.data?.pages.flatMap((page) => page.items).map((order) => [order.id, order])).values()]
  return {
    id: column, orders,
    total: query.data?.pages[0]?.total ?? 0,
    loading: query.isLoading,
    isFetching: query.isFetching,
    loadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    error: query.error instanceof Error ? query.error.message : '',
    loadMore: () => query.fetchNextPage(),
    retry: () => query.isFetchNextPageError ? query.fetchNextPage() : query.refetch(),
  }
}

export function usePurchaseOrderKanbanQuery(params: PurchaseOrderQueryParams, enabled: boolean) {
  const pengajuan = useColumn('pengajuan', params, enabled)
  const dipesan = useColumn('dipesan', params, enabled)
  const diterima = useColumn('diterima', params, enabled)
  const selesai = useColumn('selesai', params, enabled)
  const ditutup = useColumn('ditutup', params, enabled)
  return [pengajuan, dipesan, diterima, selesai, ditutup]
}

export type PurchaseOrderKanbanState = ReturnType<typeof useColumn>

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { purchaseOrderService } from "../services/po-service"
import {
  usePurchaseOrdersQuery,
  usePurchaseOrderSummaryQuery,
  purchaseOrderKeys,
} from "./use-purchase-orders-query"
import { useAuthStore } from "@/store/use-auth-store"
import { usePermission } from "@/hooks/use-permission"
import type {
  PurchaseOrder,
  PurchaseOrderQueryParams,
  PurchaseOrderCategory,
} from "../types"

export function usePurchaseOrders() {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)
  const { can } = usePermission()

  const [search, setSearch] = React.useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("")
  const [categoryFilter, setCategoryFilter] = React.useState<PurchaseOrderCategory | "ALL">("ALL")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")
  const [page, setPage] = React.useState<number>(1)
  const [limit, setLimit] = React.useState<number>(10)

  // Action modals state
  const [approvingPO, setApprovingPO] = React.useState<PurchaseOrder | null>(null)
  const [approveSupplierId, setApproveSupplierId] = React.useState<string>("")
  const [approveNotes, setApproveNotes] = React.useState<string>("")

  const [rejectingPO, setRejectingPO] = React.useState<PurchaseOrder | null>(null)
  const [rejectReason, setRejectReason] = React.useState<string>("")

  const [completingPO, setCompletingPO] = React.useState<PurchaseOrder | null>(null)
  const [completeSupplierId, setCompleteSupplierId] = React.useState<string>("")
  const [itemTotalPrices, setItemTotalPrices] = React.useState<Record<string, number>>({})

  const [submitting, setSubmitting] = React.useState<boolean>(false)

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  const queryParams: PurchaseOrderQueryParams = {
    page,
    limit,
    search: debouncedSearch.trim() || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    category: categoryFilter === "ALL" ? undefined : categoryFilter,
  }

  const ordersQuery = usePurchaseOrdersQuery(queryParams)
  const summaryQuery = usePurchaseOrderSummaryQuery()

  const orders: PurchaseOrder[] = ordersQuery.data?.items || []
  const total = ordersQuery.data?.total || 0
  const totalPages = ordersQuery.data?.totalPages || 1
  const loading = ordersQuery.isLoading || summaryQuery.isLoading
  const error = ordersQuery.error instanceof Error ? ordersQuery.error.message : ""

  const loadOrders = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
    ])
  }, [queryClient])

  // --- Handlers: Approve ---
  function handleOpenApprove(po: PurchaseOrder) {
    setApprovingPO(po)
    setApproveSupplierId(po.supplierId || "")
    setApproveNotes("")
  }

  async function handleConfirmApprove(e: React.FormEvent) {
    e.preventDefault()
    if (!approvingPO) return

    setSubmitting(true)
    try {
      await purchaseOrderService.approvePurchaseOrder(approvingPO.id, {
        supplier_id: approveSupplierId || undefined,
        notes: approveNotes || undefined,
      })
      setApprovingPO(null)
      await loadOrders()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyetujui request"
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // --- Handlers: Reject ---
  function handleOpenReject(po: PurchaseOrder) {
    setRejectingPO(po)
    setRejectReason("")
  }

  async function handleConfirmReject(e: React.FormEvent) {
    e.preventDefault()
    if (!rejectingPO) return
    if (!rejectReason.trim()) {
      alert("Alasan penolakan wajib diisi")
      return
    }

    setSubmitting(true)
    try {
      await purchaseOrderService.rejectPurchaseOrder(rejectingPO.id, {
        reason: rejectReason.trim(),
      })
      setRejectingPO(null)
      await loadOrders()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menolak request"
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // --- Handlers: Complete ---
  function handleOpenComplete(po: PurchaseOrder) {
    setCompletingPO(po)
    setCompleteSupplierId(po.supplierId || "")
    const initial: Record<string, number> = {}
    po.items.forEach((it) => {
      initial[it.id] = it.totalPrice || (it.unitPrice ? it.unitPrice * it.quantity : 0)
    })
    setItemTotalPrices(initial)
  }

  async function handleConfirmComplete(e: React.FormEvent) {
    e.preventDefault()
    if (!completingPO) return
    if (!completeSupplierId) {
      alert("Vendor / Supplier final wajib dipilih sebelum menyelesaikan pesanan")
      return
    }

    setSubmitting(true)
    try {
      const prices = completingPO.items.map((it) => {
        const total = Number(itemTotalPrices[it.id]) || 0
        const unit_price = it.quantity > 0 ? Number((total / it.quantity).toFixed(4)) : 0
        return {
          item_id: it.id,
          unit_price,
          total_price: total,
        }
      })

      await purchaseOrderService.completePurchaseOrder(completingPO.id, {
        supplier_id: completeSupplierId,
        prices,
      })
      setCompletingPO(null)
      await loadOrders()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyelesaikan purchase order"
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // --- Handlers: Cancel ---
  async function handleCancelPO(po: PurchaseOrder) {
    const isRequest = po.status === "PURCHASE_REQUEST"
    const confirmMsg = isRequest
      ? `Apakah Anda yakin ingin membatalkan Purchase Request ${po.poNumber}?`
      : `Apakah Anda yakin ingin membatalkan Purchase Order ${po.poNumber}?`
    if (!window.confirm(confirmMsg)) return

    setSubmitting(true)
    try {
      await purchaseOrderService.cancelPurchaseOrder(po.id)
      await loadOrders()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membatalkan pesanan"
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Pagination navigation
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1)
    }
  }

  // RBAC checks
  const canProcess = can("purchases:process")
  const canRequest = can("purchases:request")
  const canEditPO = (po: PurchaseOrder) => {
    if (po.status !== "PURCHASE_REQUEST") return false
    return (
      canProcess ||
      (canRequest && !!currentUser?.id && po.createdByUserId === currentUser.id)
    )
  }

  // Summary counts directly from backend summary endpoint
  const summary = summaryQuery.data
  const totalCount = summary?.total_orders ?? total
  const requestCount = summary?.request_count ?? 0
  const orderCount = summary?.order_count ?? 0
  const completedCount = summary?.completed_count ?? 0
  const totalCompletedAmount = Number(summary?.total_completed_amount ?? 0)

  function formatDate(dateStr: string) {
    if (!dateStr) return "-"
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(dateStr)).replace(" pukul ", ", ")
  }

  return {
    currentUser,
    canProcess,
    canRequest,
    canEditPO,
    orders,
    loading,
    isFetching: ordersQuery.isFetching || summaryQuery.isFetching,
    error,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter: (category: PurchaseOrderCategory | "ALL") => {
      setCategoryFilter(category)
      setPage(1)
    },
    statusFilter,
    setStatusFilter: (status: string) => {
      setStatusFilter(status)
      setPage(1)
    },
    page,
    limit,
    setLimit,
    totalPages,
    total,
    handleNextPage,
    handlePrevPage,
    // Approve modal
    approvingPO,
    setApprovingPO,
    approveSupplierId,
    setApproveSupplierId,
    approveNotes,
    setApproveNotes,
    handleOpenApprove,
    handleConfirmApprove,
    // Reject modal
    rejectingPO,
    setRejectingPO,
    rejectReason,
    setRejectReason,
    handleOpenReject,
    handleConfirmReject,
    // Complete modal
    completingPO,
    setCompletingPO,
    completeSupplierId,
    setCompleteSupplierId,
    itemPrices: itemTotalPrices,
    setItemPrices: setItemTotalPrices,
    itemTotalPrices,
    setItemTotalPrices,
    handleOpenComplete,
    handleConfirmComplete,
    // Cancel & Submitting
    submitting,
    handleCancelPO,
    loadOrders,
    totalCount,
    requestCount,
    orderCount,
    inProgressCount: orderCount,
    completedCount,
    totalCompletedAmount,
    formatDate,
  }
}

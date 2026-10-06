import * as React from "react"
import { purchaseOrderService } from "../services/po-service"
import { useAuthStore } from "@/store/use-auth-store"
import { usePermission } from "@/hooks/use-permission"
import type {
  PurchaseOrder,
  PurchaseOrderQueryParams,
} from "../types"

export function usePurchaseOrders() {
  const currentUser = useAuthStore((state) => state.user)
  const { can } = usePermission()

  const [orders, setOrders] = React.useState<PurchaseOrder[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string>("")
  const [search, setSearch] = React.useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")
  const [page, setPage] = React.useState<number>(1)
  const [limit, setLimit] = React.useState<number>(10)
  const [total, setTotal] = React.useState<number>(0)
  const [totalPages, setTotalPages] = React.useState<number>(1)

  // Action modals state
  const [approvingPO, setApprovingPO] = React.useState<PurchaseOrder | null>(null)
  const [approveSupplierId, setApproveSupplierId] = React.useState<string>("")
  const [approveNotes, setApproveNotes] = React.useState<string>("")

  const [rejectingPO, setRejectingPO] = React.useState<PurchaseOrder | null>(null)
  const [rejectReason, setRejectReason] = React.useState<string>("")

  const [completingPO, setCompletingPO] = React.useState<PurchaseOrder | null>(null)
  const [completeSupplierId, setCompleteSupplierId] = React.useState<string>("")
  const [itemPrices, setItemPrices] = React.useState<Record<string, number>>({})

  const [submitting, setSubmitting] = React.useState<boolean>(false)

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  const loadOrders = React.useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params: PurchaseOrderQueryParams = {
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      }
      const data = await purchaseOrderService.getPurchaseOrders(params)
      setOrders(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat purchase orders"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, statusFilter])

  React.useEffect(() => {
    let ignore = false
    const params: PurchaseOrderQueryParams = {
      page,
      limit,
      search: debouncedSearch.trim() || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
    }

    purchaseOrderService
      .getPurchaseOrders(params)
      .then((data) => {
        if (!ignore) {
          setOrders(data.items)
          setTotal(data.total)
          setTotalPages(data.totalPages)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Gagal memuat purchase orders"
          setError(msg)
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [page, limit, debouncedSearch, statusFilter])

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
      initial[it.id] = it.unitPrice || 0
    })
    setItemPrices(initial)
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
      const prices = completingPO.items.map((it) => ({
        item_id: it.id,
        unit_price: Number(itemPrices[it.id]) || 0,
      }))

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
  async function handleCancelPO(id: string) {
    if (!confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) return
    try {
      await purchaseOrderService.cancelPurchaseOrder(id)
      await loadOrders()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membatalkan purchase order"
      alert(msg)
    }
  }

  const handleNextPage = () => {
    if (page < totalPages) setPage((p) => p + 1)
  }

  const handlePrevPage = () => {
    if (page > 1) setPage((p) => p - 1)
  }

  // Permissions helpers
  const canProcess = can("purchases:process")
  const canRequest = can("purchases:request")

  const canEditPO = (po: PurchaseOrder): boolean => {
    return (
      po.status === "PURCHASE_REQUEST" &&
      canRequest &&
      !!currentUser?.id &&
      po.createdByUserId === currentUser.id
    )
  }

  // Summary counts
  const totalCount = total
  const requestCount = orders.filter((o) => o.status === "PURCHASE_REQUEST").length
  const orderCount = orders.filter((o) => o.status === "PURCHASE_ORDER").length
  const completedCount = orders.filter((o) => o.status === "COMPLETED").length
  const totalCompletedAmount = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((acc, o) => acc + o.totalAmount, 0)

  function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "-"
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr))
  }

  return {
    currentUser,
    canProcess,
    canRequest,
    canEditPO,
    orders,
    loading,
    error,
    search,
    setSearch,
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
    itemPrices,
    setItemPrices,
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
    formatRupiah,
    formatDate,
  }
}

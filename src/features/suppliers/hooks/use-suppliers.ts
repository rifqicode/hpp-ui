import * as React from "react"
import { supplierService } from "../services/supplier-service"
import type { Supplier, CreateSupplierInput } from "../types"

export type SortOption = "name-asc" | "name-desc" | "orders-desc" | "spent-desc"

export function useSuppliers() {
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string>("")
  const [search, setSearch] = React.useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("")
  const [sortBy, setSortBy] = React.useState<SortOption>("name-asc")
  const [page, setPage] = React.useState<number>(1)
  const [limit, setLimit] = React.useState<number>(10)
  const [total, setTotal] = React.useState<number>(0)
  const [totalPages, setTotalPages] = React.useState<number>(1)

  // Debounce search input to avoid hitting backend on every keystroke
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  // Modal states
  const [isFormOpen, setIsFormOpen] = React.useState<boolean>(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState<boolean>(false)
  const [submitting, setSubmitting] = React.useState<boolean>(false)
  const [formError, setFormError] = React.useState<string>("")

  const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null)
  const [deletingSupplier, setDeletingSupplier] = React.useState<Supplier | null>(null)

  // Form inputs
  const [formData, setFormData] = React.useState<CreateSupplierInput>({
    name: "",
    contact: "",
    address: "",
  })

  // Load suppliers from backend
  const loadSuppliers = React.useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await supplierService.getSuppliers({
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        sortBy,
      })
      setSuppliers(data.items || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat data supplier"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, sortBy])

  React.useEffect(() => {
    let ignore = false
    supplierService
      .getSuppliers({
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        sortBy,
      })
      .then((data) => {
        if (!ignore) {
          setSuppliers(data.items || [])
          setTotal(data.total || 0)
          setTotalPages(data.totalPages || 1)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Gagal memuat data supplier"
          setError(msg)
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [page, limit, debouncedSearch, sortBy])

  // Open modal for Create
  function handleOpenCreate() {
    setEditingSupplier(null)
    setFormData({ name: "", contact: "", address: "" })
    setFormError("")
    setIsFormOpen(true)
  }

  // Open modal for Edit
  function handleOpenEdit(supplier: Supplier) {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      contact: supplier.contact,
      address: supplier.address,
    })
    setFormError("")
    setIsFormOpen(true)
  }

  // Open delete confirmation
  function handleOpenDelete(supplier: Supplier) {
    setDeletingSupplier(supplier)
    setIsDeleteDialogOpen(true)
  }

  // Handle Form Submit (Create / Update)
  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFormError("Nama supplier wajib diisi")
      return
    }

    setSubmitting(true)
    setFormError("")
    try {
      if (editingSupplier) {
        await supplierService.updateSupplier(editingSupplier.id, formData)
      } else {
        await supplierService.createSupplier(formData)
      }
      setIsFormOpen(false)
      await loadSuppliers()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan supplier"
      setFormError(message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Confirm Delete
  async function handleConfirmDelete() {
    if (!deletingSupplier) return
    setSubmitting(true)
    try {
      await supplierService.deleteSupplier(deletingSupplier.id)
      setIsDeleteDialogOpen(false)
      setDeletingSupplier(null)
      await loadSuppliers()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menghapus supplier"
      alert(message)
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

  // Statistics (based on current page suppliers or total)
  const totalVendors = total
  const totalPurchasesSum = suppliers.reduce((acc, s) => acc + (s.totalPurchases || 0), 0)
  const activeVendorsCount = suppliers.filter((s) => (s.totalOrdersCount || 0) > 0).length

  function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return {
    suppliers,
    loading,
    error,
    search,
    setSearch,
    sortBy,
    setSortBy,
    filteredSuppliers: suppliers,
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    handleNextPage,
    handlePrevPage,
    totalVendors,
    totalPurchasesSum,
    activeVendorsCount,
    isFormOpen,
    setIsFormOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    submitting,
    formError,
    editingSupplier,
    deletingSupplier,
    formData,
    setFormData,
    loadSuppliers,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDelete,
    handleSubmitForm,
    handleConfirmDelete,
    formatRupiah,
  }
}

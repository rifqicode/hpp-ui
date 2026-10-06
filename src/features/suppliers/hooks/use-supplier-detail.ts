import * as React from "react"
import { supplierService } from "../services/supplier-service"
import type { Supplier, SupplierPurchaseRecord, UpdateSupplierInput } from "../types"

export function useSupplierDetail(supplierId?: string) {
  const [supplier, setSupplier] = React.useState<Supplier | null>(null)
  const [purchases, setPurchases] = React.useState<SupplierPurchaseRecord[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string>("")

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = React.useState<boolean>(false)
  const [editData, setEditData] = React.useState<UpdateSupplierInput>({
    name: "",
    contact: "",
    address: "",
  })
  const [submitting, setSubmitting] = React.useState<boolean>(false)

  const loadData = React.useCallback(async () => {
    if (!supplierId) return
    setLoading(true)
    setError("")
    try {
      const sup = await supplierService.getSupplierById(supplierId)
      setSupplier(sup)
      setEditData({
        name: sup.name,
        contact: sup.contact,
        address: sup.address,
      })

      try {
        const history = await supplierService.getSupplierPurchases(supplierId)
        setPurchases(history)
      } catch {
        setPurchases([])
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat rincian supplier"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [supplierId])

  React.useEffect(() => {
    if (!supplierId) return
    let ignore = false

    supplierService
      .getSupplierById(supplierId)
      .then((sup) => {
        if (!ignore) {
          setSupplier(sup)
          setEditData({
            name: sup.name,
            contact: sup.contact,
            address: sup.address,
          })
          setLoading(false)

          supplierService
            .getSupplierPurchases(supplierId)
            .then((history) => {
              if (!ignore) {
                setPurchases(history)
              }
            })
            .catch(() => {
              if (!ignore) {
                setPurchases([])
              }
            })
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Gagal memuat rincian supplier"
          setError(msg)
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [supplierId])

  async function handleUpdateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supplierId || !editData.name?.trim()) return

    setSubmitting(true)
    try {
      const updated = await supplierService.updateSupplier(supplierId, editData)
      setSupplier(updated)
      setIsEditOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui profil supplier"
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return "-"
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr))
  }

  const totalSpent = purchases.reduce((acc, p) => acc + p.totalPrice, 0) || (supplier?.totalPurchases || 0)
  const averageOrder = purchases.length > 0 ? totalSpent / purchases.length : 0

  return {
    supplier,
    purchases,
    loading,
    error,
    isEditOpen,
    setIsEditOpen,
    editData,
    setEditData,
    submitting,
    loadData,
    handleUpdateSubmit,
    formatRupiah,
    formatDate,
    totalSpent,
    averageOrder,
  }
}

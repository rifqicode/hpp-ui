import * as React from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  Calendar,
  AlertCircle,
  Hash,
  Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

import { supplierService } from "@/features/suppliers/services/supplier-service"
import { stockService, type MaterialOption } from "@/features/inventory/services/stock-service"
import { purchaseOrderService, generatePONumber } from "@/features/purchase-orders/services/po-service"
import type { Supplier } from "@/features/suppliers/types"
import type { CreatePOItemInput } from "@/features/purchase-orders/types"

interface ItemRowState {
  stockId: string;
  stockName: string;
  quantity: string;
  baseUnit: string;
  estimatedUnitPrice: string;
}

export default function CreatePurchaseOrderPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [suppliers, setSuppliers] = React.useState<Supplier[]>([])
  const [materials, setMaterials] = React.useState<MaterialOption[]>([])
  const [loadingInitial, setLoadingInitial] = React.useState<boolean>(true)

  // Auto generated PO Number
  const [poNumberPreview] = React.useState<string>(() => generatePONumber())

  // Form State
  const [supplierId, setSupplierId] = React.useState<string>("")
  const [orderDate, setOrderDate] = React.useState<string>(() => {
    return new Date().toISOString().slice(0, 10)
  })
  const [notes, setNotes] = React.useState<string>("")

  // Dynamic Item Rows
  const [items, setItems] = React.useState<ItemRowState[]>([
    {
      stockId: "",
      stockName: "",
      quantity: "",
      baseUnit: "",
      estimatedUnitPrice: "",
    },
  ])

  const [formError, setFormError] = React.useState<string>("")
  const [submitting, setSubmitting] = React.useState<boolean>(false)

  // Load suppliers and materials
  React.useEffect(() => {
    async function loadData() {
      try {
        const [supData, matData] = await Promise.all([
          supplierService.getSuppliers(),
          stockService.getMaterials(),
        ])
        setSuppliers(supData)
        setMaterials(matData)

        // If supplierId was provided via query param
        const querySupId = searchParams.get("supplierId")
        if (querySupId && supData.some((s) => s.id === querySupId)) {
          setSupplierId(querySupId)
        } else if (supData.length > 0) {
          setSupplierId(supData[0].id)
        }

        // Initialize first item
        if (matData.length > 0) {
          setItems([
            {
              stockId: matData[0].id,
              stockName: matData[0].name,
              quantity: "10",
              baseUnit: matData[0].baseUnit,
              estimatedUnitPrice: matData[0].latestPrice?.toString() || "0",
            },
          ])
        }
      } catch (err) {
        console.error("Failed to load form dependencies:", err)
      } finally {
        setLoadingInitial(false)
      }
    }
    loadData()
  }, [searchParams])

  const selectedSupplier = suppliers.find((s) => s.id === supplierId)

  // Item row operations
  function handleAddItem() {
    const defaultMat = materials[0]
    setItems([
      ...items,
      {
        stockId: defaultMat?.id || "",
        stockName: defaultMat?.name || "",
        quantity: "1",
        baseUnit: defaultMat?.baseUnit || "pcs",
        estimatedUnitPrice: defaultMat?.latestPrice?.toString() || "0",
      },
    ])
  }

  function handleRemoveItem(index: number) {
    if (items.length <= 1) return
    setItems(items.filter((_, idx) => idx !== index))
  }

  function handleSelectMaterial(index: number, mat: MaterialOption) {
    const updated = [...items]
    updated[index] = {
      ...updated[index],
      stockId: mat.id,
      stockName: mat.name,
      baseUnit: mat.baseUnit,
      estimatedUnitPrice: mat.latestPrice?.toString() || "0",
    }
    setItems(updated)
  }

  function handleItemChange(index: number, field: "quantity" | "estimatedUnitPrice", value: string) {
    const updated = [...items]
    updated[index] = {
      ...updated[index],
      [field]: value,
    }
    setItems(updated)
  }

  // Calculate total estimate
  const totalEstimate = items.reduce((acc, it) => {
    const q = parseFloat(it.quantity) || 0
    const p = parseFloat(it.estimatedUnitPrice) || 0
    return acc + q * p
  }, 0)

  function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supplierId || !selectedSupplier) {
      setFormError("Pilih supplier terlebih dahulu")
      return
    }

    if (items.length === 0) {
      setFormError("Tambahkan minimal 1 item bahan baku")
      return
    }

    // Validate quantities
    for (const it of items) {
      if (!it.stockId || !it.stockName) {
        setFormError("Ada item bahan baku yang belum dipilih")
        return
      }
      const q = parseFloat(it.quantity)
      if (isNaN(q) || q <= 0) {
        setFormError(`Kuantitas untuk "${it.stockName}" harus lebih besar dari 0`)
        return
      }
    }

    setSubmitting(true)
    setFormError("")

    try {
      const payloadItems: CreatePOItemInput[] = items.map((it) => ({
        stockId: it.stockId,
        stockName: it.stockName,
        quantity: parseFloat(it.quantity),
        baseUnit: it.baseUnit,
        estimatedUnitPrice: parseFloat(it.estimatedUnitPrice) || 0,
      }))

      await purchaseOrderService.createPurchaseOrder({
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        notes,
        orderDate: new Date(orderDate).toISOString(),
        items: payloadItems,
      })

      navigate("/inventory/purchase-orders")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat Purchase Request"
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingInitial) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Menyiapkan formulir...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link to="/inventory/purchase-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Buat Purchase Request (Pengajuan PO)
          </h1>
          <p className="text-sm text-muted-foreground">
            Sistem otomatis menghasilkan nomor PO dan menetapkan status awal <strong>Dalam Proses</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Badge variant="outline" className="px-3 py-1 font-mono text-sm bg-muted/50 border-primary/30 text-primary flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5" />
            {poNumberPreview}
          </Badge>
          <Badge variant="warning">Dalam Proses</Badge>
        </div>
      </div>

      {formError && (
        <div className="p-3.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Informasi Vendor & Pengiriman */}
        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Informasi Rekanan & Tanggal Pemesanan
            </CardTitle>
            <CardDescription>
              Tentukan vendor tujuan dan jadwal pengadaan bahan.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {/* Vendor Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Vendor / Supplier <span className="text-destructive">*</span>
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between rounded-xl h-10"
                  >
                    <span className="truncate">
                      {selectedSupplier ? selectedSupplier.name : "Pilih Supplier"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto" align="start">
                  <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                    Daftar Supplier
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {suppliers.map((s) => (
                    <DropdownMenuItem
                      key={s.id}
                      onClick={() => setSupplierId(s.id)}
                      className="cursor-pointer"
                    >
                      {s.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer text-primary font-medium">
                    <Link to="/inventory/suppliers">+ Tambah Supplier Baru</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {selectedSupplier && selectedSupplier.contact && (
                <p className="text-xs text-muted-foreground">Kontak: {selectedSupplier.contact}</p>
              )}
            </div>

            {/* Tanggal Pesan */}
            <div className="space-y-2">
              <Label htmlFor="order-date" className="text-sm font-semibold flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Tanggal Order / Diajukan
              </Label>
              <Input
                id="order-date"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="rounded-xl h-10"
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="po-notes" className="text-sm font-semibold">
                Catatan / Instruksi Pengiriman (Opsional)
              </Label>
              <Textarea
                id="po-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Tolong kirim sebelum jam 10 pagi, titipkan di bagian dapur."
                className="rounded-xl min-h-[70px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Daftar Item Bahan Baku */}
        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base">Daftar Bahan Baku yang Dipesan</CardTitle>
                <CardDescription>
                  Pilih bahan baku dan kuantitas yang dibutuhkan dari vendor.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="rounded-xl"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Tambah Bahan
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 rounded-xl border border-border bg-card/50"
              >
                {/* Material Selector */}
                <div className="flex-1 w-full sm:w-auto">
                  <Label className="text-xs text-muted-foreground mb-1 block">Bahan Baku #{idx + 1}</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between rounded-lg h-9 text-left font-normal"
                      >
                        <span className="truncate">{item.stockName || "Pilih Bahan"}</span>
                        <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 max-h-56 overflow-y-auto" align="start">
                      {materials.map((m) => (
                        <DropdownMenuItem
                          key={m.id}
                          onClick={() => handleSelectMaterial(idx, m)}
                          className="cursor-pointer"
                        >
                          {m.name} ({m.baseUnit})
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Quantity */}
                <div className="w-full sm:w-32">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Kuantitas ({item.baseUnit || "-"})
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    min="0.0001"
                    placeholder="0"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                    className="rounded-lg h-9 font-mono text-sm"
                    required
                  />
                </div>

                {/* Estimated Unit Price */}
                <div className="w-full sm:w-40">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Estimasi Harga Satuan
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0 (opsional)"
                    value={item.estimatedUnitPrice}
                    onChange={(e) => handleItemChange(idx, "estimatedUnitPrice", e.target.value)}
                    className="rounded-lg h-9 font-mono text-sm text-right"
                  />
                </div>

                {/* Subtotal preview */}
                <div className="w-full sm:w-36 text-right sm:self-center pt-2 sm:pt-4">
                  <span className="text-xs text-muted-foreground block">Subtotal</span>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {formatRupiah(
                      (parseFloat(item.quantity) || 0) * (parseFloat(item.estimatedUnitPrice) || 0)
                    )}
                  </span>
                </div>

                {/* Remove button */}
                <div className="sm:self-center pt-2 sm:pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Total Estimated Box */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between mt-4">
              <div>
                <span className="text-sm font-semibold text-foreground block">Total Estimasi Anggaran:</span>
                <span className="text-xs text-muted-foreground">
                  *Harga pasti akan dikonfirmasi saat pesanan diselesaikan (status Completed)
                </span>
              </div>
              <span className="text-xl font-bold font-mono text-primary">
                {formatRupiah(totalEstimate)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Process Explanation Alert */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Alur Proses Purchase Order:</strong> Setelah form ini dikirim, sistem akan menyimpan pesanan dengan nomor PO unik berstatus <strong>Dalam Proses</strong>. Setelah barang tiba dari vendor, Anda dapat mengisi harga faktur final melalui menu <em>"Set Harga & Selesaikan"</em> untuk otomatis membentuk batch stok dan memperbarui HPP.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/inventory/purchase-orders")}
            className="rounded-xl"
            disabled={submitting}
          >
            Batal
          </Button>
          <Button type="submit" className="rounded-xl shadow-sm px-6" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kirim Purchase Request
          </Button>
        </div>
      </form>
    </div>
  )
}

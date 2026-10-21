import { stockKeys } from '@/features/inventory/hooks/use-stocks-query'
import { supplierKeys } from '@/features/suppliers/hooks/use-suppliers-query'
import { PURCHASE_ORDER_CATEGORY_LABELS, type PurchaseOrderCategory } from '@/features/purchase-orders/types'
import { CurrencyText } from '@/components/ui/currency-text'
import { POAttachmentUpload } from '@/features/purchase-orders/components/po-attachment-upload'
import type { POAttachment } from '@/features/purchase-orders/lib/attachment'
import { PurchaseUnitFields } from '@/features/inventory/components/purchase-unit-fields'
import { buildPurchaseOrderItems, type PurchaseOrderItemDraft } from '@/features/purchase-orders/lib/order-items'
import type { CreatePOItemInput } from '@/features/purchase-orders/types'
import * as React from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  Calendar,
  AlertCircle,
  Hash,
  Loader2,
  Paperclip,
  Package,
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
import { purchaseOrderService } from "@/features/purchase-orders/services/po-service"
import { purchaseOrderKeys } from "@/features/purchase-orders/hooks/use-purchase-orders-query"
import type { Supplier } from "@/features/suppliers/types"


export default function CreatePurchaseOrderPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { poId } = useParams<{ poId?: string }>()
  const [searchParams] = useSearchParams()
  const isEditMode = Boolean(poId)

  const [suppliers, setSuppliers] = React.useState<Supplier[]>([])
  const [materials, setMaterials] = React.useState<MaterialOption[]>([])
  const [loadingInitial, setLoadingInitial] = React.useState<boolean>(true)
  const loadingMaterials = loadingInitial

  // PO Number preview or existing
  const [poNumber, setPoNumber] = React.useState<string>("P-AUTO-GENERATED")

  // Form State
  const [supplierId, setSupplierId] = React.useState<string>("")
  const [orderDate, setOrderDate] = React.useState<string>(() => {
    return new Date().toISOString().slice(0, 10)
  })
  const [category, setCategory] = React.useState<PurchaseOrderCategory>("PURCHASE_ORDER")
  const isDirectOrder = category === "DIRECT_ORDER"
  const [notes, setNotes] = React.useState<string>("")
  const [attachments, setAttachments] = React.useState<POAttachment[]>([])
  const [uploadingAttachment, setUploadingAttachment] = React.useState(false)
  const [editable, setEditable] = React.useState(true)

  // Dynamic Item Rows
  const [items, setItems] = React.useState<PurchaseOrderItemDraft[]>([
    {
      stockId: "",
      stockName: "",
      quantity: "",
      baseUnit: "",
    },
  ])

  const [formError, setFormError] = React.useState<string>("")
  const [submitting, setSubmitting] = React.useState<boolean>(false)

  // Load suppliers, materials, and existing PO if in edit mode
  React.useEffect(() => {
    async function loadData() {
      try {
        const [supData, matData] = await Promise.all([
          supplierService.getAllSuppliers(),
          stockService.getMaterials(),
        ])
        setSuppliers(supData)
        setMaterials(matData)

        if (poId) {
          const existing = await purchaseOrderService.getPurchaseOrderById(poId)
          if (existing.status !== "PURCHASE_REQUEST") {
            setEditable(false)
            setFormError("Hanya pesanan berstatus 'Purchase Request' yang dapat diedit.")
          }
          setCategory(existing.category)
          setPoNumber(existing.poNumber)
          setSupplierId(existing.supplierId || "")
          setOrderDate(
            existing.orderDate
              ? existing.orderDate.slice(0, 10)
              : new Date().toISOString().slice(0, 10)
          )
          setNotes(existing.notes || "")
          setAttachments(existing.attachments)
          if (existing.items && existing.items.length > 0) {
            setItems(
              existing.items.map((it) => ({
                stockId: it.stockId,
                stockName: it.stockName,
                quantity: it.quantity.toString(),
                baseUnit: it.baseUnit,
              }))
            )
          }
        } else {
          // If supplierId was provided via query param
          const querySupId = searchParams.get("supplierId")
          if (querySupId && supData.some((s) => s.id === querySupId)) {
            setSupplierId(querySupId)
          }

          // Initialize first item
          if (matData.length > 0) {
            setItems([
              {
                stockId: matData[0].id,
                stockName: matData[0].name,
                quantity: "10",
                baseUnit: matData[0].baseUnit,
              },
            ])
          }
        }
      } catch (err) {
        console.error("Failed to load form dependencies:", err)
        setFormError("Gagal memuat data formulir")
      } finally {
        setLoadingInitial(false)
      }
    }
    loadData()
  }, [poId, searchParams])

  const selectedSupplier = suppliers.find((s) => s.id === supplierId)

  // Item row operations
  function handleAddItem() {
    if (loadingMaterials || materials.length === 0) return
    const defaultMat = materials[0]
    setItems([
      ...items,
      {
        stockId: defaultMat?.id || "",
        stockName: defaultMat?.name || "",
        quantity: "1",
        baseUnit: defaultMat?.baseUnit || "pcs",
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
      inputUnit: mat.baseUnit,
      packageSize: 0,
    }
    setItems(updated)
  }

  function handleItemChange(index: number, field: "quantity" | "totalPrice", value: string) {
    const updated = [...items]
    updated[index] = {
      ...updated[index],
      [field]: value,
    }
    setItems(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || uploadingAttachment || !editable) return

    let payloadItems: CreatePOItemInput[]
    try {
      payloadItems = buildPurchaseOrderItems(items, category)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Periksa detail barang dan harga pembelian")
      return
    }

    setSubmitting(true)
    setFormError("")

    try {
      if (isEditMode && poId) {
        await purchaseOrderService.updatePurchaseOrder(poId, {
          category,
          supplier_id: supplierId || undefined,
          notes,
          attachments,
          items: payloadItems,
        })
      } else {
        await purchaseOrderService.createPurchaseOrder({
          category,
          supplier_id: supplierId || undefined,
          notes,
          attachments,
          order_date: new Date(orderDate).toISOString(),
          items: payloadItems,
        })
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
      ])
      if (isDirectOrder) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: stockKeys.all }),
          queryClient.invalidateQueries({ queryKey: supplierKeys.all }),
        ])
      }
      navigate("/inventory/purchase-orders")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan pembelian"
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
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-500 w-full">
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
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {isEditMode ? "Edit Purchase Request" : isDirectOrder ? "Buat Direct Order" : "Buat Purchase Order"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditMode
              ? "Perbarui informasi atau kuantitas bahan baku pada pengajuan Anda."
              : isDirectOrder ? "Catat barang yang sudah diterima beserta harga faktur. Stok langsung bertambah saat disimpan." : "Pengajuan pengadaan bahan baku yang akan ditinjau dan diproses oleh Tim Finance."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          <Badge variant="outline" className="px-3 py-1 font-mono text-sm bg-muted/50 border-primary/30 text-primary flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5" />
            {poNumber}
          </Badge>
          <Badge variant="outline" className="border-blue-500/40 text-blue-600 bg-blue-500/10">
            {isDirectOrder ? "Direct Order" : "Purchase Request"}
          </Badge>
        </div>
      </div>

      {formError && (
        <div role="alert" className="p-3.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <fieldset disabled={submitting || !editable} className="min-w-0 space-y-5">
        <Card className="rounded-xl border-primary/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kategori Pembelian</CardTitle>
            <CardDescription>Pilih alur sesuai kondisi barang yang dibeli.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["PURCHASE_ORDER", "DIRECT_ORDER"] as const).map((value) => (
                <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${category === value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'} ${isEditMode ? 'cursor-default' : ''}`}>
                  <input type="radio" name="purchase-category" value={value} checked={category === value} onChange={() => { setCategory(value); setFormError("") }} disabled={isEditMode} className="mt-1 accent-primary" />
                  <span className="min-w-0 space-y-1"><span className="block text-sm font-semibold">{PURCHASE_ORDER_CATEGORY_LABELS[value]}</span><span className="block text-xs leading-relaxed text-muted-foreground">{value === "DIRECT_ORDER" ? "Barang sudah diterima. Isi kuantitas dan harga untuk langsung mencatat pembelian serta stok." : "Ajukan kebutuhan barang, tunggu persetujuan, lalu catat harga saat barang diterima."}</span></span>
                </label>
              ))}
            </div>
            {isEditMode && <p className="mt-3 text-xs text-muted-foreground">Kategori ditetapkan saat pesanan dibuat.</p>}
          </CardContent>
        </Card>

        {/* Card 1: Informasi Vendor & Pengiriman */}
        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Informasi Rekanan & Tanggal Pemesanan
            </CardTitle>
            <CardDescription>
              {isDirectOrder ? "Pilih supplier pembelian jika tersedia." : "Vendor dapat ditentukan sekarang atau dikosongkan agar dipilih oleh Tim Finance."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {/* Vendor Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Vendor / Supplier (Opsional)
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between rounded-xl h-10"
                  >
                    <span className="truncate">
                      {selectedSupplier ? selectedSupplier.name : isDirectOrder ? "Pilih supplier (opsional)" : "-- Belum Ditentukan (Tim Finance) --"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto" align="start">
                  <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                    Daftar Supplier
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setSupplierId("")}
                    className="cursor-pointer italic text-muted-foreground"
                  >
                    {isDirectOrder ? "Tanpa supplier" : "-- Belum Ditentukan (Tim Finance) --"}
                  </DropdownMenuItem>
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
                disabled={isEditMode}
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
                  {isDirectOrder ? "Isi barang yang diterima, kuantitas, dan total harga faktur setiap barang." : "Pilih bahan baku dan kuantitas yang dibutuhkan dari vendor."}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                disabled={loadingMaterials || materials.length === 0}
                className="rounded-xl self-start sm:self-auto"
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
                className={`grid min-w-0 items-start gap-4 rounded-xl border border-border/80 bg-muted/10 p-4 sm:grid-cols-2 ${isDirectOrder ? "2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_7rem_10rem_2rem]" : "xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_8rem_2rem]"}`}
              >
                {/* Material Selector */}
                <div className="min-w-0">
                  <Label htmlFor={`po-material-${idx}`} className="mb-2 block text-sm font-medium">Bahan Baku #{idx + 1}</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        id={`po-material-${idx}`}
                        className="w-full justify-between rounded-lg h-11 text-left font-normal min-w-0"
                      >
                        <span className="truncate">{item.stockName || "Pilih Bahan"}</span>
                        <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-[200px] max-h-56 overflow-y-auto" align="start">
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

                <PurchaseUnitFields
                  idPrefix={`po-item-${idx}`}
                  className="min-w-0"
                  quantityHint={isDirectOrder ? "Stok langsung bertambah saat Direct Order disimpan." : "Jumlah ini akan masuk ke stok setelah PO diselesaikan."}
                  baseUnit={item.baseUnit}
                  unit={item.inputUnit || item.baseUnit}
                  quantity={Number(item.quantity) || 0}
                  packageSize={item.packageSize || 0}
                  onUnitChange={(unit) => setItems(items.map((it, i) => i === idx ? { ...it, inputUnit: unit, packageSize: 0 } : it))}
                  onPackageSizeChange={(size) => setItems(items.map((it, i) => i === idx ? { ...it, packageSize: size } : it))}
                />
                {/* Quantity */}
                <div className="min-w-0">
                  <Label htmlFor={`po-quantity-${idx}`} className="mb-2 block text-sm font-medium">
                    Kuantitas ({item.inputUnit || item.baseUnit || "-"})
                  </Label>
                  <Input
                    id={`po-quantity-${idx}`}
                    type="number"
                    step="any"
                    min="0.0001"
                    placeholder="0"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                    className="rounded-lg h-11 font-mono text-sm"
                    required
                  />
                </div>

                {isDirectOrder && <div className="min-w-0">
                  <Label htmlFor={`po-price-${idx}`} className="mb-2 block text-sm font-medium">Total Faktur (Rp) <span className="text-destructive">*</span></Label>
                  <Input id={`po-price-${idx}`} type="number" min="0.0001" step="any" value={item.totalPrice || ""} onChange={(event) => handleItemChange(idx, "totalPrice", event.target.value)} placeholder="Contoh: 150000" required className="h-11 rounded-lg font-mono text-sm" />
                  <p className="mt-2 text-xs text-muted-foreground">Total biaya untuk seluruh kuantitas barang ini.</p>
                </div>}

                {/* Remove button */}
                <div className={`flex justify-end sm:col-span-2 ${isDirectOrder ? "2xl:col-span-1 2xl:pt-7" : "xl:col-span-1 xl:pt-7"}`}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Hapus bahan ${idx + 1}`}
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="mt-4 flex flex-wrap items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
              <Package className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">{items.length} item bahan {isDirectOrder ? "dalam pembelian" : "dalam pengajuan"}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{isDirectOrder ? "Pastikan barang sudah diterima. Pembelian dan stok langsung dicatat saat disimpan." : "Harga faktur dicatat saat barang tiba dan pesanan diselesaikan. Anda cukup mengisi bahan, satuan, dan kuantitas sekarang."}</p>
              </div>
              {isDirectOrder && <div className="ml-auto shrink-0 text-right"><p className="text-xs text-muted-foreground">Total pembelian</p><p className="text-lg font-bold text-primary"><CurrencyText value={items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0)} /></p></div>}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base"><Paperclip className="size-4 text-primary" />Dokumen Lampiran <span className="text-xs font-normal text-muted-foreground">Opsional</span></CardTitle>
            <CardDescription>{isDirectOrder ? "Lampirkan nota, faktur, atau dokumen pendukung pembelian." : "Lampirkan penawaran supplier atau dokumen pendukung pengajuan."}</CardDescription>
          </CardHeader>
          <CardContent>
            <POAttachmentUpload value={attachments} onChange={setAttachments} onUploadingChange={setUploadingAttachment} disabled={submitting || !editable} />
          </CardContent>
        </Card>

        {/* Process Explanation Alert */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200 text-xs leading-relaxed flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            {isDirectOrder ? <><strong>Direct Order:</strong> Pembelian langsung selesai saat disimpan. Pastikan detail barang, kuantitas, dan harga faktur benar karena stok akan langsung bertambah.</> : <><strong>Alur Purchase Request:</strong> Pengajuan ini berstatus <strong>Purchase Request</strong>. Tim Finance akan meninjau pengajuan ini, memilih atau menegosiasikan vendor rekanan, lalu menerbitkan <strong>Purchase Order</strong>. Realisasi harga final akan dicatat saat barang tiba untuk dimasukkan ke stok dan HPP.</>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/inventory/purchase-orders")}
            className="rounded-xl flex-1 sm:flex-initial"
            disabled={submitting}
          >
            Batal
          </Button>
          <Button type="submit" className="rounded-xl shadow-sm px-6 flex-1 sm:flex-initial" disabled={submitting || uploadingAttachment || !editable}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Simpan Perubahan Request" : isDirectOrder ? "Simpan & Masukkan ke Stok" : "Kirim Purchase Request"}
          </Button>
        </div>
        </fieldset>
      </form>
    </div>
  )
}

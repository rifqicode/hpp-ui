import * as React from "react"
import { useInitialLoading } from "@/hooks/use-initial-loading"
import { useParams, Link, useNavigate } from "react-router-dom"
import { RecordPurchaseDialog } from "@/features/inventory/components/record-purchase-dialog"
import {
  ArrowLeft,
  Building2,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Plus,
  Pencil,
  FileText,
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
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { useSupplierDetail } from "@/features/suppliers/hooks"

export default function SupplierDetailPage() {
  const { supplierId } = useParams<{ supplierId: string }>()
  const navigate = useNavigate()

  const {
    supplier,
    purchases,
    loading,
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
  } = useSupplierDetail(supplierId)

  const [isPurchaseOpen, setIsPurchaseOpen] = React.useState(false)

  const isInitialLoading = useInitialLoading(loading)
  if (isInitialLoading) {
    // Global LoadingOverlay renders the spinner on top of this placeholder
    return <div className="min-h-[60vh]" />
  }

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Supplier tidak ditemukan</h2>
        <Button variant="outline" onClick={() => navigate("/inventory/suppliers")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Supplier
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-500">
      {/* Navigation & Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link to="/inventory/suppliers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-xl uppercase shadow-sm shrink-0">
              {supplier.name.substring(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{supplier.name}</h1>
                <Badge variant="success" className="text-xs">Partner Aktif</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Terdaftar sejak: {formatDate(supplier.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setIsEditOpen(true)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Data
            </Button>
            <Button
              className="rounded-xl shadow-sm"
              onClick={() => setIsPurchaseOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Catat Pembelian Baru
            </Button>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Contact Info Card */}
        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Phone className="h-4 w-4 text-primary" />
              Kontak & Narahubung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block mb-0.5">Nomor Telepon / WA:</span>
              {supplier.contact ? (
                <span className="font-medium text-foreground">{supplier.contact}</span>
              ) : (
                <span className="text-muted-foreground italic">Belum diisi</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Address Card */}
        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              Alamat Gudang / Kantor
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <span className="text-xs text-muted-foreground block mb-0.5">Lokasi Pengiriman:</span>
            <p className="font-medium text-foreground leading-relaxed">
              {supplier.address || <span className="text-muted-foreground italic">Alamat belum diatur</span>}
            </p>
          </CardContent>
        </Card>

        {/* Quick Metrics Card */}
        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <DollarSign className="h-4 w-4 text-primary" />
              Ringkasan Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Belanja:</span>
              <span className="font-bold text-foreground font-mono">{formatRupiah(totalSpent)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frekuensi Transaksi:</span>
              <span className="font-medium text-foreground">{purchases.length || supplier.totalOrdersCount || 0} kali</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rata-rata Order:</span>
              <span className="font-medium text-foreground font-mono">{formatRupiah(averageOrder)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Details */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="rounded-xl bg-muted/60 p-1 border border-border">
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-card">
            <FileText className="mr-2 h-4 w-4" />
            Riwayat Pembelian ({purchases.length})
          </TabsTrigger>
          <TabsTrigger value="materials" className="rounded-lg data-[state=active]:bg-card">
            <Package className="mr-2 h-4 w-4" />
            Bahan Baku Pasokan ({supplier.suppliedMaterials?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Purchase History */}
        <TabsContent value="history" className="mt-4">
          <Card className="rounded-xl shadow-sm border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Daftar Transaksi Pembelian</CardTitle>
              <CardDescription>
                Buku riwayat semua stok bahan baku yang dibeli dari supplier ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>No. Bukti</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Nama Bahan</TableHead>
                      <TableHead className="text-right">Kuantitas</TableHead>
                      <TableHead className="text-right">Harga Satuan</TableHead>
                      <TableHead className="text-right">Total Biaya</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          Belum ada riwayat transaksi pembelian dari vendor ini.
                        </TableCell>
                      </TableRow>
                    ) : (
                      purchases.map((rec) => (
                        <TableRow key={rec.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs font-semibold text-primary">
                            {rec.id}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(rec.purchaseDate)}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {rec.stockName}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {rec.quantity} {rec.baseUnit}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-muted-foreground">
                            {formatRupiah(rec.pricePerUnit)}/{rec.baseUnit}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-foreground">
                            {formatRupiah(rec.totalPrice)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Supplied Materials */}
        <TabsContent value="materials" className="mt-4">
          <Card className="rounded-xl shadow-sm border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Katalog Bahan Baku Terkait</CardTitle>
              <CardDescription>
                Bahan baku yang rutin dipasok oleh vendor ini untuk kebutuhan resep produksi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(!supplier.suppliedMaterials || supplier.suppliedMaterials.length === 0) ? (
                <div className="py-8 text-center text-muted-foreground">
                  Belum ada data katalog bahan baku untuk supplier ini.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {supplier.suppliedMaterials.map((materialName, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/20 transition-all"
                    >
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-sm">{materialName}</div>
                        <div className="text-xs text-muted-foreground">Bahan Baku Aktif</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Edit Supplier */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle>Edit Informasi Supplier</DialogTitle>
            <DialogDescription>
              Perbarui detail kontak dan alamat vendor ini.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-sm font-semibold">
                Nama Perusahaan / Supplier <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-contact" className="text-sm font-semibold">
                Kontak (Telepon / WA / Email)
              </Label>
              <Input
                id="edit-contact"
                value={editData.contact}
                onChange={(e) => setEditData({ ...editData, contact: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-address" className="text-sm font-semibold">
                Alamat Fisik / Gudang
              </Label>
              <Textarea
                id="edit-address"
                value={editData.address}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                className="rounded-xl min-h-[90px]"
              />
            </div>

            <DialogFooter className="pt-2 sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl"
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" className="rounded-xl" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Record Purchase */}
      <RecordPurchaseDialog
        open={isPurchaseOpen}
        onOpenChange={setIsPurchaseOpen}
        initialSupplierId={supplier.id}
        onSuccess={loadData}
      />
    </div>
  )
}

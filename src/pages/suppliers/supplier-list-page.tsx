import { Link } from "react-router-dom"
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Building2,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  DollarSign,
  Package,
  RefreshCcw,
  Loader2,
  ArrowUpDown,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePagination } from "@/components/ui/table-pagination"

import { useSuppliers } from "@/features/suppliers/hooks"

export default function SupplierListPage() {
  const {
    loading,
    search,
    setSearch,
    setSortBy,
    filteredSuppliers,
    page,
    totalPages,
    total,
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
  } = useSuppliers()

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Supplier Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola data vendor, kontak supplier bahan baku, dan riwayat pesanan toko Anda.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOpenCreate} className="rounded-xl shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Supplier
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Supplier
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalVendors} Vendor</div>
            <p className="text-xs text-muted-foreground mt-1">
              Terdaftar di toko aktif
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendor Aktif Bertransaksi
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeVendorsCount} Vendor</div>
            <p className="text-xs text-muted-foreground mt-1">
              Memiliki riwayat pengadaan bahan
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-border sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Nilai Pembelian
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatRupiah(totalPurchasesSum)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Akumulasi pembelian bahan baku
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-xl shadow-sm border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Daftar Supplier</CardTitle>
              <CardDescription>
                Daftar kontak supplier terpercaya untuk pengadaan bahan baku produksi.
              </CardDescription>
            </div>
            <div className="text-xs text-muted-foreground">
              {total} supplier ditemukan
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama vendor, kontak, atau alamat..."
                className="pl-9 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl">
                    <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                    Urutkan
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground/70">
                    Urutan
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setSortBy("name-asc")}
                    className="cursor-pointer"
                  >
                    Nama (A - Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy("name-desc")}
                    className="cursor-pointer"
                  >
                    Nama (Z - A)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy("spent-desc")}
                    className="cursor-pointer"
                  >
                    Total Pembelian Terbanyak
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy("orders-desc")}
                    className="cursor-pointer"
                  >
                    Frekuensi Order Tertinggi
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setSearch("")
                  setSortBy("name-asc")
                  loadSuppliers()
                }}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Suppliers Table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-foreground">Nama Supplier</TableHead>
                  <TableHead className="font-semibold text-foreground">Kontak</TableHead>
                  <TableHead className="font-semibold text-foreground">Alamat</TableHead>
                  <TableHead className="font-semibold text-foreground">Bahan Pasokan</TableHead>
                  <TableHead className="font-semibold text-foreground text-right">Total Transaksi</TableHead>
                  <TableHead className="w-[80px] text-center"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>Memuat data supplier...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                        <Building2 className="h-8 w-8 text-muted-foreground/50 mb-1" />
                        <span className="font-medium text-foreground">Belum ada data supplier</span>
                        <span className="text-xs">
                          {search ? "Tidak ada supplier yang cocok dengan kata kunci pencarian." : "Mulai dengan menambahkan supplier pertama Anda."}
                        </span>
                        {!search && (
                          <Button size="sm" onClick={handleOpenCreate} className="mt-2 rounded-lg">
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Supplier
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs uppercase shrink-0">
                            {supplier.name.substring(0, 2)}
                          </div>
                          <div>
                            <Link
                              to={`/inventory/suppliers/${supplier.id}`}
                              className="font-semibold text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline block"
                            >
                              {supplier.name}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                              {supplier.totalOrdersCount || 0}x pesanan tercatat
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          {supplier.contact ? (
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                              <span className="text-foreground">{supplier.contact}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/60 italic">Tidak ada kontak</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="max-w-xs">
                        {supplier.address ? (
                          <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0 mt-0.5" />
                            <span className="truncate" title={supplier.address}>
                              {supplier.address}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic">Tidak ada alamat</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {supplier.suppliedMaterials && supplier.suppliedMaterials.length > 0 ? (
                            supplier.suppliedMaterials.map((mat) => (
                              <Badge key={mat} variant="secondary" className="text-[11px] font-normal py-0">
                                {mat}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground/60 italic">-</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-mono font-medium">
                        <div>{formatRupiah(supplier.totalPurchases || 0)}</div>
                      </TableCell>

                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link to={`/inventory/suppliers/${supplier.id}`} className="flex items-center">
                                <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                                Lihat Detail
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleOpenEdit(supplier)}
                              onClick={() => handleOpenEdit(supplier)}
                              className="cursor-pointer"
                            >
                              <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                              Edit Informasi
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link to={`/inventory/purchase/new?supplierId=${supplier.id}`} className="flex items-center">
                                <Plus className="mr-2 h-4 w-4 text-emerald-600" />
                                Catat Pembelian
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => handleOpenDelete(supplier)}
                              onClick={() => handleOpenDelete(supplier)}
                              className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus Supplier
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <TablePagination
            total={total}
            displayedCount={filteredSuppliers.length}
            page={page}
            totalPages={totalPages}
            onPrev={handlePrevPage}
            onNext={handleNextPage}
            disabled={loading}
            label="supplier"
          />
        </CardContent>
      </Card>

      {/* Modal Add / Edit Supplier */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Edit Informasi Supplier" : "Tambah Supplier Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? "Perbarui detail kontak dan alamat vendor ini."
                : "Masukkan data supplier baru untuk mempermudah pencatatan pembelian stok."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitForm} className="space-y-4 py-2">
            {formError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="supplier-name" className="text-sm font-semibold">
                Nama Supplier / Perusahaan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="supplier-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: PT Sumber Pangan Makmur"
                className="rounded-xl"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="supplier-contact" className="text-sm font-semibold">
                Kontak (Telepon / WhatsApp / Email)
              </Label>
              <Input
                id="supplier-contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="Contoh: 0812-3456-7890 / sales@sumberpangan.com"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="supplier-address" className="text-sm font-semibold">
                Alamat Fisik / Gudang
              </Label>
              <Textarea
                id="supplier-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Contoh: Jl. Industri Raya No. 12, Pergudangan Cikarang"
                className="rounded-xl min-h-[90px]"
              />
            </div>

            <DialogFooter className="pt-2 sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="rounded-xl"
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" className="rounded-xl" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSupplier ? "Simpan Perubahan" : "Simpan Supplier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Confirm Delete */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">Hapus Supplier?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus supplier{" "}
              <strong className="text-foreground">{deletingSupplier?.name}</strong>? Data riwayat
              pembelian yang sudah ada akan tetap tersimpan untuk keperluan audit.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2 sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="rounded-xl"
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              className="rounded-xl"
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

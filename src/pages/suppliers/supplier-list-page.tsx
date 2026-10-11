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
  RefreshCw,
  Loader2,
  ArrowUpDown,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Supplier & Vendor
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Kelola data vendor, kontak supplier bahan baku, dan riwayat pesanan toko Anda
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSuppliers}
            disabled={loading}
            className="flex items-center gap-1.5 shadow-2xs hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            Tambah Supplier
          </Button>
        </div>
      </div>

      {/* KPI / Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Card 1: Total Supplier */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Total Supplier</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {totalVendors}
                </span>
                <span className="text-xs text-muted-foreground">vendor terdaftar</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Vendor Aktif Bertransaksi */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Vendor Aktif</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {activeVendorsCount}
                </span>
                <span className="text-xs text-muted-foreground">ada riwayat PO</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Nilai Pembelian */}
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card sm:col-span-2 lg:col-span-1">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Total Nilai Pembelian</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
                  {formatRupiah(totalPurchasesSum)}
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 border rounded-2xl bg-card shadow-2xs">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Memuat data supplier...</p>
        </div>
      ) : totalVendors === 0 && !search ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center rounded-2xl border-2 border-dashed border-border bg-card/60 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
            <Users className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Belum Ada Data Supplier</h2>
          <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
            Mulai daftarkan kontak vendor atau supplier bahan baku untuk mempermudah pencatatan Purchase Order dan alur stok.
          </p>
          <Button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Tambah Supplier Baru
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Standalone Filter & Search Bar */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-card p-3 rounded-xl border border-border shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama vendor, kontak, atau alamat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50 h-9 text-xs"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs rounded-lg shadow-2xs">
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
                size="sm"
                className="h-8 px-2.5 text-xs rounded-lg shadow-2xs"
                onClick={() => {
                  setSearch("")
                  setSortBy("name-asc")
                  loadSuppliers()
                }}
                title="Reset Filter"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Polished Table Container */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                  <tr>
                    <th className="px-5 py-3.5">Nama Supplier</th>
                    <th className="px-5 py-3.5">Kontak</th>
                    <th className="px-5 py-3.5">Alamat Gudang</th>
                    <th className="px-5 py-3.5">Bahan Pasokan</th>
                    <th className="px-5 py-3.5 text-right">Total Transaksi</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                        <p className="font-medium text-foreground">Tidak ada supplier yang cocok</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {search ? "Coba sesuaikan kata kunci pencarian Anda." : "Belum ada data supplier."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <tr
                        key={supplier.id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        <td className="px-5 py-3.5 font-medium text-foreground">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs uppercase shrink-0">
                              {supplier.name.substring(0, 2)}
                            </div>
                            <div className="flex flex-col">
                              <Link
                                to={`/inventory/suppliers/${supplier.id}`}
                                className="font-semibold text-foreground group-hover:text-primary transition-colors underline-offset-4 hover:underline"
                              >
                                {supplier.name}
                              </Link>
                              <span className="text-[11px] text-muted-foreground font-normal">
                                {supplier.totalOrdersCount || 0}x pesanan tercatat
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-xs">
                          {supplier.contact ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                              <span className="text-foreground font-mono">{supplier.contact}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60 italic">Tidak ada kontak</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-xs text-muted-foreground max-w-xs">
                          {supplier.address ? (
                            <div className="flex items-start gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0 mt-0.5" />
                              <span className="truncate" title={supplier.address}>
                                {supplier.address}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60 italic">Tidak ada alamat</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {supplier.suppliedMaterials && supplier.suppliedMaterials.length > 0 ? (
                              supplier.suppliedMaterials.map((mat) => (
                                <Badge key={mat} variant="secondary" className="text-[10px] font-normal py-0">
                                  {mat}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground/60 italic">-</span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-right font-mono text-xs font-semibold text-foreground">
                          {formatRupiah(supplier.totalPurchases || 0)}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs">
                              <DropdownMenuItem asChild className="cursor-pointer">
                                <Link to={`/inventory/suppliers/${supplier.id}`} className="flex items-center">
                                  <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                  Lihat Detail
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleOpenEdit(supplier)}
                                onClick={() => handleOpenEdit(supplier)}
                                className="cursor-pointer"
                              >
                                <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                Edit Informasi
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="cursor-pointer">
                                <Link to={`/inventory/purchase/new?supplierId=${supplier.id}`} className="flex items-center">
                                  <Plus className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                                  Catat Pembelian
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => handleOpenDelete(supplier)}
                                onClick={() => handleOpenDelete(supplier)}
                                className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Hapus Supplier
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Pagination */}
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
        </div>
      )}

      {/* Modal Add / Edit Supplier */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
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
                className="h-9"
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
                className="h-9"
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
                className="min-h-[90px]"
              />
            </div>

            <DialogFooter className="pt-2 sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
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
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Hapus Supplier?
            </DialogTitle>
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
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
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

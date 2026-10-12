import * as React from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  DollarSign,
  Calendar,
  Edit2,
  Trash2,
  Receipt,
  X,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

import { useQueryClient } from '@tanstack/react-query';
import { customerService } from '../../features/sales/services/customer-service';
import {
  useCustomersQuery,
  useCustomerSummaryQuery,
  salesKeys,
} from '../../features/sales/hooks/use-sales-query';
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerDetail,
} from '../../features/sales/types';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { TablePagination } from '../../components/ui/table-pagination';

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

export default function CustomerListPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const perPage = 10;

  const {
    data: customersData,
    isLoading: loading,
    refetch: refetchCustomers,
  } = useCustomersQuery({
    search: searchQuery.trim() || undefined,
    page,
    per_page: perPage,
  });

  const {
    data: summaryData,
    refetch: refetchSummary,
  } = useCustomerSummaryQuery();

  const customers = customersData?.data || [];
  const total = summaryData?.total_customers ?? customersData?.total ?? 0;

  // Dialog States
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  // Form States
  const [addForm, setAddForm] = React.useState<CreateCustomerInput>({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [customerDetail, setCustomerDetail] = React.useState<CustomerDetail | null>(null);
  const [editForm, setEditForm] = React.useState<UpdateCustomerInput>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleOpenDetail = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailOpen(true);
    try {
      const detail = await customerService.getCustomerById(customer.id);
      setCustomerDetail(detail);
    } catch (err) {
      console.error('Failed to load customer detail', err);
    }
  };

  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteOpen(true);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.phone.trim()) {
      alert('Nama dan Nomor HP wajib diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      await customerService.createCustomer(addForm);
      setIsAddOpen(false);
      setAddForm({ name: '', phone: '', email: '', address: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: salesKeys.customers.all });
    } catch (err: any) {
      console.error('Failed to create customer', err);
      alert(err.response?.data?.message || 'Gagal menambahkan pelanggan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      setIsSubmitting(true);
      await customerService.updateCustomer(selectedCustomer.id, editForm);
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: salesKeys.customers.all });
    } catch (err: any) {
      console.error('Failed to update customer', err);
      alert(err.response?.data?.message || 'Gagal mengubah pelanggan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      setIsSubmitting(true);
      await customerService.deleteCustomer(selectedCustomer.id);
      setIsDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: salesKeys.customers.all });
    } catch (err: any) {
      console.error('Failed to delete customer', err);
      alert(err.response?.data?.message || 'Gagal menghapus pelanggan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refetchCustomers(), refetchSummary()]);
  };

  // Metrics summary calculated from loaded list or defaults
  const totalSpentAll = React.useMemo(() => {
    if (summaryData) return Number(summaryData.total_spent_amount) || 0;
    return customers.reduce((acc, curr) => acc + (curr.total_spent || 0), 0);
  }, [customers, summaryData]);

  const avgSpentPerCustomer = React.useMemo(() => {
    if (summaryData) {
      const spent = Number(summaryData.total_spent_amount) || 0;
      return summaryData.total_customers > 0 ? spent / summaryData.total_customers : 0;
    }
    return customers.length > 0 ? totalSpentAll / customers.length : 0;
  }, [customers, summaryData, totalSpentAll]);

  const totalPages = Math.ceil(total / perPage) || 1;

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Manajemen Pelanggan
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Daftar data kontak pelanggan, riwayat loyalitas pesanan, dan akumulasi nilai belanja
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 shadow-2xs hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </Button>
          <Button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            Tambah Pelanggan
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Total Pelanggan Terdaftar</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-foreground">{total}</span>
                <span className="text-xs text-muted-foreground">member</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Akumulasi Belanja (LTV)</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(totalSpentAll)}
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Rata-rata Belanja per Member</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {formatRupiah(avgSpentPerCustomer)}
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Standalone Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-3 rounded-xl border border-border shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, nomor HP, atau email pelanggan..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-background/50 h-9 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Customer List Table & Pagination */}
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                <tr>
                  <th className="px-5 py-3.5">Nama & Kontak</th>
                  <th className="px-5 py-3.5">Nomor Telepon</th>
                  <th className="px-5 py-3.5">Alamat</th>
                  <th className="px-5 py-3.5 text-center">Total Pesanan</th>
                  <th className="px-5 py-3.5 text-right">Total Belanja</th>
                  <th className="px-5 py-3.5">Terakhir Belanja</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                      Memuat data pelanggan...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                      Belum ada data pelanggan yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(c)}
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors block">
                          {c.name}
                        </span>
                        {c.email && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" />
                            {c.email}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs flex items-center gap-1.5 text-foreground">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {c.phone}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-muted-foreground max-w-44 truncate">
                        {c.address ? (
                          <span className="flex items-center gap-1 truncate text-xs">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{c.address}</span>
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <Badge variant="outline" className="text-xs font-semibold">
                          {c.total_orders || 0}x
                        </Badge>
                      </td>

                      <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(c.total_spent || 0)}
                      </td>

                      <td className="px-5 py-3.5 text-muted-foreground">
                        {c.last_order_at ? (
                          <span className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3" />
                            {new Date(c.last_order_at).toLocaleDateString('id-ID', {
                              dateStyle: 'medium',
                            })}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/70">
                            Belum ada transaksi
                          </span>
                        )}
                      </td>

                      <td
                        className="px-5 py-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetail(c)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Lihat Detail & Riwayat"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(c)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Edit Pelanggan"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDelete(c)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            title="Hapus Pelanggan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <TablePagination
          total={total}
          displayedCount={customers.length}
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={loading}
          label="pelanggan"
        />
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="size-5 text-primary" />
              <span>Tambah Pelanggan Baru</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateCustomer} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Nama Pelanggan <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Contoh: Budi Santoso"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Nomor WhatsApp / HP <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Contoh: 081234567890"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Email (opsional)
              </label>
              <Input
                type="email"
                placeholder="Contoh: budi@gmail.com"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Alamat (opsional)
              </label>
              <Input
                placeholder="Contoh: Jl. Melati No. 12, Jakarta"
                value={addForm.address}
                onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Catatan (opsional)
              </label>
              <Input
                placeholder="Contoh: Pelanggan langganan roti tawar"
                value={addForm.notes}
                onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Pelanggan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Edit2 className="size-5 text-primary" />
              <span>Edit Data Pelanggan</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateCustomer} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Nama Pelanggan
              </label>
              <Input
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Nomor WhatsApp / HP
              </label>
              <Input
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Email</label>
              <Input
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Alamat</label>
              <Input
                value={editForm.address || ''}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Catatan</label>
              <Input
                value={editForm.notes || ''}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Perbarui'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Detail & Purchase History Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          {selectedCustomer && (
            <div className="space-y-4">
              <DialogHeader className="border-b border-border pb-3">
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <UserCheck className="size-5 text-primary" />
                  <span>Profil & Riwayat Belanja Pelanggan</span>
                </DialogTitle>
              </DialogHeader>

              {/* Profile Card */}
              <div className="bg-card border border-border rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-sm font-bold text-foreground">
                    {selectedCustomer.name}
                  </h3>
                  <Badge variant="outline" className="font-semibold text-emerald-600 bg-emerald-50">
                    {selectedCustomer.total_orders}x Pesanan
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1">
                  <div>
                    <span className="block text-[10px]">No. WhatsApp:</span>
                    <span className="font-mono text-foreground font-medium">
                      {selectedCustomer.phone}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px]">Total Belanja (LTV):</span>
                    <span className="text-emerald-600 font-bold">
                      {formatRupiah(selectedCustomer.total_spent)}
                    </span>
                  </div>
                  {selectedCustomer.email && (
                    <div className="col-span-2">
                      <span className="block text-[10px]">Email:</span>
                      <span className="text-foreground">{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="col-span-2">
                      <span className="block text-[10px]">Alamat:</span>
                      <span className="text-foreground">{selectedCustomer.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Purchase History */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Riwayat Transaksi Terakhir
                </h4>

                {customerDetail && customerDetail.sales?.length > 0 ? (
                  <div className="border border-border rounded-xl divide-y divide-border overflow-hidden text-xs">
                    {customerDetail.sales.map((sale) => (
                      <div key={sale.id} className="p-3 flex justify-between items-center bg-card hover:bg-muted/30">
                        <div>
                          <span className="font-bold text-foreground block">
                            {sale.invoiceNumber}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(sale.transactionDate).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}{' '}
                            • {sale.paymentMethod}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-foreground block">
                            {formatRupiah(sale.totalAmount)}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-medium">
                            Laba: {formatRupiah(sale.grossProfit)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted-foreground text-xs border border-dashed border-border rounded-xl">
                    Belum ada riwayat pesanan tercatat.
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="size-5" />
              <span>Hapus Pelanggan</span>
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground">
            Apakah Anda yakin ingin menghapus pelanggan{' '}
            <strong className="text-foreground">{selectedCustomer?.name}</strong>? Data
            transaksi terdahulu akan tetap tersimpan.
          </p>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteCustomer}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

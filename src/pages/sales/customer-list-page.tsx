import { formatInternationalPhone as formatPhoneInput } from '@/features/auth/lib/phone';
import { PhoneInput } from '@/components/ui/phone-input';
import * as React from 'react';
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  Receipt,
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
import { QuotaBadge } from '@/features/subscription';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { ListFilters } from '@/components/ui/list-filters';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { TablePagination } from '../../components/ui/table-pagination';
import { CurrencyText } from '@/components/ui/currency-text';

function customerErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: unknown } } } | null)?.response?.data?.message;
  return typeof message === 'string' && message ? message : fallback;
}

export default function CustomerListPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const perPage = 10;

  const {
    data: customersData,
    isLoading: loading,
    isFetching,
    isError: isCustomersError,
    refetch: refetchCustomers,
  } = useCustomersQuery({
    search: searchQuery.trim() || undefined,
    page,
    per_page: perPage,
  });

  const {
    data: summaryData,
    isFetching: isSummaryFetching,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useCustomerSummaryQuery();

  const customers = customersData?.data || [];
  const total = customersData?.total ?? 0;

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
      phone: formatPhoneInput(customer.phone),
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
      queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
    } catch (err: unknown) {
      console.error('Failed to create customer', err);
      alert(customerErrorMessage(err, 'Gagal menambahkan pelanggan'));
    } finally {
      setIsSubmitting(false);
      handleRefresh();
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
    } catch (err: unknown) {
      console.error('Failed to update customer', err);
      alert(customerErrorMessage(err, 'Gagal mengubah pelanggan'));
    } finally {
      setIsSubmitting(false);
      handleRefresh();
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      setIsSubmitting(true);
      await customerService.deleteCustomer(selectedCustomer.id);
      setIsDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: salesKeys.customers.all });
      queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
    } catch (err: unknown) {
      console.error('Failed to delete customer', err);
      alert(customerErrorMessage(err, 'Gagal menghapus pelanggan'));
    } finally {
      setIsSubmitting(false);
      handleRefresh();
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refetchCustomers(), refetchSummary()]);
  };

  const totalPages = customersData?.total_pages ?? (Math.ceil(total / perPage) || 1);

  return (
    <div className="w-full min-w-0 space-y-5 pb-8">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Manajemen Pelanggan</h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Cari kontak pelanggan, perbarui data, dan lihat riwayat pesanan.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isFetching || isSummaryFetching} className="h-10 gap-2 text-xs">
            <RefreshCw className={`size-3.5 ${isFetching || isSummaryFetching ? 'animate-spin motion-reduce:animate-none' : ''}`} />Refresh
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="h-10 gap-2 text-xs"><Plus className="size-4" />Tambah Pelanggan</Button>
          <QuotaBadge resource="customers" label="Kuota" className="ml-auto sm:ml-0" />
        </div>
      </header>

      {isSummaryError && <p role="alert" className="rounded-xl border p-3 text-xs text-muted-foreground">Ringkasan pelanggan belum bisa dimuat. Klik Refresh untuk mencoba lagi.</p>}
      {summaryData && !isSummaryError && (
        <section aria-label="Ringkasan pelanggan" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              label: 'Total Pelanggan', value: summaryData.total_customers,
              hint: 'Seluruh pelanggan terdaftar', icon: Users,
              color: 'text-primary', background: 'bg-primary/10',
            },
            {
              label: 'Pernah Bertransaksi', value: summaryData.active_customers,
              hint: 'Pelanggan dengan minimal satu pesanan', icon: UserCheck,
              color: 'text-emerald-600 dark:text-emerald-400', background: 'bg-emerald-50 dark:bg-emerald-950/40',
            },
          ].map((metric) => (
            <Card key={metric.label} className="min-w-0 border-border/80 bg-card px-4 py-3 shadow-2xs">
              <CardContent className="flex items-center justify-between gap-2 p-0">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                  <p className={`text-xl font-bold tracking-tight tabular-nums ${metric.color}`}>{metric.value.toLocaleString('id-ID')}</p>
                  <p className="text-[11px] text-muted-foreground">{metric.hint}</p>
                </div>
                <span className={`shrink-0 rounded-xl p-2.5 ${metric.background} ${metric.color}`}><metric.icon className="size-5" aria-hidden="true" /></span>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <ListFilters
        label="Filter pelanggan"
        search={{
          label: 'Cari pelanggan', placeholder: 'Cari nama, nomor HP, atau email pelanggan...',
          value: searchQuery, onChange: (value) => { setSearchQuery(value); setPage(1); },
        }}
        hasFilters={Boolean(searchQuery.trim())}
        onReset={() => { setSearchQuery(''); setPage(1); }}
        isFetching={isFetching && !loading}
        fetchingLabel="Memperbarui pelanggan"
      />

      {/* Customer List Table & Pagination */}
      <section aria-label="Daftar pelanggan" className="space-y-3">
        <h2 className="text-sm font-semibold">Daftar pelanggan</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm text-left">
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
                ) : isCustomersError ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center">
                      <div role="alert" className="space-y-2">
                        <p className="text-sm font-semibold">Gagal memuat pelanggan</p>
                        <p className="text-xs text-muted-foreground">Periksa koneksi lalu coba lagi.</p>
                        <Button variant="outline" onClick={() => void refetchCustomers()} className="mt-2 text-xs">Coba lagi</Button>
                      </div>
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                      {searchQuery.trim() ? 'Tidak ada pelanggan yang cocok. Coba nama, nomor HP, atau email lain.' : 'Belum ada data pelanggan yang terdaftar.'}
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
                          {formatPhoneInput(c.phone) || c.phone}
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
                        <CurrencyText value={c.total_spent || 0} />
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
          disabled={loading || isCustomersError}
          label="pelanggan"
        />
      </section>

      {/* Add Customer Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
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
              <PhoneInput
                placeholder="81234567890"
                value={addForm.phone}
                onValueChange={(phone) => setAddForm({ ...addForm, phone })}
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
              <PhoneInput
                value={editForm.phone || ''}
                onValueChange={(phone) => setEditForm({ ...editForm, phone })}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground pt-1">
                  <div>
                    <span className="block text-[10px]">No. WhatsApp:</span>
                    <span className="font-mono text-foreground font-medium">
                      {formatPhoneInput(selectedCustomer.phone) || selectedCustomer.phone}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px]">Total Belanja:</span>
                    <span className="text-emerald-600 font-bold">
                      <CurrencyText value={selectedCustomer.total_spent} />
                    </span>
                  </div>
                  {selectedCustomer.email && (
                    <div className="sm:col-span-2">
                      <span className="block text-[10px]">Email:</span>
                      <span className="text-foreground">{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="sm:col-span-2">
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
                            <CurrencyText value={sale.totalAmount} />
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

import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Factory,
  Building2,
  X,
  HelpCircle,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useQueryClient } from '@tanstack/react-query';
import { TablePagination } from '@/components/ui/table-pagination';
import { overheadService } from '@/features/overheads/services/overhead-service';
import {
  useOverheadsQuery,
  useOverheadSummaryQuery,
  overheadKeys,
} from '@/features/overheads/hooks/use-overheads-query';
import { OVERHEAD_CATEGORIES } from '@/features/overheads/types';
import type {
  OverheadType,
  OverheadCategory,
  CreateOverheadInput,
} from '@/features/overheads/types';

interface FeedbackMessage {
  type: 'success' | 'error';
  text: string;
}

export default function OverheadListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Queries
  const activeOnly =
    statusFilter === 'ACTIVE'
      ? true
      : statusFilter === 'INACTIVE'
      ? false
      : undefined;
  const category =
    categoryFilter !== 'ALL'
      ? (categoryFilter as OverheadCategory)
      : undefined;

  const {
    data: overheadsData,
    isLoading: loading,
    refetch: refetchOverheads,
  } = useOverheadsQuery({
    page,
    limit,
    search: search.trim() || undefined,
    category,
    activeOnly,
  });

  const {
    data: summaryData,
    refetch: refetchSummary,
  } = useOverheadSummaryQuery();

  const items = overheadsData?.items ?? [];
  const total = overheadsData?.total ?? 0;
  const totalPages = overheadsData?.totalPages ?? 1;

  // Feedback Notification Banner
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OverheadType | null>(null);
  const [formData, setFormData] = useState<CreateOverheadInput>({
    name: '',
    category: 'PRODUCTION',
    defaultAmount: 0,
    notes: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<OverheadType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleRefresh = async () => {
    await Promise.all([refetchOverheads(), refetchSummary()]);
  };

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback((current) => (current?.text === text ? null : current));
    }, 4500);
  };

  // Metrics Calculation from summaryData
  const stats = useMemo(() => {
    return {
      total: summaryData?.total_overheads ?? 0,
      active: summaryData?.active_count ?? 0,
      inactive: summaryData?.inactive_count ?? 0,
      production: summaryData?.production_count ?? 0,
      operational: summaryData?.operational_count ?? 0,
    };
  }, [summaryData]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'PRODUCTION',
      defaultAmount: 0,
      notes: '',
      isActive: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: OverheadType) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      defaultAmount: item.defaultAmount ?? 0,
      notes: item.notes || '',
      isActive: item.isActive,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      errors.name = 'Nama biaya overhead wajib diisi';
    }
    if (formData.defaultAmount !== null && formData.defaultAmount !== undefined && formData.defaultAmount < 0) {
      errors.defaultAmount = 'Nominal tidak boleh negatif';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (editingItem) {
        await overheadService.updateOverhead(editingItem.id, formData);
        showFeedback('success', `Biaya overhead "${formData.name}" berhasil diperbarui.`);
      } else {
        await overheadService.createOverhead(formData);
        showFeedback('success', `Biaya overhead "${formData.name}" berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: overheadKeys.all });
    } catch {
      showFeedback('error', 'Terjadi kesalahan saat menyimpan biaya overhead.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const deletedName = deleteTarget.name;
    try {
      await overheadService.deleteOverhead(deleteTarget.id);
      setDeleteTarget(null);
      showFeedback('success', `Biaya overhead "${deletedName}" berhasil dihapus.`);
      queryClient.invalidateQueries({ queryKey: overheadKeys.all });
    } catch {
      showFeedback('error', `Gagal menghapus biaya overhead "${deletedName}".`);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (item: OverheadType) => {
    const updatedStatus = !item.isActive;
    try {
      await overheadService.updateOverhead(item.id, { isActive: updatedStatus });
      showFeedback(
        'success',
        `Status "${item.name}" diubah ke ${updatedStatus ? 'Aktif' : 'Non-aktif'}.`
      );
      queryClient.invalidateQueries({ queryKey: overheadKeys.all });
    } catch {
      showFeedback('error', `Gagal mengubah status "${item.name}".`);
      queryClient.invalidateQueries({ queryKey: overheadKeys.all });
    }
  };

  const formatCurrency = (val: number | null) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getCategoryIcon = (category: OverheadCategory) => {
    switch (category) {
      case 'PRODUCTION':
        return <Factory className="h-3.5 w-3.5" />;
      case 'OPERATIONAL':
        return <Building2 className="h-3.5 w-3.5" />;
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Feedback Alert / Notification */}
        {feedback && (
          <div
            className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium border shadow-xs transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="flex-1">{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Biaya Overhead & Operasional
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Kelola biaya operasional dan biaya produksi langsung untuk alokasi HPP per batch
                </p>
              </div>
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
              onClick={handleOpenCreate}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-2xs"
            >
              <Plus className="h-4 w-4" />
              Tambah Biaya
            </Button>
          </div>
        </div>

        {/* KPI / Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Total Overheads */}
          <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
            <CardContent className="p-0 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Total Tipe Overhead</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    {stats.total}
                  </span>
                  <span className="text-xs text-muted-foreground">komponen</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Layers className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Status Aktif vs Non-aktif */}
          <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
            <CardContent className="p-0 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Status Operasional</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {stats.active} Aktif
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                    {stats.inactive} Non-aktif
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Biaya Produksi */}
          <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
            <CardContent className="p-0 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Biaya Produksi</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    {stats.production}
                  </span>
                  <span className="text-xs text-muted-foreground">otomatis per batch</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Factory className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Biaya Operasional Toko */}
          <Card className="py-3 px-4 shadow-2xs border-border/80 bg-card">
            <CardContent className="p-0 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Biaya Operasional Toko</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    {stats.operational}
                  </span>
                  <span className="text-xs text-muted-foreground">sewa & utilitas rutin</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Building2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 border rounded-2xl bg-card shadow-2xs">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Memuat data biaya overhead...</p>
          </div>
        ) : stats.total === 0 && !search && categoryFilter === 'ALL' && statusFilter === 'ALL' ? (
          /* Simplified Clean Empty State */
          <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center rounded-2xl border-2 border-dashed border-border bg-card/60 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
              <Layers className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Belum Ada Biaya Overhead</h2>
            <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
              Mulai tambahkan komponen biaya operasional seperti gas, listrik, atau tenaga kerja untuk menghitung HPP secara menyeluruh dan akurat.
            </p>
            <Button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Tambah Biaya Overhead
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-card p-3 rounded-xl border border-border shadow-2xs">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama biaya atau keterangan..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 bg-background/50 h-9 text-xs"
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('ALL');
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      statusFilter === 'ALL'
                        ? 'bg-background text-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Semua ({stats.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('ACTIVE');
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      statusFilter === 'ACTIVE'
                        ? 'bg-background text-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Aktif ({stats.active})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('INACTIVE');
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      statusFilter === 'INACTIVE'
                        ? 'bg-background text-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Non-aktif ({stats.inactive})
                  </button>
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
                  <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('ALL');
                      setPage(1);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      categoryFilter === 'ALL'
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : 'bg-muted/70 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    Semua Kategori
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('PRODUCTION');
                      setPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      categoryFilter === 'PRODUCTION'
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : 'bg-muted/70 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Factory className="h-3.5 w-3.5" />
                    Biaya Produksi
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        categoryFilter === 'PRODUCTION'
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-background/80 text-muted-foreground'
                      }`}
                    >
                      {stats.production}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('OPERATIONAL');
                      setPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      categoryFilter === 'OPERATIONAL'
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : 'bg-muted/70 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    Biaya Operasional
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        categoryFilter === 'OPERATIONAL'
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-background/80 text-muted-foreground'
                      }`}
                    >
                      {stats.operational}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Polished Table Container */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                    <tr>
                      <th className="px-5 py-3.5">Nama Biaya Overhead</th>
                      <th className="px-5 py-3.5">Kategori</th>
                      <th className="px-5 py-3.5">Nominal Standar</th>
                      <th className="px-5 py-3.5">Catatan</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                          <p className="font-medium text-foreground">Tidak ada biaya overhead yang cocok</p>
                          <p className="text-xs text-muted-foreground mt-1">Coba sesuaikan kata kunci pencarian atau filter kategori Anda.</p>
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => {
                        const meta = OVERHEAD_CATEGORIES[item.category] || OVERHEAD_CATEGORIES.PRODUCTION;
                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-muted/30 transition-colors group"
                          >
                            <td className="px-5 py-3.5 font-medium text-foreground">
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {item.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground font-normal">
                                  ID: {item.id.slice(0, 12)}...
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-help transition-shadow ${meta.badgeColorClass}`}
                                  >
                                    {getCategoryIcon(item.category)}
                                    {meta.label}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs text-xs">
                                  <p className="font-semibold">{meta.label}</p>
                                  <p className="text-muted-foreground mt-0.5">{meta.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-xs font-semibold text-foreground">
                              {formatCurrency(item.defaultAmount)}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-muted-foreground max-w-xs truncate">
                              {item.notes || '-'}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <div className="flex items-center justify-center">
                                <Switch
                                  checked={item.isActive}
                                  onCheckedChange={() => handleToggleActive(item)}
                                  aria-label="Toggle active status"
                                  className="data-[state=checked]:bg-emerald-600"
                                />
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEdit(item)}
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  title="Edit overhead"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteTarget(item)}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  title="Hapus overhead"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table Pagination */}
            <TablePagination
              total={total}
              displayedCount={items.length}
              page={page}
              totalPages={totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={loading}
              label="biaya overhead"
            />
          </div>
        )}

        {/* Modal Tambah / Edit Overhead */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                {editingItem ? 'Edit Biaya Overhead' : 'Tambah Biaya Overhead Baru'}
              </DialogTitle>
              <DialogDescription>
                Tentukan kategori biaya operasional toko atau biaya produksi per batch.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-4 pt-2">
              {/* Nama Overhead */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold">
                  Nama Biaya Overhead <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Contoh: Gas Elpiji, Listrik Operasional, Kemasan Box"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {formErrors.name && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Category Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">
                    Kategori Biaya <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" />
                    Pilih klasifikasi biaya
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(['PRODUCTION', 'OPERATIONAL'] as OverheadCategory[]).map((catKey) => {
                    const meta = OVERHEAD_CATEGORIES[catKey];
                    const isSelected = formData.category === catKey;
                    return (
                      <div
                        key={catKey}
                        onClick={() => setFormData({ ...formData, category: catKey })}
                        className={`cursor-pointer rounded-xl border p-3 transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-2xs'
                            : 'border-border/80 hover:border-muted-foreground/30 hover:bg-muted/10'
                        }`}
                      >
                        <input
                          type="radio"
                          name="category"
                          checked={isSelected}
                          onChange={() => setFormData({ ...formData, category: catKey })}
                          className="mt-0.5 text-primary focus:ring-primary cursor-pointer"
                        />
                        <div className="flex-1 text-xs">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            {getCategoryIcon(catKey)}
                            {meta.label}
                          </span>
                          <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                            {meta.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Nominal Standar (Rp) */}
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs font-semibold">
                  Nominal Standar (Rp)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    step="any"
                    placeholder="0"
                    value={formData.defaultAmount ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultAmount: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    className={`pl-9 ${formErrors.defaultAmount ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                </div>
                {formErrors.defaultAmount && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {formErrors.defaultAmount}
                  </p>
                )}
              </div>

              {/* Catatan / Deskripsi Tambahan */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-semibold">
                  Catatan Tambahan
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Keterangan alokasi atau dasar estimasi biaya..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>

              {/* Status Aktif */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold cursor-pointer">
                    Status Aktif
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Biaya produksi yang aktif akan otomatis dimuat saat menyelesaikan batch produksi.
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah Biaya Overhead'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Konfirmasi Hapus */}
        <Dialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Hapus Biaya Overhead
              </DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus biaya{' '}
                <span className="font-semibold text-foreground">
                  "{deleteTarget?.name}"
                </span>
                ? Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

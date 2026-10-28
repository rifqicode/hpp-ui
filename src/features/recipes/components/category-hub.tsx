import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, Plus, Tag, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { usePermission } from '@/hooks/use-permission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { recipeService } from '../services/recipe-service';

export function CategoryHub() {
  const storeId = useAuthStore((s) => s.activeStoreId);
  const client = useQueryClient();
  const { can } = usePermission();
  const query = useQuery({
    queryKey: ['products', 'categories', storeId],
    queryFn: recipeService.getCategories,
    enabled: Boolean(storeId),
  });

  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const categoryToDelete = query.data?.find((c) => c.id === deletingId);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      await recipeService.createCategory(name.trim());
      setName('');
      await client.invalidateQueries({ queryKey: ['products'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membuat kategori.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deletingId || isDeleting) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await recipeService.deleteCategory(deletingId);
      await client.invalidateQueries({ queryKey: ['products'] });
      setDeletingId(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Gagal menghapus kategori.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="space-y-6" aria-label="Kategori produk">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Kategori Produk</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelompokkan produk agar lebih mudah dicari di katalog produk dan kasir POS.
        </p>
      </div>

      {can('products:write') && (
        <div className="rounded-xl border bg-card p-5 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderPlus className="size-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-base font-semibold text-foreground">Tambah Kategori Baru</h3>
              <p className="text-xs text-muted-foreground">
                Buat kategori baru untuk mengelompokkan produk di katalog dan POS.
              </p>
            </div>
          </div>
          <form onSubmit={create} className="mt-4 space-y-3">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <Input
                  id="category-name"
                  type="text"
                  placeholder="Contoh: Kopi, Makanan Utama, Pastry..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={busy}
                  className="h-10"
                  required
                />
              </div>
              <Button
                type="submit"
                className="h-10 shrink-0 gap-2 font-medium"
                disabled={busy || !name.trim()}
              >
                <Plus className="size-4" />
                <span>{busy ? 'Menyimpan...' : 'Tambah Kategori'}</span>
              </Button>
            </div>
            {error && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {error}
              </p>
            )}
          </form>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Daftar Kategori</h3>
          {query.data && query.data.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {query.data.length} kategori terdaftar
            </span>
          )}
        </div>

        {query.isPending ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl border bg-muted/40 motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : query.isError ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-card p-6 text-center shadow-2xs"
          >
            <p className="text-sm font-semibold text-destructive">Gagal memuat kategori</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {query.error instanceof Error
                ? query.error.message
                : 'Terjadi kesalahan saat memuat data.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void query.refetch()}
            >
              Coba lagi
            </Button>
          </div>
        ) : query.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/60 px-4 py-12 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Tag className="size-6" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">Belum ada kategori</h4>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Tambahkan kategori baru di atas untuk mulai mengelompokkan produk Anda.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {query.data.map((category) => (
              <div
                key={category.id}
                className="group flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-2xs transition-colors hover:border-primary/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Tag className="size-4" />
                  </div>
                  <span
                    className="truncate font-semibold text-foreground"
                    title={category.name}
                  >
                    {category.name}
                  </span>
                </div>
                {can('products:write') && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title={`Hapus kategori ${category.name}`}
                    aria-label={`Hapus kategori ${category.name}`}
                    onClick={() => {
                      setDeleteError('');
                      setDeletingId(category.id);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeletingId(null);
            setDeleteError('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Kategori?</DialogTitle>
            <DialogDescription>
              Kategori{' '}
              <strong className="text-foreground">{categoryToDelete?.name}</strong> akan
              dihapus. Produk yang sebelumnya menggunakan kategori ini tidak akan
              terhapus.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {deleteError}
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => {
                setDeletingId(null);
                setDeleteError('');
              }}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void confirmDelete()}
            >
              {isDeleting ? 'Menghapus...' : 'Hapus Kategori'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

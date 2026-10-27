import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { useProductList } from "../hooks/use-product-list";

interface RecipeDeleteDialogProps {
  list: ReturnType<typeof useProductList>;
}

export function RecipeDeleteDialog({ list }: RecipeDeleteDialogProps) {
  return (
    <Dialog
      open={Boolean(list.productToDelete)}
      onOpenChange={(open) => {
        if (!open) list.closeDelete();
      }}
    >
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Hapus produk?</DialogTitle>
          <DialogDescription>
            Produk <strong>{list.productToDelete?.name}</strong> akan dihapus
            dari katalog. Riwayat produksi tetap tersimpan.
          </DialogDescription>
        </DialogHeader>
        {list.deleteError && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {list.deleteError.message}
          </p>
        )}
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="h-11"
            onClick={list.closeDelete}
            disabled={list.isDeleting}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            className="h-11 text-red-700 dark:text-red-300"
            onClick={() => void list.confirmDelete()}
            disabled={list.isDeleting}
          >
            {list.isDeleting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Hapus produk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

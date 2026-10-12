import { Bell, AlertTriangle, CheckCircle2, ChefHat } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function NotificationDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
          </span>
          <span className="sr-only">Notifikasi</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 sm:w-84 p-0 shadow-xl border border-border bg-popover" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 bg-muted/40">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">Notifikasi</h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
              3 Baru
            </span>
          </div>
          <button
            type="button"
            className="text-[11px] text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
          >
            Tandai sudah dibaca
          </button>
        </div>

        <div className="divide-y divide-border/50 max-h-[320px] overflow-y-auto">
          {/* Item 1: Alert Stok Menipis */}
          <div className="flex items-start gap-3 p-3.5 hover:bg-muted/40 transition-colors cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/20">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-semibold text-foreground truncate">Stok Menipis: Tepung Terigu</p>
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                Sisa stok 1.5 kg (di bawah batas minimum 5 kg). Segera buat Purchase Order.
              </p>
              <p className="text-[10px] text-muted-foreground/80 font-medium">10 menit lalu</p>
            </div>
          </div>

          {/* Item 2: PO Selesai */}
          <div className="flex items-start gap-3 p-3.5 hover:bg-muted/40 transition-colors cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-semibold text-foreground truncate">PO Bogasari Diterima</p>
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                Barang dari PO-2026-004 telah diverifikasi dan otomatis ditambahkan ke stok.
              </p>
              <p className="text-[10px] text-muted-foreground/80 font-medium">1 jam lalu</p>
            </div>
          </div>

          {/* Item 3: Batch Dapur Selesai */}
          <div className="flex items-start gap-3 p-3.5 hover:bg-muted/40 transition-colors cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/20">
              <ChefHat className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-semibold text-foreground truncate">Batch Dapur Selesai</p>
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                Batch Roti Manis #B-108 (50 pcs) telah selesai dipanggang dan siap dijual.
              </p>
              <p className="text-[10px] text-muted-foreground/80 font-medium">3 jam lalu</p>
            </div>
          </div>
        </div>

        <div className="p-2 border-t border-border/70 bg-muted/20 text-center">
          <Link
            to="/inventory/stocks"
            className="inline-block w-full py-1.5 text-xs font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
          >
            Lihat semua notifikasi
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

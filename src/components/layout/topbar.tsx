"use client"

import * as React from "react"
import { Search, Bell, Store, AlertTriangle, CheckCircle2, ChefHat } from "lucide-react"
import { useLocation, Link, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/use-auth-store"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Crumb {
  label: string
  href?: string
}

function getBreadcrumbs(pathname: string): Crumb[] {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname

  if (p === "/" || p === "/dashboard") {
    return [{ label: "Dashboard", href: "/dashboard" }, { label: "Overview" }]
  }

  // Inventory
  if (p === "/inventory/stocks") {
    return [{ label: "Inventaris" }, { label: "Stok Bahan" }]
  }
  if (p.startsWith("/inventory/stocks/")) {
    return [
      { label: "Inventaris" },
      { label: "Stok Bahan", href: "/inventory/stocks" },
      { label: "Detail Bahan" },
    ]
  }
  if (p === "/inventory/purchase/new") {
    return [
      { label: "Inventaris" },
      { label: "Stok Bahan", href: "/inventory/stocks" },
      { label: "Catat Belanja Masuk" },
    ]
  }
  if (p === "/inventory/movements/new") {
    return [
      { label: "Inventaris" },
      { label: "Stok Bahan", href: "/inventory/stocks" },
      { label: "Koreksi Mutasi" },
    ]
  }
  if (p === "/inventory/purchase-orders") {
    return [{ label: "Inventaris" }, { label: "Purchase Orders" }]
  }
  if (p === "/inventory/purchase-orders/new") {
    return [
      { label: "Inventaris" },
      { label: "Purchase Orders", href: "/inventory/purchase-orders" },
      { label: "Buat PO Baru" },
    ]
  }
  if (p.startsWith("/inventory/purchase-orders/")) {
    return [
      { label: "Inventaris" },
      { label: "Purchase Orders", href: "/inventory/purchase-orders" },
      { label: "Detail Purchase Order" },
    ]
  }
  if (p === "/inventory/suppliers") {
    return [{ label: "Inventaris" }, { label: "Pemasok (Suppliers)" }]
  }
  if (p.startsWith("/inventory/suppliers/")) {
    return [
      { label: "Inventaris" },
      { label: "Pemasok", href: "/inventory/suppliers" },
      { label: "Detail Pemasok" },
    ]
  }

  // Production - Products & Recipes
  if (p === "/production/products" || p === "/production/recipes") {
    return [{ label: "Produksi" }, { label: "Produk" }]
  }
  if (p === "/production/products/new" || p === "/production/recipes/new") {
    return [
      { label: "Produksi" },
      { label: "Produk", href: "/production/products" },
      { label: "Tambah Produk Baru" },
    ]
  }
  if (p.startsWith("/production/products/") || p.startsWith("/production/recipes/")) {
    return [
      { label: "Produksi" },
      { label: "Produk", href: "/production/products" },
      { label: "Detail Produk" },
    ]
  }
  if (p === "/production/batches") {
    return [{ label: "Produksi" }, { label: "Batch Dapur" }]
  }
  if (p === "/production/batches/new") {
    return [
      { label: "Produksi" },
      { label: "Batch Dapur", href: "/production/batches" },
      { label: "Mulai Batch Baru" },
    ]
  }
  if (p.startsWith("/production/batches/")) {
    return [
      { label: "Produksi" },
      { label: "Batch Dapur", href: "/production/batches" },
      { label: "Audit & HPP Batch" },
    ]
  }
  if (p.startsWith("/production/hpp")) {
    return [{ label: "Produksi" }, { label: "Kalkulator HPP" }]
  }

  // Sales
  if (p.startsWith("/sales/pos")) {
    return [{ label: "Penjualan" }, { label: "Kasir (POS)" }]
  }
  if (p.startsWith("/sales/history")) {
    return [{ label: "Penjualan" }, { label: "Riwayat Transaksi" }]
  }

  // Settings
  if (p === "/settings/store") {
    return [{ label: "Administrasi" }, { label: "Toko & Cabang" }]
  }
  if (p === "/settings") {
    return [{ label: "Administrasi" }, { label: "Pengaturan Umum" }]
  }
  if (p === "/settings/profile") {
    return [{ label: "Akun" }, { label: "Edit Profil" }]
  }
  if (p === "/settings/account") {
    return [{ label: "Akun" }, { label: "Pengaturan Akun & Keamanan" }]
  }

  return [{ label: "Dashboard", href: "/dashboard" }, { label: "Page" }]
}

export function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const activeStoreName = useAuthStore((state) => state.activeStoreName)
  const logout = useAuthStore((state) => state.logout)

  const userName = user?.name || "Budi Santoso"
  const userEmail = user?.email || "budi@tokoroti.com"
  const crumbs = getBreadcrumbs(location.pathname)

  return (
    <header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-primary/20 bg-primary text-primary-foreground px-4 sticky top-0 z-10">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <SidebarTrigger className="-ml-1 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground shrink-0" />
        <Separator orientation="vertical" className="h-4 bg-primary-foreground/30 shrink-0" />
        
        {/* Active Store Badge */}
        <div 
          className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary-foreground/15 hover:bg-primary-foreground/20 border border-primary-foreground/20 text-xs font-medium text-primary-foreground select-none max-w-[140px] xs:max-w-[170px] sm:max-w-[220px] md:max-w-[260px] shrink-0 transition-colors"
          title={`Toko Aktif: ${activeStoreName || "Toko Utama"}`}
        >
          <Store className="h-3.5 w-3.5 shrink-0 opacity-90 text-primary-foreground" />
          <span className="truncate">{activeStoreName || "Toko Utama"}</span>
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
        </div>

        <Separator orientation="vertical" className="h-4 bg-primary-foreground/30 shrink-0 hidden md:block" />

        <Breadcrumb className="hidden md:flex min-w-0">
          <BreadcrumbList>
            {crumbs.map((crumb, idx) => {
              const isLast = idx === crumbs.length - 1
              return (
                <React.Fragment key={crumb.label + idx}>
                  <BreadcrumbItem>
                    {isLast || !crumb.href ? (
                      <BreadcrumbPage className="font-semibold text-primary-foreground">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.href} className="text-primary-foreground/80 hover:text-white transition-colors">
                          {crumb.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator className="text-primary-foreground/50" />}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative hidden w-64 lg:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-primary-foreground/70" />
          <Input
            type="search"
            placeholder="Search activities..."
            className="w-full pl-9 bg-primary-foreground/15 text-primary-foreground placeholder:text-primary-foreground/70 border border-primary-foreground/20 focus-visible:ring-primary-foreground/30 h-9 text-sm rounded-full"
          />
        </div>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors cursor-pointer"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 border border-primary" />
              </span>
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
                Tandai semua dibaca
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full p-0 overflow-hidden border border-primary-foreground/30 hover:border-primary-foreground/60 hover:bg-primary-foreground/10 transition-all cursor-pointer"
            >
              <Avatar className="h-full w-full">
                <AvatarImage src="https://github.com/shadcn.png" alt={userName} />
                <AvatarFallback className="bg-primary-foreground/15 text-primary-foreground text-[10px] font-black">
                  {userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/settings/profile">Edit Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/settings/account">Account Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout()
                navigate("/login")
              }}
              className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

"use client"

import * as React from "react"
import { Search, Bell } from "lucide-react"
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

  // Production
  if (p === "/production/recipes") {
    return [{ label: "Produksi" }, { label: "Produk" }]
  }
  if (p === "/production/recipes/new") {
    return [
      { label: "Produksi" },
      { label: "Produk", href: "/production/recipes" },
      { label: "Tambah Produk Baru" },
    ]
  }
  if (p.startsWith("/production/recipes/")) {
    return [
      { label: "Produksi" },
      { label: "Produk", href: "/production/recipes" },
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
  const logout = useAuthStore((state) => state.logout)

  const userName = user?.name || "Budi Santoso"
  const userEmail = user?.email || "budi@tokoroti.com"
  const crumbs = getBreadcrumbs(location.pathname)

  return (
    <header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-primary/20 bg-primary text-primary-foreground px-4 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" />
        <Separator orientation="vertical" className="h-4 bg-primary-foreground/30" />
        <Breadcrumb className="hidden md:flex">
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

      <div className="flex items-center gap-4">
        <div className="relative hidden w-64 lg:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-primary-foreground/70" />
          <Input
            type="search"
            placeholder="Search activities..."
            className="w-full pl-9 bg-primary-foreground/15 text-primary-foreground placeholder:text-primary-foreground/70 border border-primary-foreground/20 focus-visible:ring-primary-foreground/30 h-9 text-sm rounded-full"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary-foreground border-2 border-primary" />
        </Button>
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

import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/use-auth-store"
import { usePermission } from "@/hooks/use-permission"
import {
  LayoutDashboard,
  Factory,
  Package,
  ShoppingCart,
  Settings,
  Users,
  Calculator,
  History,
  Store,
  ChevronsUpDown,
  Plus,
  Check,
  ClipboardList,
  User,
  LogOut,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuBadge,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu"

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  permission?: string
  badge?: string
}

interface NavGroup {
  group: string
  items: NavItem[]
}

// --- Configuration ---
const NAVIGATION: NavGroup[] = [
  {
    group: "Main",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, permission: "menu:dashboard" },
    ]
  },
  {
    group: "Inventory",
    items: [
      { title: "Bahan Baku", url: "/inventory/stocks", icon: Package, permission: "menu:stocks" },
      { title: "Suppliers", url: "/inventory/suppliers", icon: Users, permission: "menu:stocks" },
      { title: "Purchase Orders", url: "/inventory/purchase-orders", icon: ClipboardList, permission: "stocks:create" },
    ]
  },
  {
    group: "Production",
    items: [
      { title: "Produk", url: "/production/products", icon: Factory, permission: "menu:recipes" },
      { title: "Batches", url: "/production/batches", icon: History, badge: "3", permission: "menu:recipes" },
      { title: "HPP Calculator", url: "/production/hpp", icon: Calculator, permission: "menu:recipes" },
    ]
  },
  {
    group: "Sales",
    items: [
      { title: "POS", url: "/sales/pos", icon: ShoppingCart, permission: "menu:pos" },
      { title: "Transactions", url: "/sales/history", icon: History, permission: "orders:read" },
    ]
  },
  {
    group: "Administration",
    items: [
      { title: "Store Settings", url: "/settings/store", icon: Store, permission: "menu:settings" },
      { title: "Account Settings", url: "/settings", icon: Settings },
    ]
  }
]

const ALL_NAV_URLS = NAVIGATION.flatMap((g) => g.items.map((i) => i.url))

function isItemActive(pathname: string, itemUrl: string): boolean {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname

  // 1. Inventory Stocks sub-paths & details
  if (itemUrl === "/inventory/stocks") {
    if (
      p === "/inventory/stocks" ||
      p.startsWith("/inventory/stocks/") ||
      p === "/inventory/purchase" ||
      p.startsWith("/inventory/purchase/") ||
      p === "/inventory/movements" ||
      p.startsWith("/inventory/movements/")
    ) {
      return true
    }
  }

  // 2. Exact match
  if (p === itemUrl) {
    return true
  }

  // 3. Sub-paths & detail pages (e.g. /inventory/suppliers/sup-1 starts with /inventory/suppliers/)
  if (p.startsWith(itemUrl + "/")) {
    const hasMoreSpecificMatch = ALL_NAV_URLS.some(
      (otherUrl) =>
        otherUrl !== itemUrl &&
        otherUrl.length > itemUrl.length &&
        (p === otherUrl || p.startsWith(otherUrl + "/"))
    )
    return !hasMoreSpecificMatch
  }

  return false
}

const USER_DATA = {
  name: "Budi Santoso",
  email: "budi@tokoroti.com",
  avatar: "https://github.com/shadcn.png",
  plan: "Ultimate Pro" // Trial, Pro, Ultimate Pro
}


import { settingsService } from "@/features/settings/services/settings-service"
import type { StoreInfo } from "@/features/settings/types"

export function SidebarMain() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isMobile } = useSidebar()
  const [stores, setStores] = React.useState<StoreInfo[]>([])
  const [activeStore, setActiveStore] = React.useState<StoreInfo | null>(null)

  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const { can, permissions } = usePermission()

  const userName = user?.name || USER_DATA.name
  const userEmail = user?.email || USER_DATA.email

  React.useEffect(() => {
    async function loadStores() {
      try {
        const list = await settingsService.getStoresList()
        if (list && list.length > 0) {
          setStores(list)
          const currentId = useAuthStore.getState().activeStoreId
          const active = list.find((s) => s.id === currentId) || list[0]
          setActiveStore(active)
          useAuthStore.getState().setActiveStoreId(active.id)
          await settingsService.getStorePermissions(active.id)
        } else {
          navigate("/setup-store")
        }
      } catch (err) {
        console.error("Failed to load stores for sidebar:", err)
      }
    }
    loadStores()
  }, [navigate])

  const currentStore = activeStore || (stores.length > 0 ? stores[0] : {
    id: "default",
    name: "Toko Utama",
    location: "Jakarta",
    status: "online" as const,
    category: "Bakery",
  })

  async function handleStoreChange(store: StoreInfo) {
    if (store.id === currentStore.id) return
    try {
      await settingsService.switchStore(store.id)
      setActiveStore(store)
      useAuthStore.getState().setActiveStoreId(store.id)
      await settingsService.getStorePermissions(store.id)
      window.location.reload()
    } catch (err) {
      console.error("Failed to switch store:", err)
    }
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-primary/20 bg-sidebar shadow-md">
      <SidebarHeader className="p-3 pb-2 group-data-[collapsible=icon]:p-2">
        <div className="rounded-xl border border-sidebar-border/70 bg-card/60 p-1.5 shadow-2xs transition-all group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:shadow-none flex flex-col gap-1">
          {/* 1. User Profile */}
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    tooltip={userName}
                    className="h-11 rounded-lg px-2 hover:bg-sidebar-accent/70 data-[state=open]:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:p-0"
                  >
                    <Avatar className="size-7 rounded-md border border-border/80 shadow-xs shrink-0 group-data-[collapsible=icon]:size-8">
                      <AvatarImage src={USER_DATA.avatar} alt={userName} />
                      <AvatarFallback className="rounded-md bg-primary/10 text-primary font-bold text-[10px]">
                        {userName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden overflow-hidden">
                      <span className="truncate font-semibold text-foreground">
                        {userName}
                      </span>
                      <span className="truncate text-[10px] text-muted-foreground">
                        {userEmail}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-3.5 text-muted-foreground shrink-0 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl p-1.5 shadow-xl border-border"
                  side={isMobile ? "bottom" : "right"}
                  align="start"
                  sideOffset={6}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2.5 px-2 py-2 text-left text-xs">
                      <Avatar className="size-8 rounded-lg border border-border shadow-xs shrink-0">
                        <AvatarImage src={USER_DATA.avatar} alt={userName} />
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                          {userName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
                        <span className="truncate font-semibold">{userName}</span>
                        <span className="truncate text-[10px] text-muted-foreground">{userEmail}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="cursor-pointer gap-2.5 text-xs">
                      <Link to="/settings?tab=profile">
                        <User className="size-3.5 text-muted-foreground" />
                        <span>Profil Pengguna</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer gap-2.5 text-xs">
                      <Link to="/settings?tab=security">
                        <Settings className="size-3.5 text-muted-foreground" />
                        <span>Keamanan & Sesi</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout()
                      navigate("/login")
                    }}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer gap-2.5 text-xs"
                  >
                    <LogOut className="size-3.5" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* Hairline Divider */}
          <div className="h-px bg-sidebar-border/60 mx-1 group-data-[collapsible=icon]:hidden" />

          {/* 2. Store / Workspace Switcher */}
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    tooltip={currentStore.name}
                    className="h-11 rounded-lg px-2 hover:bg-sidebar-accent/70 data-[state=open]:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:p-0"
                  >
                    <div className="flex aspect-square size-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs shrink-0 group-data-[collapsible=icon]:size-8">
                      <Store className="size-3.5 group-data-[collapsible=icon]:size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden overflow-hidden">
                      <span className="truncate font-semibold flex items-center gap-1.5 text-foreground">
                        {currentStore.name}
                        <span
                          className={`size-1.5 rounded-full shrink-0 ${
                            currentStore.status === "online"
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-muted-foreground/50"
                          }`}
                        />
                      </span>
                      <span className="truncate text-[10px] text-muted-foreground uppercase tracking-wide">
                        {currentStore.location}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-3.5 text-muted-foreground shrink-0 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl p-1.5 shadow-xl border-border"
                  align="start"
                  side={isMobile ? "bottom" : "right"}
                  sideOffset={6}
                >
                  <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                    Daftar Toko & Cabang
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {stores.map((s) => (
                    <DropdownMenuItem
                      key={s.id}
                      onClick={() => handleStoreChange(s)}
                      className="flex items-center gap-3 p-2 cursor-pointer focus:bg-primary/5 rounded-lg"
                    >
                      <div
                        className={`flex size-7 items-center justify-center rounded-md border shadow-xs transition-colors
                        ${
                          currentStore.id === s.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 text-muted-foreground border-border"
                        }
                      `}
                      >
                        <Store className="size-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span
                          className={`text-xs font-semibold truncate ${
                            currentStore.id === s.id ? "text-primary" : ""
                          }`}
                        >
                          {s.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate uppercase">
                          {s.location}
                        </span>
                      </div>
                      {currentStore.id === s.id && (
                        <Check className="ml-auto size-3.5 text-primary shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  {user?.account_type !== "STAFF" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="flex items-center gap-2.5 p-2 cursor-pointer text-primary font-medium hover:bg-primary/5 rounded-lg">
                        <Link to="/settings/store">
                          <div className="flex size-7 items-center justify-center rounded-md border border-dashed border-primary/40 bg-primary/5">
                            <Plus className="size-3.5" />
                          </div>
                          <span className="text-xs font-semibold">Kelola & Tambah Cabang</span>
                          <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {NAVIGATION.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.permission || permissions.length === 0 || can(item.permission)
          )
          if (visibleItems.length === 0) return null

          return (
            <SidebarGroup key={group.group} className="py-2">
              <SidebarGroupLabel className="px-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
                {group.group}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const active = isItemActive(location.pathname, item.url)
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          tooltip={item.title}
                          isActive={active}
                          className={`
                            transition-all duration-200
                            ${active 
                              ? 'bg-primary/10 text-primary font-semibold shadow-sm' 
                              : 'hover:bg-primary/5 hover:text-primary'}
                          `}
                        >
                          <Link to={item.url} className="flex items-center gap-3">
                            <item.icon className={`h-4.5 w-4.5 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="text-sm">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                        {item.badge && (
                          <SidebarMenuBadge className="bg-primary text-primary-foreground font-bold text-[10px]">
                            {item.badge}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-sidebar-accent/20 border border-sidebar-border/40 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
            <Factory className="size-4" />
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-xs tracking-tight text-foreground">HPP Manager</span>
            <span className="text-[10px] text-muted-foreground">v1.0 • Bakery Edition</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/use-auth-store"
import { usePermission } from "@/hooks/use-permission"
import { useSubscriptionGuards, type SubscriptionFeatures } from "@/features/subscription"
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
  ClipboardList,
  User,
  LogOut,
  Layers,
  ChevronRight,
  Lock,
  CreditCard,
  Crown,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuBadge,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { UserAvatar } from "@/components/ui/user-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavSubItem {
  title: string
  url: string
  permission?: string
  requiredFeature?: keyof SubscriptionFeatures
  badge?: string
}

interface NavItem {
  title: string
  url?: string
  icon: React.ComponentType<{ className?: string }>
  permission?: string
  requiredFeature?: keyof SubscriptionFeatures
  badge?: string
  subItems?: NavSubItem[]
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
      { title: "Biaya Overhead", url: "/production/overheads", icon: Layers, permission: "menu:recipes" },
      { title: "Produk", url: "/production/products", icon: Factory, permission: "menu:recipes" },
      { title: "Production", url: "/production/batches", icon: History, permission: "menu:recipes" },
      {
        title: "HPP Calculator",
        icon: Calculator,
        permission: "menu:recipes",
        requiredFeature: "production_analytics",
        subItems: [
          { title: "Simulasi Resep Baru", url: "/production/hpp/recipe-simulation", requiredFeature: "production_analytics" },
          { title: "Simulasi Produksi & Restock", url: "/production/hpp/production-simulation", requiredFeature: "production_analytics" },
        ],
      },
    ]
  },
  {
    group: "Sales",
    items: [
      { title: "POS", url: "/sales/pos", icon: ShoppingCart, permission: "menu:pos" },
      { title: "Transactions", url: "/sales/history", icon: History, permission: "orders:read" },
      { title: "Customers", url: "/sales/customers", icon: Users, permission: "orders:read" },
    ]
  },
  {
    group: "Administration",
    items: [
      { title: "Subscription", url: "/subscription", icon: CreditCard },
      { title: "Store Settings", url: "/settings/store", icon: Store, permission: "menu:settings" },
      { title: "Account Settings", url: "/settings", icon: Settings },
    ]
  }
]

const ALL_NAV_URLS = NAVIGATION.flatMap((g) =>
  g.items.flatMap((i) => (i.subItems ? i.subItems.map((s) => s.url) : (i.url ? [i.url] : [])))
)

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
  plan: "Ultimate Pro" // Trial, Pro, Ultimate Pro
}


import { useStoresQuery, useStorePermissionsQuery } from "@/features/settings/hooks/use-stores-query"

export function SidebarMain() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isMobile, state: sidebarState, setOpenMobile } = useSidebar()
  const activeStoreId = useAuthStore((state) => state.activeStoreId)
  const { data: stores = [], isSuccess: isStoresSuccess } = useStoresQuery()
  useStorePermissionsQuery(activeStoreId)

  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>(() => {
    // Auto-open if current path matches any sub-item or /production/hpp
    const initial: Record<string, boolean> = {}
    NAVIGATION.forEach((g) => {
      g.items.forEach((item) => {
        if (item.subItems) {
          const isChildActive = item.subItems.some((sub) => location.pathname.startsWith(sub.url)) ||
            (item.title === "HPP Calculator" && location.pathname.startsWith("/production/hpp"))
          if (isChildActive) {
            initial[item.title] = true
          }
        }
      })
    })
    return initial
  })

  // Keep openMenus synchronized when path changes and close mobile drawer on navigation
  React.useEffect(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
    NAVIGATION.forEach((g) => {
      g.items.forEach((item) => {
        if (item.subItems) {
          const isChildActive = item.subItems.some((sub) => location.pathname.startsWith(sub.url)) ||
            (item.title === "HPP Calculator" && location.pathname.startsWith("/production/hpp"))
          if (isChildActive) {
            setOpenMenus((prev) => ({ ...prev, [item.title]: true }))
          }
        }
      })
    })
  }, [location.pathname, isMobile, setOpenMobile])

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { can, permissions } = usePermission()
  const { canAccessFeature, usage, isLoading: isSubscriptionLoading } = useSubscriptionGuards()

  const handleGatedClick = (e: React.MouseEvent, title: string) => {
    e.preventDefault()
    e.stopPropagation()
    window.dispatchEvent(
      new CustomEvent("open-upgrade-modal", {
        detail: {
          message: `Fitur "${title}" terkunci pada paket Anda saat ini. Silakan tingkatkan paket langganan Anda untuk membuka fitur ini.`,
          code: "FEATURE_LOCKED",
        },
      })
    )
  }

  const userName = user?.name || USER_DATA.name
  const userEmail = user?.email || USER_DATA.email
  const userAvatar = user?.avatar

  React.useEffect(() => {
    if (isStoresSuccess && stores.length === 0) {
      navigate("/setup-store")
    }
  }, [isStoresSuccess, stores.length, navigate])

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-primary/20 bg-sidebar shadow-md">
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
                    <UserAvatar
                      src={userAvatar}
                      name={userName}
                      className="size-7 rounded-md border border-border/80 shadow-xs shrink-0 group-data-[collapsible=icon]:size-8"
                      fallbackClassName="rounded-md text-[10px]"
                    />
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
                      <UserAvatar
                        src={userAvatar}
                        name={userName}
                        className="size-8 rounded-lg border border-border shadow-xs shrink-0"
                        fallbackClassName="rounded-lg text-xs"
                      />
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

          <Link
            to="/subscription"
            className="flex min-h-9 items-center justify-between gap-2 rounded-lg px-2 text-xs hover:bg-sidebar-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:hidden"
            aria-label="Lihat paket langganan"
          >
            <span className="text-muted-foreground">Paket aktif</span>
            <span
              data-tier={usage?.effective_tier}
              className="subscription-tier inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground"
            >
              {usage?.effective_tier === "MAX_GROWTH" && <Crown className="size-3 shrink-0" aria-hidden="true" />}
              {usage ? ({ FREE: "Free", GROWTH: "Growth", MAX_GROWTH: "Max Growth" }[usage.effective_tier]) : isSubscriptionLoading ? "Memuat..." : "Tidak tersedia"}
            </span>
          </Link>
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
                    if (item.subItems && item.subItems.length > 0) {
                      const isChildActive = item.subItems.some((sub) => location.pathname === sub.url || location.pathname.startsWith(sub.url + "/")) ||
                        (item.title === "HPP Calculator" && location.pathname.startsWith("/production/hpp"))
                      const isOpen = openMenus[item.title] ?? isChildActive

                      // If sidebar is collapsed to icon mode, provide DropdownMenu so users can still access sub-items
                      if (sidebarState === "collapsed" && !isMobile) {
                        return (
                          <SidebarMenuItem key={item.title}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                  tooltip={item.title}
                                  isActive={isChildActive}
                                  className={`
                                    transition-all duration-150
                                    ${isChildActive
                                      ? "bg-primary/15 text-primary font-semibold border border-primary/20 shadow-2xs hover:bg-primary/20 hover:text-primary"
                                      : "text-muted-foreground hover:bg-sidebar-accent/80 hover:text-foreground"}
                                  `}
                                >
                                  <item.icon className={`h-4.5 w-4.5 shrink-0 transition-colors ${isChildActive ? "text-primary" : "text-muted-foreground group-hover/menu-button:text-foreground"}`} />
                                  <span className="text-sm">{item.title}</span>
                                </SidebarMenuButton>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent side="right" align="start" className="min-w-48 rounded-xl p-1.5 shadow-xl border-border">
                                <DropdownMenuLabel className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                                  {item.title}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {item.subItems.map((sub) => {
                                  const isSubActive = location.pathname === sub.url
                                  const isSubGated = sub.requiredFeature ? !canAccessFeature(sub.requiredFeature) : false
                                  return (
                                    <DropdownMenuItem key={sub.url} asChild className="p-0">
                                      {isSubGated ? (
                                        <button
                                          type="button"
                                          onClick={(e) => handleGatedClick(e, sub.title)}
                                          className="flex items-center justify-between w-full px-2.5 py-1.5 text-xs rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                                        >
                                          <span>{sub.title}</span>
                                          <Lock className="size-3 text-amber-500/80 shrink-0 ml-1.5" />
                                        </button>
                                      ) : (
                                        <Link
                                          to={sub.url}
                                          className={`flex items-center w-full px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                                            isSubActive
                                              ? "bg-primary/15 text-primary font-semibold"
                                              : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                                          }`}
                                        >
                                          <span>{sub.title}</span>
                                        </Link>
                                      )}
                                    </DropdownMenuItem>
                                  )
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </SidebarMenuItem>
                        )
                      }

                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            aria-expanded={isOpen}
                            onClick={() => toggleMenu(item.title)}
                            isActive={isChildActive}
                            className={`
                              w-full justify-between transition-all duration-150 cursor-pointer
                              ${isChildActive
                                ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                                : "text-muted-foreground hover:bg-sidebar-accent/80 hover:text-foreground"}
                            `}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <item.icon className={`h-4.5 w-4.5 shrink-0 transition-colors ${isChildActive ? "text-primary" : "text-muted-foreground"}`} />
                              <span className="text-sm truncate">{item.title}</span>
                            </div>
                            <ChevronRight
                              className={`h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform duration-200 ${
                                isOpen ? "rotate-90 text-primary" : ""
                              }`}
                            />
                          </SidebarMenuButton>

                          {isOpen && (
                            <SidebarMenuSub className="mt-1 space-y-0.5">
                              {item.subItems.map((sub) => {
                                const isSubActive = location.pathname === sub.url
                                const isSubGated = sub.requiredFeature ? !canAccessFeature(sub.requiredFeature) : false
                                return (
                                  <SidebarMenuSubItem key={sub.url}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isSubActive}
                                      className={`
                                        transition-colors text-xs py-1.5 h-11 lg:h-8
                                        ${isSubActive
                                          ? "bg-primary/15 text-primary font-semibold hover:bg-primary/20 hover:text-primary"
                                          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"}
                                      `}
                                    >
                                      {isSubGated ? (
                                        <button
                                          type="button"
                                          onClick={(e) => handleGatedClick(e, sub.title)}
                                          className="flex items-center justify-between w-full text-muted-foreground hover:text-foreground cursor-pointer"
                                        >
                                          <span>{sub.title}</span>
                                          <Lock className="size-3 text-amber-500/80 shrink-0 ml-1.5" />
                                        </button>
                                      ) : (
                                        <Link to={sub.url}>
                                          <span>{sub.title}</span>
                                        </Link>
                                      )}
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                )
                              })}
                            </SidebarMenuSub>
                          )}
                        </SidebarMenuItem>
                      )
                    }

                    const active = item.url ? isItemActive(location.pathname, item.url) : false
                    const isGated = item.requiredFeature ? !canAccessFeature(item.requiredFeature) : false
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          tooltip={item.title}
                          isActive={active}
                          className={`
                            transition-all duration-150
                            ${active 
                              ? 'bg-primary/15 text-primary font-semibold border border-primary/20 shadow-2xs hover:bg-primary/20 hover:text-primary' 
                              : 'text-muted-foreground hover:bg-sidebar-accent/80 hover:text-foreground'}
                          `}
                        >
                          {isGated ? (
                            <button
                              type="button"
                              onClick={(e) => handleGatedClick(e, item.title)}
                              className="flex items-center gap-3 w-full cursor-pointer"
                            >
                              <item.icon className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
                              <span className="text-sm">{item.title}</span>
                              <Lock className="size-3 text-amber-500/80 ml-auto shrink-0" />
                            </button>
                          ) : (
                            <Link to={item.url || "#"} className="flex items-center gap-3">
                              <item.icon className={`h-4.5 w-4.5 shrink-0 transition-colors ${active ? 'text-primary' : 'text-muted-foreground group-hover/menu-button:text-foreground'}`} />
                              <span className="text-sm">{item.title}</span>
                            </Link>
                          )}
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
      <SidebarRail />
    </Sidebar>
  )
}

import * as React from "react"
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  CheckCheck,
  Search,
  Store,
  ShieldCheck,
  BellOff,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { TablePagination } from "@/components/ui/table-pagination"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/features/subscription"
import { useStoresQuery } from "@/features/settings/hooks/use-stores-query"

export default function NotificationListPage() {
  const { notifications, unreadCount, markAsRead, isMarkingAsRead, isLoading } = useNotifications()
  const { data: stores = [] } = useStoresQuery()

  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "unread" | "read">("all")
  const [selectedStoreId, setSelectedStoreId] = React.useState<string>("all")
  const [isMarkingAll, setIsMarkingAll] = React.useState(false)
  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 10

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, selectedStoreId])

  const storeMap = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const s of stores) {
      map.set(s.id, s.name)
    }
    return map
  }, [stores])

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read)
    if (unread.length === 0) return
    setIsMarkingAll(true)
    try {
      for (const notif of unread) {
        await markAsRead(notif.id)
      }
    } finally {
      setIsMarkingAll(false)
    }
  }

  const formatNotificationDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const formatted = date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      return `${formatted} WIB`
    } catch {
      return dateStr
    }
  }

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case "SUBSCRIPTION_EXPIRING_SOON":
      case "SUBSCRIPTION_IN_GRACE_PERIOD":
      case "warning":
      case "alert":
        return (
          <div className="h-9 w-9 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
        )
      case "SUBSCRIPTION_EXPIRED":
      case "expired":
      case "danger":
        return (
          <div className="h-9 w-9 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
            <ShieldAlert className="h-4.5 w-4.5" />
          </div>
        )
      case "SUBSCRIPTION_RENEWED":
      case "success":
        return (
          <div className="h-9 w-9 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <CheckCircle2 className="h-4.5 w-4.5" />
          </div>
        )
      default:
        return (
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
        )
    }
  }

  const sortedNotifications = React.useMemo(() => {
    return [...notifications]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 100)
  }, [notifications])

  const filteredNotifications = React.useMemo(() => {
    return sortedNotifications.filter((item) => {
      // Status filter
      if (statusFilter === "unread" && item.is_read) return false
      if (statusFilter === "read" && !item.is_read) return false

      // Store filter
      if (selectedStoreId !== "all") {
        if (item.store_id !== selectedStoreId) return false
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const storeName = item.store_id ? (storeMap.get(item.store_id) || "") : "Akun Utama"
        const matchesTitle = item.title?.toLowerCase().includes(query)
        const matchesMessage = item.message?.toLowerCase().includes(query)
        const matchesStore = storeName.toLowerCase().includes(query)
        if (!matchesTitle && !matchesMessage && !matchesStore) return false
      }

      return true
    })
  }, [sortedNotifications, statusFilter, selectedStoreId, searchQuery, storeMap])

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / pageSize))
  const paginatedNotifications = React.useMemo(() => {
    return filteredNotifications.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [filteredNotifications, currentPage, pageSize])

  const readCount = notifications.length - unreadCount

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="size-6 text-primary" />
            Notifikasi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Semua riwayat pemberitahuan, aktivitas toko, dan status langganan akun Anda.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || isMarkingAll || isMarkingAsRead}
            className="w-full sm:w-auto gap-1.5 cursor-pointer shadow-xs"
          >
            {isMarkingAll ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <CheckCheck className="size-4 text-primary" />
            )}
            <span>Tandai semua dibaca</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-3 rounded-xl border bg-card shadow-xs">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <Button
            variant={statusFilter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="text-xs h-8 cursor-pointer shrink-0"
          >
            Semua ({notifications.length})
          </Button>
          <Button
            variant={statusFilter === "unread" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("unread")}
            className="text-xs h-8 gap-1.5 cursor-pointer shrink-0"
          >
            <span>Belum Dibaca</span>
            {unreadCount > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none",
                  statusFilter === "unread"
                    ? "bg-primary-foreground text-primary"
                    : "bg-amber-500 text-white"
                )}
              >
                {unreadCount}
              </span>
            )}
          </Button>
          <Button
            variant={statusFilter === "read" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("read")}
            className="text-xs h-8 cursor-pointer shrink-0"
          >
            Sudah Dibaca ({readCount})
          </Button>
        </div>

        {/* Search & Store Select */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Cari notifikasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs w-full sm:w-48 lg:w-60"
            />
          </div>

          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            aria-label="Filter Toko"
          >
            <option value="all">Semua Toko</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="size-6 animate-spin mr-2 text-primary" />
          <span className="text-sm">Memuat notifikasi...</span>
        </div>
      ) : filteredNotifications.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border bg-card/50">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <BellOff className="size-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Tidak ada notifikasi yang ditemukan</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {searchQuery || statusFilter !== "all" || selectedStoreId !== "all"
              ? "Coba sesuaikan kata kunci pencarian atau ganti filter status dan toko."
              : "Saat ini Anda belum memiliki riwayat pemberitahuan aktivitas atau langganan."}
          </p>
          {(searchQuery || statusFilter !== "all" || selectedStoreId !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
                setSelectedStoreId("all")
              }}
              className="mt-4 text-xs cursor-pointer"
            >
              Reset Filter
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2.5">
            {paginatedNotifications.map((item) => {
              const storeName = item.store_id ? storeMap.get(item.store_id) : undefined
              const isUnread = !item.is_read

              return (
                <div
                  key={item.id}
                  onClick={() => isUnread && markAsRead(item.id)}
                  className={cn(
                    "flex items-start gap-3.5 p-4 rounded-xl border transition-all",
                    isUnread
                      ? "bg-card border-amber-500/30 hover:border-amber-500/50 shadow-xs cursor-pointer ring-1 ring-amber-500/10"
                      : "bg-card/70 border-border/70 hover:bg-card text-muted-foreground"
                  )}
                >
                  {getCategoryIcon(item.type)}

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={cn(
                            "text-sm leading-tight",
                            isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                          )}
                        >
                          {item.title}
                        </h4>
                        {isUnread && (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-semibold px-2 py-0.5 hover:bg-amber-500/20">
                            Baru
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {item.store_id ? (
                          <Badge
                            variant="outline"
                            className="gap-1 text-[11px] font-medium bg-muted/40 text-foreground border-border/80"
                          >
                            <Store className="size-3 text-primary" />
                            {storeName || "Toko"}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="gap-1 text-[11px] font-medium bg-muted/30 text-muted-foreground border-border/60"
                          >
                            <ShieldCheck className="size-3 text-muted-foreground" />
                            Akun Utama
                          </Badge>
                        )}
                        <span className="text-[11px] text-muted-foreground/80 font-medium">
                          {formatNotificationDate(item.created_at)}
                        </span>
                      </div>
                    </div>

                    <p
                      className={cn(
                        "text-xs leading-relaxed",
                        isUnread ? "text-foreground/90" : "text-muted-foreground"
                      )}
                    >
                      {storeName && !item.message.startsWith(`[${storeName}]`) ? (
                        <>
                          <span className="font-semibold text-primary">[{storeName}]</span> {item.message}
                        </>
                      ) : (
                        item.message
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredNotifications.length > pageSize && (
            <TablePagination
              total={filteredNotifications.length}
              displayedCount={paginatedNotifications.length}
              page={currentPage}
              totalPages={totalPages}
              onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
              onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              label="notifikasi"
            />
          )}
        </div>
      )}
    </div>
  )
}

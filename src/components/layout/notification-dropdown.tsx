import { Bell, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNotifications } from "@/features/subscription"

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead } = useNotifications()

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read)
    for (const notif of unread) {
      await markAsRead(notif.id)
    }
  }

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "SUBSCRIPTION_EXPIRING_SOON":
      case "SUBSCRIPTION_IN_GRACE_PERIOD":
        return (
          <div className="h-8 w-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4" />
          </div>
        )
      case "SUBSCRIPTION_EXPIRED":
        return (
          <div className="h-8 w-8 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 border border-rose-500/20">
            <ShieldAlert className="h-4 w-4" />
          </div>
        )
      case "SUBSCRIPTION_RENEWED":
        return (
          <div className="h-8 w-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        )
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
            <Sparkles className="h-4 w-4" />
          </div>
        )
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-11 w-11 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
            </span>
          )}
          <span className="sr-only">Notifikasi</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 sm:w-[22rem] max-w-[calc(100vw-1rem)] p-0 shadow-xl border border-border bg-popover" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 bg-muted/40">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">Notifikasi</h4>
            {unreadCount > 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                {unreadCount} Baru
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">Semua dibaca</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-[11px] text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
            >
              Tandai sudah dibaca
            </button>
          )}
        </div>

        <div className="divide-y divide-border/50 max-h-[320px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Tidak ada notifikasi saat ini
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => !item.is_read && markAsRead(item.id)}
                className={`flex items-start gap-3 p-3.5 hover:bg-muted/40 transition-colors cursor-pointer ${
                  !item.is_read ? "bg-muted/20" : ""
                }`}
              >
                {getNotifIcon(item.type)}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-xs truncate ${!item.is_read ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>
                      {item.title}
                    </p>
                    {!item.is_read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                    {item.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground/80 font-medium">
                    {formatTimeAgo(item.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { NotificationIcon, TickDouble02Icon } from "@hugeicons/core-free-icons"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/modules/auth/auth.context"
import { useNotifications, useUnreadCount } from "../notifications.queries"
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "../notifications.mutations"
import { useNotificationsRealtime } from "../useNotificationsRealtime"
import type { Notification } from "../notifications.type"

// ponytail: data peut arriver déjà parsé (objet) ou en string JSON selon l'API.
export const notificationLabel = (notification: Notification): string => {
  const raw = notification.data
  const data: unknown = typeof raw === "string" ? safeParse(raw) : raw
  if (data && typeof data === "object") {
    const d = data as { message?: unknown; title?: unknown }
    if (typeof d.message === "string") return d.message
    if (typeof d.title === "string") return d.title
  }
  return typeof raw === "string" ? raw : JSON.stringify(raw)
}

const safeParse = (s: string): unknown => {
  try {
    return JSON.parse(s)
  } catch {
    return s
  }
}

export function NavNotifications() {
  const { isMobile } = useSidebar()
  const { user } = useAuth()
  const { t } = useTranslation("notifications")

  const { data: unreadCount } = useUnreadCount()
  const { data: notifications, isPending, isError } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  useNotificationsRealtime()

  if (!user) {
    return null
  }

  const count = unreadCount?.data ?? 0
  const items = notifications?.data ?? []

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                tooltip={t("title")}
                className="aria-expanded:bg-muted"
              />
            }
          >
            <span className="relative">
              <HugeiconsIcon icon={NotificationIcon} strokeWidth={2} />
              {count > 0 && (
                <span
                  aria-hidden
                  className="absolute -top-0.5 -right-0.5 hidden size-2 rounded-full bg-destructive group-data-[collapsible=icon]:block"
                />
              )}
            </span>
            <span>{t("title")}</span>
            {count > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-md bg-destructive px-1 text-xs font-medium text-white tabular-nums">
                {count}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-80"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="flex items-center justify-between">
              {t("title")}
              {count > 0 && (
                <button
                  type="button"
                  className="text-xs font-normal text-muted-foreground hover:text-foreground"
                  onClick={() => markAllRead.mutate()}
                >
                  <HugeiconsIcon
                    icon={TickDouble02Icon}
                    strokeWidth={2}
                    className="mr-1 inline size-3.5"
                  />
                  {t("markAllRead")}
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {isError && (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  {t("error")}
                </div>
              )}
              {!isError && isPending && (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  {t("loading")}
                </div>
              )}
              {!isError && !isPending && items.length === 0 && (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  {t("empty")}
                </div>
              )}
              {items.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => {
                    if (!notification.read_at) {
                      markRead.mutate(notification.id)
                    }
                  }}
                >
                  <span
                    aria-hidden
                    className={
                      notification.read_at
                        ? "size-2 shrink-0 rounded-full bg-transparent"
                        : "size-2 shrink-0 rounded-full bg-destructive"
                    }
                  />
                  <span className="line-clamp-2 text-sm">
                    {notificationLabel(notification)}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

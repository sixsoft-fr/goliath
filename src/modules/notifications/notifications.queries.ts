import { useQuery } from "@tanstack/react-query";
import { listNotifications, getUnreadCount } from "./notifications.service";
import { type TableQueries } from "@/modules/core/service/api.types";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (tableQueries: TableQueries) => ["notifications", "list", tableQueries] as const,
  unreadCount: () => ["notifications", "unread-count"] as const,
};

export const useNotifications = (tableQueries: TableQueries = {}) =>
  useQuery({
    queryKey: notificationKeys.list(tableQueries),
    // rethrow after logging : le dropdown a besoin de isError pour son état d'erreur
    queryFn: () =>
      listNotifications(tableQueries).catch((error) => {
        console.error({ error, queryKey: notificationKeys.list(tableQueries) });
        throw error;
      }),
  });

export const useUnreadCount = () =>
  useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () =>
      getUnreadCount().catch((error) => {
        console.error({ error, queryKey: notificationKeys.unreadCount() });
        throw error;
      }),
  });

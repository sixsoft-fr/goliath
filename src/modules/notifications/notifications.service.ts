import { api } from "@/lib/api";
import { adaptFilters } from "@/modules/core/service/list.utils";
import { type Notification } from "./notifications.type";
import { type TableQueries } from "@/modules/core/service/api.types";
import type { Resource } from "@/modules/core/service/api.types";
import type { PaginatedResponse } from "@/modules/core/service/paginated.types";

export const listNotifications = (
  tableQueries: TableQueries,
): Promise<PaginatedResponse<Notification>> =>
  api
    .get("notifications", {
      searchParams: adaptFilters(tableQueries),
    })
    .json<PaginatedResponse<Notification>>();

export const readNotification = (
  notificationId: string,
): Promise<Resource<Notification>> =>
  api
    .post(`notifications/${notificationId}/mark-read`)
    .json<Resource<Notification>>();

export const readAllNotifications = (): Promise<Resource<Notification>> =>
  api.post("notifications/mark-all-read").json<Resource<Notification>>();

export const getUnreadCount = (): Promise<Resource<number>> =>
  api.get("notifications/unread-count").json<Resource<number>>();

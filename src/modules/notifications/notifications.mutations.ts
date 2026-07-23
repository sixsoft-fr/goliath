import { useMutation, useQueryClient } from "@tanstack/react-query";
import { readNotification, readAllNotifications } from "./notifications.service";
import { notificationKeys } from "./notifications.queries";

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => readNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error, notificationId) => {
      console.error({ error, notificationId });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => readAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error) => {
      console.error({ error, notificationId: "all" });
    },
  });
};

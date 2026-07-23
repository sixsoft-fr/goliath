import { useQueryClient } from "@tanstack/react-query";
import { useEchoChannel } from "@/lib/echo/useEchoChannel";
import { useAuth } from "@/modules/auth/auth.context";
import { notificationKeys } from "./notifications.queries";

// ponytail: doit matcher exactement le broadcast Laravel. Canal privé sur l'id user
// (pas l'uuid), event par défaut des database notifications diffusées.
// Si le backend utilise un event custom, changer cette constante suffit.
const NOTIFICATION_EVENT =
  ".Illuminate\\Notifications\\Events\\BroadcastNotificationCreated";

export const useNotificationsRealtime = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEchoChannel(
    user?.id ? `App.Models.User.${user.id}` : null,
    NOTIFICATION_EVENT,
    () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  );
};

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configurar cómo se comportan las notificaciones cuando la app está en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const permissions = await Notifications.getPermissionsAsync();

  let finalStatus = permissions.status;

  if (finalStatus !== "granted") {
    const requestedPermissions = await Notifications.requestPermissionsAsync();

    finalStatus = requestedPermissions.status;
  }

  return finalStatus === "granted";
}

export async function scheduleVisitNotifications(
  visitId: string,
  nombreEstablecimiento: string,
  nombreRuta: string,
  fechaProgramadaISO: string,
) {
  // Primero cancelamos cualquier notificación anterior
  // para esta visita para no duplicar.
  await cancelVisitNotifications(visitId);

  const fechaProgramada = new Date(fechaProgramadaISO);

  if (isNaN(fechaProgramada.getTime())) {
    return;
  }

  // Días de desfase.
  const daysOffset = [-3, -2, -1, 0, 1, 2, 3];

  for (const offset of daysOffset) {
    const notificationDate = new Date(fechaProgramada);

    notificationDate.setDate(notificationDate.getDate() + offset);

    // Establecer la hora de la notificación a las 9:00 AM
    notificationDate.setHours(9, 0, 0, 0);

    // Si la fecha calculada ya pasó, no la programamos
    if (notificationDate.getTime() > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${visitId}_${offset}`,

        content: {
          title: "¡Visita Próxima!",
          body: `Recuerda que debes visitar el establecimiento: ${nombreEstablecimiento} de la ruta: ${nombreRuta}, programado para: ${fechaProgramadaISO.split("T")[0]}`,
          data: {
            visitId,
          },
        },

        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationDate,
        },
      });
    }
  }
}

/**
 * Cancela todas las notificaciones programadas
 * para una visita específica.
 *
 * Útil cuando la visita cambia a estado "completada"
 * o es eliminada.
 */
export async function cancelVisitNotifications(visitId: string) {
  const daysOffset = [-3, -2, -1, 0, 1, 2, 3];

  for (const offset of daysOffset) {
    try {
      await Notifications.cancelScheduledNotificationAsync(
        `${visitId}_${offset}`,
      );
    } catch (e) {
      // Ignorar errores si la notificación no existía
    }
  }
}

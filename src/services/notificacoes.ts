/**
 * Notificações locais dos alertas preventivos.
 * Notificações LOCAIS funcionam no Expo Go (Android e iOS); só as push exigem development build.
 * O módulo é carregado sob demanda para não pesar na abertura do app.
 */
import { Platform } from 'react-native';

let configurado: Promise<boolean> | null = null;

async function configurar(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      // No Android 13+ o pedido de permissão só aparece depois que existe um canal.
      await Notifications.setNotificationChannelAsync('alertas-risco', {
        name: 'Alertas de risco',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 300, 200, 300],
      });
    }
    const atual = await Notifications.getPermissionsAsync();
    if (atual.granted) return true;
    const pedido = await Notifications.requestPermissionsAsync();
    return pedido.granted;
  } catch {
    return false;
  }
}

/** Pede permissão uma única vez por execução do app. */
export function prepararNotificacoes(): Promise<boolean> {
  configurado ??= configurar();
  return configurado;
}

export async function notificarAgora(titulo: string, corpo: string): Promise<void> {
  if (!(await prepararNotificacoes())) return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: { title: titulo, body: corpo },
      trigger: Platform.OS === 'android' ? { channelId: 'alertas-risco' } : null,
    });
  } catch {
    // Sem notificação o alerta continua aparecendo dentro do app.
  }
}

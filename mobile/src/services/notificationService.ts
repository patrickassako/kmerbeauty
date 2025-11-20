/**
 * Notification Service
 * Gestion des push notifications avec Expo et Firebase Cloud Messaging
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configuration du comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationData {
  bookingId?: string;
  messageId?: string;
  chatId?: string;
  type?: 'booking' | 'message' | 'admin';
  [key: string]: any;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Demander la permission pour les notifications
   */
  async requestPermission(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('❌ Les notifications ne fonctionnent que sur un appareil physique');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Permission de notification refusée');
      return false;
    }

    console.log('✅ Permission de notification accordée');
    return true;
  }

  /**
   * Obtenir le token Expo Push (qui sera converti en FCM token)
   */
  async getExpoPushToken(): Promise<string | null> {
    if (this.expoPushToken) {
      return this.expoPushToken;
    }

    try {
      if (!Device.isDevice) {
        console.log('❌ Doit être exécuté sur un appareil physique');
        return null;
      }

      // Demander la permission d'abord
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return null;
      }

      // Obtenir le projectId depuis différentes sources possibles
      // Dans un bare workflow (après prebuild), on utilise le projectId en dur
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.expoConfig?.projectId ||
        Constants.manifest?.extra?.eas?.projectId ||
        Constants.manifest2?.extra?.eas?.projectId ||
        'kmerservice-d178f'; // Fallback pour bare workflow

      console.log('🔍 ProjectId détecté:', projectId);

      // Obtenir le token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      this.expoPushToken = token.data;
      console.log('📱 Expo Push Token:', this.expoPushToken);

      return this.expoPushToken;
    } catch (error) {
      console.error('❌ Erreur lors de l\'obtention du token:', error);
      return null;
    }
  }

  /**
   * Configurer le canal de notification Android
   */
  async setupAndroidChannel() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      // Canal pour les messages
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });

      // Canal pour les commandes
      await Notifications.setNotificationChannelAsync('bookings', {
        name: 'Commandes',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });

      console.log('✅ Canaux Android configurés');
    }
  }

  /**
   * Écouter les notifications reçues quand l'app est ouverte (foreground)
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Écouter les interactions avec les notifications (tap)
   */
  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Afficher une notification locale (pour test ou app en foreground)
   */
  async showLocalNotification(
    title: string,
    body: string,
    data?: NotificationData
  ) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Immédiatement
    });
  }

  /**
   * Obtenir toutes les notifications déjà affichées
   */
  async getPresentedNotifications() {
    return await Notifications.getPresentedNotificationsAsync();
  }

  /**
   * Effacer toutes les notifications
   */
  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Obtenir le nombre de badges (iOS)
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Définir le nombre de badges (iOS)
   */
  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }
}

export default new NotificationService();

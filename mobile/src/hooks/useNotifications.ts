/**
 * Hook useNotifications
 * Gestion des notifications push dans l'application
 */

import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import notificationService from '../services/notificationService';
import { supabase as supabaseClient } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useNotifications() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    // Configurer les canaux Android
    notificationService.setupAndroidChannel();

    // Obtenir et enregistrer le token si l'utilisateur est connecté
    if (user?.id) {
      registerPushToken();
    }

    // Écouter les notifications reçues (foreground)
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification reçue (foreground):', notification);
        // La notification s'affiche automatiquement
      }
    );

    // Écouter les taps sur les notifications
    responseListener.current = notificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Tap sur notification:', response);
        handleNotificationTap(response.notification);
      }
    );

    // Cleanup
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?.id]);

  /**
   * Enregistrer le token push dans Supabase
   */
  const registerPushToken = async () => {
    try {
      const token = await notificationService.getExpoPushToken();

      if (!token || !user?.id) {
        console.log('❌ Impossible d\'obtenir le token ou pas d\'utilisateur');
        return;
      }

      console.log('💾 Enregistrement du token pour l\'utilisateur:', user.id);

      // Enregistrer le token dans Supabase
      const { error } = await supabaseClient
        .from('users')
        .update({ fcm_token: token })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Erreur lors de l\'enregistrement du token:', error);
      } else {
        console.log('✅ Token FCM enregistré avec succès');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du token:', error);
    }
  };

  /**
   * Gérer le tap sur une notification
   */
  const handleNotificationTap = (notification: Notifications.Notification) => {
    const data = notification.request.content.data as any;

    console.log('🔍 Data de la notification:', data);

    // Navigation selon le type de notification
    if (data.type === 'booking' && data.bookingId) {
      // Navigation vers les détails de la commande
      if (data.isProvider) {
        // Si c'est un prestataire
        navigation.navigate('Contractor', {
          screen: 'Proposals',
          params: {
            screen: 'ProposalDetails',
            params: { bookingId: data.bookingId },
          },
        });
      } else {
        // Si c'est un client
        navigation.navigate('Home', {
          screen: 'BookingDetails',
          params: { bookingId: data.bookingId },
        });
      }
    } else if (data.type === 'message' && data.chatId) {
      // Navigation vers le chat
      navigation.navigate('Home', {
        screen: 'Chat',
        params: {
          chatId: data.chatId,
          providerId: data.providerId,
          providerName: data.providerName || 'Chat',
          providerType: data.providerType || 'client',
        },
      });
    } else if (data.type === 'marketplace_order') {
      // Navigation Marketplace Commandes
      if (data.isSeller) {
        // Prestataire -> Mes Ventes
        navigation.navigate('Contractor', {
          screen: 'ContractorSales',
        });
      } else {
        // Client -> Mes Commandes
        navigation.navigate('Home', {
          screen: 'ClientOrders',
        });
      }
    } else if (data.type === 'marketplace_message') {
      // Navigation Marketplace Chat
      // On passe senderId comme "sellerId" car c'est à lui qu'on va répondre
      navigation.navigate('Home', {
        screen: 'ProductChat',
        params: {
          productId: data.productId,
          sellerId: data.senderId,
        },
      });
    } else if (data.type === 'admin') {
      // Navigation vers une page spécifique selon le message admin
      console.log('📢 Notification admin:', data);
      // TODO: Gérer les notifications admin
    }
  };

  return {
    registerPushToken,
  };
}

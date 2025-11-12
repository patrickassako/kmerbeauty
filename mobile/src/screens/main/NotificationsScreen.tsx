/**
 * NotificationsScreen
 * Écran des notifications pour l'utilisateur
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { typography } from '../../design-system/typography';

interface NotificationsScreenProps {
  navigation: any;
}

interface Notification {
  id: string;
  type: 'booking' | 'promo' | 'reminder' | 'message' | 'review';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  image?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'booking',
      title: 'Réservation confirmée',
      message: 'Votre réservation pour "Deep Tissue French Massage" est confirmée pour demain à 10h00',
      time: 'Il y a 5 min',
      isRead: false,
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    },
    {
      id: '2',
      type: 'promo',
      title: '🎉 Offre spéciale',
      message: 'Profitez de 20% de réduction sur votre prochain massage. Code: RELAX20',
      time: 'Il y a 2h',
      isRead: false,
    },
    {
      id: '3',
      type: 'reminder',
      title: 'Rappel de rendez-vous',
      message: 'N\'oubliez pas votre rendez-vous demain à 10h00 chez Beau Monde Esthétique',
      time: 'Il y a 5h',
      isRead: true,
    },
    {
      id: '4',
      type: 'message',
      title: 'Nouveau message',
      message: 'L\'Essence du Visage Ches vous a envoyé un message',
      time: 'Hier',
      isRead: true,
    },
    {
      id: '5',
      type: 'review',
      title: 'Laissez un avis',
      message: 'Comment s\'est passé votre service "Hair Botox Straight" ?',
      time: 'Il y a 2 jours',
      isRead: true,
    },
    {
      id: '6',
      type: 'booking',
      title: 'Paiement réussi',
      message: 'Votre paiement de 25 000 XAF a été effectué avec succès',
      time: 'Il y a 3 jours',
      isRead: true,
    },
  ]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking':
        return { name: 'calendar', color: colors.success };
      case 'promo':
        return { name: 'gift', color: colors.coral };
      case 'reminder':
        return { name: 'time', color: colors.warning };
      case 'message':
        return { name: 'chatbubble', color: colors.info };
      case 'review':
        return { name: 'star', color: colors.gold };
      default:
        return { name: 'notifications', color: colors.textSecondary };
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, isRead: true })));
  };

  const handleDelete = (notificationId: string) => {
    setNotifications(notifications.filter((notif) => notif.id !== notificationId));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.black} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={handleMarkAllAsRead}
          style={styles.headerButton}
          disabled={unreadCount === 0}
        >
          <Text style={[styles.markAllText, unreadCount === 0 && styles.markAllTextDisabled]}>
            Tout lire
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off" size={64} color={colors.gray300} />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyText}>
              Vos notifications apparaîtront ici
            </Text>
          </View>
        ) : (
          <>
            {notifications.map((notification, index) => {
              const icon = getNotificationIcon(notification.type);

              return (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    !notification.isRead && styles.notificationCardUnread,
                  ]}
                  onPress={() => {
                    handleMarkAsRead(notification.id);
                    // Navigate based on type
                    if (notification.type === 'booking') {
                      navigation.navigate('Bookings');
                    } else if (notification.type === 'message') {
                      navigation.navigate('Chat');
                    }
                  }}
                >
                  <View style={styles.notificationLeft}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: icon.color + '20' },
                      ]}
                    >
                      <Ionicons name={icon.name as any} size={20} color={icon.color} />
                    </View>

                    {notification.image && (
                      <Image
                        source={{ uri: notification.image }}
                        style={styles.notificationImage}
                      />
                    )}
                  </View>

                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>{notification.time}</Text>
                  </View>

                  {!notification.isRead && <View style={styles.unreadDot} />}

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(notification.id)}
                  >
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerButton: {
    minWidth: 60,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
  },
  badge: {
    backgroundColor: colors.coral,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  markAllText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.coral,
  },
  markAllTextDisabled: {
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationCardUnread: {
    backgroundColor: colors.coral + '05',
    borderColor: colors.coral + '30',
  },
  notificationLeft: {
    marginRight: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationImage: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  notificationMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  notificationTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.coral,
    marginLeft: spacing.sm,
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default NotificationsScreen;

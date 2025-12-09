import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { getFullName, getUserInitials } from '../../utils/userHelpers';
import { chatApi, type Chat } from '../../services/api';

export const ConversationsScreen = () => {
  const { normalizeFontSize, spacing } = useResponsive();
  const { user } = useAuth();
  const { language } = useI18n();
  const navigation = useNavigation<any>();

  const [conversations, setConversations] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reload conversations when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadConversations();
    }, [user?.id])
  );

  const loadConversations = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const chats = await chatApi.getUserChats(user.id);
      setConversations(chats);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleConversationPress = (chat: Chat) => {
    const otherUser = chat.other_user;

    // Navigate to chat with proper parameters
    if (chat.booking_id) {
      // Chat from a booking
      navigation.navigate('ConversationDetails', {
        bookingId: chat.booking_id,
        providerId: otherUser?.id,
        providerName: getFullName(otherUser),
        providerType: 'therapist',
        providerImage: otherUser?.avatar,
      });
    } else {
      // Direct chat - pass chatId to load existing conversation
      navigation.navigate('ConversationDetails', {
        chatId: chat.id,
        providerId: otherUser?.id,
        providerName: getFullName(otherUser),
        providerType: chat.other_user_type === 'provider' ? 'therapist' : 'client',
        providerImage: otherUser?.avatar,
      });
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
        <Text style={[styles.title, { fontSize: normalizeFontSize(24) }]}>Messages</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={{ padding: spacing(4), alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#2D2D2D" />
          </View>
        ) : conversations.length === 0 ? (
          <View style={{ padding: spacing(4), alignItems: 'center' }}>
            <Text style={{ fontSize: normalizeFontSize(16), color: '#999' }}>
              No conversations yet
            </Text>
          </View>
        ) : (
          <View style={{ padding: spacing(2) }}>
            {conversations.map((chat) => {
              const otherUser = chat.other_user;
              return (
                <TouchableOpacity
                  key={chat.id}
                  onPress={() => handleConversationPress(chat)}
                  style={[
                    styles.conversationCard,
                    {
                      padding: spacing(2),
                      marginBottom: spacing(1.5),
                      borderRadius: spacing(1.5),
                    },
                  ]}
                >
                  <View style={styles.conversationContent}>
                    <View
                      style={[
                        styles.avatar,
                        { width: spacing(6), height: spacing(6), borderRadius: spacing(3) },
                      ]}
                    >
                      {otherUser?.avatar ? (
                        <Image
                          source={{ uri: otherUser.avatar }}
                          style={{ width: '100%', height: '100%', borderRadius: spacing(3) }}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={{ fontSize: normalizeFontSize(20), color: '#FFF' }}>
                            {getUserInitials(otherUser)}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flex: 1, marginLeft: spacing(1.5) }}>
                      <View style={styles.headerRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <Text style={[styles.userName, { fontSize: normalizeFontSize(16) }]}>
                            {getFullName(otherUser)}
                          </Text>
                          {/* Badge pour chat de commande */}
                          {chat.booking_id && (
                            <View style={[styles.bookingBadge, { marginLeft: spacing(1), paddingHorizontal: spacing(1), paddingVertical: spacing(0.3) }]}>
                              <Text style={[styles.bookingBadgeText, { fontSize: normalizeFontSize(10) }]}>
                                📋 {language === 'fr' ? 'Commande' : 'Order'}
                              </Text>
                            </View>
                          )}
                        </View>
                        {chat.last_message_at && (
                          <Text style={[styles.time, { fontSize: normalizeFontSize(12) }]}>
                            {formatTime(chat.last_message_at)}
                          </Text>
                        )}
                      </View>
                      {chat.last_message && (
                        <Text
                          style={[styles.lastMessage, { fontSize: normalizeFontSize(14) }]}
                          numberOfLines={1}
                        >
                          {chat.last_message}
                        </Text>
                      )}
                    </View>

                    {chat.unread_count && chat.unread_count > 0 ? (
                      <View
                        style={[
                          styles.unreadBadge,
                          {
                            width: spacing(2.5),
                            height: spacing(2.5),
                            borderRadius: spacing(1.25),
                          },
                        ]}
                      >
                        <Text style={[styles.unreadText, { fontSize: normalizeFontSize(11) }]}>
                          {chat.unread_count}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  conversationCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#DDD',
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  time: {
    color: '#999',
  },
  lastMessage: {
    color: '#666',
  },
  bookingBadge: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  bookingBadgeText: {
    color: '#F57C00',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

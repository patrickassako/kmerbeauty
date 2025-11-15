import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';
import { getFullName, getUserInitials } from '../../utils/userHelpers';

interface Conversation {
  id: string;
  user: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    profile_picture?: string;
  };
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

export const ConversationsScreen = () => {
  const { normalizeFontSize, spacing } = useResponsive();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: Load conversations from API
    setLoading(false);
  }, []);

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('Chat', { userId: conversation.user.id });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
        <Text style={[styles.title, { fontSize: normalizeFontSize(24) }]}>Messages</Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
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
            {conversations.map((conversation) => (
              <TouchableOpacity
                key={conversation.id}
                onPress={() => handleConversationPress(conversation)}
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
                    {conversation.user.profile_picture ? (
                      <Image
                        source={{ uri: conversation.user.profile_picture }}
                        style={{ width: '100%', height: '100%', borderRadius: spacing(3) }}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={{ fontSize: normalizeFontSize(20), color: '#FFF' }}>
                          {getUserInitials(conversation.user)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1, marginLeft: spacing(1.5) }}>
                    <View style={styles.headerRow}>
                      <Text style={[styles.userName, { fontSize: normalizeFontSize(16) }]}>
                        {getFullName(conversation.user)}
                      </Text>
                      {conversation.last_message_time && (
                        <Text style={[styles.time, { fontSize: normalizeFontSize(12) }]}>
                          {conversation.last_message_time}
                        </Text>
                      )}
                    </View>
                    {conversation.last_message && (
                      <Text
                        style={[styles.lastMessage, { fontSize: normalizeFontSize(14) }]}
                        numberOfLines={1}
                      >
                        {conversation.last_message}
                      </Text>
                    )}
                  </View>

                  {conversation.unread_count && conversation.unread_count > 0 ? (
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
                        {conversation.unread_count}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
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

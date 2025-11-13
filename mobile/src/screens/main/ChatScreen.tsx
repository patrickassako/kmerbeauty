import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { chatApi, type ChatMessage, type Chat } from '../../services/api';

type ChatRouteProp = RouteProp<HomeStackParamList, 'Chat'>;
type ChatNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Chat'>;

export const ChatScreen: React.FC = () => {
  const route = useRoute<ChatRouteProp>();
  const navigation = useNavigation<ChatNavigationProp>();
  const { bookingId, providerId, providerName, providerType } = route.params;

  const { normalizeFontSize, spacing } = useResponsive();
  const { language } = useI18n();
  const { user } = useAuth();

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeChat();

    // Cleanup polling on unmount
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  const initializeChat = async () => {
    try {
      setLoading(true);
      // Get or create chat for this booking
      const chatData = await chatApi.getOrCreateChatByBooking(bookingId);
      setChat(chatData);

      // Load messages
      await loadMessages(chatData.id);

      // Setup polling for new messages (every 3 seconds)
      pollingInterval.current = setInterval(() => {
        loadMessages(chatData.id, true);
      }, 3000);
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string, silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      const msgs = await chatApi.getMessages(chatId);
      setMessages(msgs);

      // Mark unread messages as read
      const unreadMessages = msgs.filter(
        (msg) => !msg.is_read && msg.sender_id !== user?.id
      );
      for (const msg of unreadMessages) {
        await chatApi.markAsRead(msg.id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user?.id || !chat?.id) return;

    try {
      setSending(true);

      // Send message via API
      const message = await chatApi.sendMessage(chat.id, {
        sender_id: user.id,
        content: newMessage.trim(),
        type: 'TEXT',
      });

      // Add message to local state
      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.sender_id === user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              maxWidth: '80%',
              padding: spacing(1.5),
              borderRadius: spacing(2),
            },
            isMyMessage ? styles.myMessage : styles.otherMessage,
          ]}
        >
          <Text style={[
            styles.messageText,
            { fontSize: normalizeFontSize(14), lineHeight: normalizeFontSize(20) },
            isMyMessage ? styles.myMessageText : styles.otherMessageText,
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            { fontSize: normalizeFontSize(11), marginTop: spacing(0.5) },
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
          ]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing(2.5), paddingTop: spacing(6), paddingBottom: spacing(2) }]}>
        <TouchableOpacity
          style={[styles.backButton, { width: spacing(5), height: spacing(5), borderRadius: spacing(2.5) }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { fontSize: normalizeFontSize(24) }]}>←</Text>
        </TouchableOpacity>

        <View style={[styles.headerCenter, { flex: 1, marginHorizontal: spacing(2) }]}>
          <Text style={[styles.headerTitle, { fontSize: normalizeFontSize(18) }]} numberOfLines={1}>
            {providerName}
          </Text>
          <Text style={[styles.headerSubtitle, { fontSize: normalizeFontSize(12), marginTop: spacing(0.3) }]}>
            {language === 'fr' ? 'En ligne' : 'Online'}
          </Text>
        </View>

        <View style={{ width: spacing(5) }} />
      </View>

      {/* Messages List */}
      {loading ? (
        <View style={[styles.centerContent, { flex: 1 }]}>
          <ActivityIndicator size="large" color="#2D2D2D" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{
            paddingHorizontal: spacing(2),
            paddingVertical: spacing(2),
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View style={[styles.centerContent, { flex: 1 }]}>
              <Text style={[styles.emptyText, { fontSize: normalizeFontSize(14) }]}>
                {language === 'fr'
                  ? 'Aucun message. Commencez la conversation!'
                  : 'No messages. Start the conversation!'}
              </Text>
            </View>
          }
        />
      )}

      {/* Input Area */}
      <View style={[styles.inputContainer, { padding: spacing(2), borderTopWidth: 1, borderTopColor: '#E0E0E0' }]}>
        <TextInput
          style={[
            styles.input,
            {
              flex: 1,
              padding: spacing(1.5),
              borderRadius: spacing(3),
              fontSize: normalizeFontSize(14),
              marginRight: spacing(1.5),
            },
          ]}
          placeholder={language === 'fr' ? 'Tapez votre message...' : 'Type your message...'}
          placeholderTextColor="#999"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              width: spacing(6),
              height: spacing(6),
              borderRadius: spacing(3),
            },
            !newMessage.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.sendIcon, { fontSize: normalizeFontSize(20) }]}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#2D2D2D',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#4CAF50',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 12,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {},
  myMessage: {
    backgroundColor: '#2D2D2D',
  },
  otherMessage: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {},
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#2D2D2D',
  },
  messageTime: {
    textAlign: 'right',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#2D2D2D',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendIcon: {
    color: '#FFFFFF',
  },
});

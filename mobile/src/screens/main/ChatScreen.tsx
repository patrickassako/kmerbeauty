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
  Image,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { chatApi, type ChatMessage, type Chat, type ChatOffer } from '../../services/api';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { OfferMessage } from '../../components/chat/OfferMessage';
import { CreateOfferModal } from '../../components/chat/CreateOfferModal';
import { supabase } from '../../lib/supabase';

type ChatRouteProp = RouteProp<HomeStackParamList, 'Chat'>;
type ChatNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Chat'>;

export const ChatScreen: React.FC = () => {
  const route = useRoute<ChatRouteProp>();
  const navigation = useNavigation<ChatNavigationProp>();
  const { bookingId, providerId, providerName, providerType, providerImage } = route.params;

  const { normalizeFontSize, spacing } = useResponsive();
  const { language } = useI18n();
  const { user } = useAuth();

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [offers, setOffers] = useState<ChatOffer[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Voice recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Offer modal state
  const [showOfferModal, setShowOfferModal] = useState(false);

  // Check if user is provider
  const isProvider = user?.role === 'PROVIDER';

  const flatListRef = useRef<FlatList>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeChat();

    // Request permissions
    requestPermissions();

    // Cleanup polling on unmount
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
      await Audio.requestPermissionsAsync();
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const initializeChat = async () => {
    try {
      setLoading(true);
      let chatData;

      if (bookingId) {
        chatData = await chatApi.getOrCreateChatByBooking(bookingId);
      } else {
        if (!user?.id) {
          throw new Error('User not authenticated');
        }
        chatData = await chatApi.getOrCreateDirectChat(user.id, providerId, providerType);
      }

      setChat(chatData);

      // Load messages and offers
      await Promise.all([
        loadMessages(chatData.id),
        loadOffers(chatData.id),
      ]);

      // Setup polling for new messages (every 3 seconds)
      pollingInterval.current = setInterval(() => {
        loadMessages(chatData.id, true);
        loadOffers(chatData.id, true);
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

  const loadOffers = async (chatId: string, silent: boolean = false) => {
    try {
      const chatOffers = await chatApi.getChatOffers(chatId);
      setOffers(chatOffers);
    } catch (error) {
      console.error('Error loading offers:', error);
    }
  };

  // Upload file to Supabase Storage
  const uploadFile = async (uri: string, bucket: string, fileName: string): Promise<string | null> => {
    try {
      // Read file as base64
      const fileData = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Get file extension
      const ext = uri.split('.').pop() || 'jpg';
      const contentType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
                         ext === 'png' ? 'image/png' :
                         ext === 'm4a' || ext === 'mp3' ? 'audio/mpeg' : 'application/octet-stream';

      // Convert base64 to blob
      const blob = await (await fetch(`data:${contentType};base64,${fileData}`)).blob();

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, {
          contentType,
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user?.id || !chat?.id) return;

    try {
      setSending(true);

      const message = await chatApi.sendMessage(chat.id, {
        sender_id: user.id,
        content: newMessage.trim(),
        type: 'TEXT',
        reply_to_message_id: replyingTo?.id,
      });

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      setReplyingTo(null);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && chat?.id && user?.id) {
        setSending(true);

        // Upload image to Supabase Storage
        const fileName = `chat-images/${chat.id}/${Date.now()}.jpg`;
        const imageUrl = await uploadFile(result.assets[0].uri, 'chat-attachments', fileName);

        if (imageUrl) {
          // Send image message
          const message = await chatApi.sendMessage(chat.id, {
            sender_id: user.id,
            content: newMessage.trim() || language === 'fr' ? 'Image' : 'Image',
            type: 'IMAGE',
            attachments: [imageUrl],
            reply_to_message_id: replyingTo?.id,
          });

          setMessages(prev => [...prev, message]);
          setNewMessage('');
          setReplyingTo(null);

          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        } else {
          Alert.alert('Error', 'Failed to upload image');
        }

        setSending(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Update duration every second
      recordingInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording || !chat?.id || !user?.id) return;

    try {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        setSending(true);

        // Upload audio to Supabase Storage
        const fileName = `chat-audio/${chat.id}/${Date.now()}.m4a`;
        const audioUrl = await uploadFile(uri, 'chat-attachments', fileName);

        if (audioUrl) {
          // Send voice message
          const message = await chatApi.sendMessage(chat.id, {
            sender_id: user.id,
            content: language === 'fr' ? 'Message vocal' : 'Voice message',
            type: 'VOICE',
            attachments: [audioUrl],
            duration_seconds: recordingDuration,
            reply_to_message_id: replyingTo?.id,
          });

          setMessages(prev => [...prev, message]);
          setReplyingTo(null);

          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        } else {
          Alert.alert('Error', 'Failed to upload voice message');
        }

        setSending(false);
      }

      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Error stopping recording:', error);
      setRecording(null);
      setRecordingDuration(0);
      setSending(false);
    }
  };

  const cancelRecording = async () => {
    if (recording) {
      await recording.stopAndUnloadAsync();
      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    }
  };

  const handleCreateOffer = async (offerData: {
    service_name: string;
    description: string;
    price: number;
    duration: number;
  }) => {
    if (!chat?.id || !user?.id) return;

    try {
      setSending(true);

      const result = await chatApi.createOffer({
        chat_id: chat.id,
        sender_id: user.id,
        ...offerData,
      });

      // Add message to local state
      setMessages(prev => [...prev, result.message]);
      setOffers(prev => [result.offer, ...prev]);

      setShowOfferModal(false);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error creating offer:', error);
      Alert.alert('Error', 'Failed to create offer');
    } finally {
      setSending(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      await chatApi.respondToOffer(offerId, 'ACCEPTED');

      // Reload offers
      if (chat?.id) {
        await loadOffers(chat.id);
      }

      Alert.alert(
        language === 'fr' ? 'Offre Acceptée' : 'Offer Accepted',
        language === 'fr'
          ? 'Vous avez accepté cette offre. Le prestataire sera notifié.'
          : 'You have accepted this offer. The provider will be notified.'
      );
    } catch (error) {
      console.error('Error accepting offer:', error);
      Alert.alert('Error', 'Failed to accept offer');
    }
  };

  const handleDeclineOffer = async (offerId: string) => {
    try {
      await chatApi.respondToOffer(offerId, 'DECLINED');

      // Reload offers
      if (chat?.id) {
        await loadOffers(chat.id);
      }

      Alert.alert(
        language === 'fr' ? 'Offre Refusée' : 'Offer Declined',
        language === 'fr'
          ? 'Vous avez refusé cette offre.'
          : 'You have declined this offer.'
      );
    } catch (error) {
      console.error('Error declining offer:', error);
      Alert.alert('Error', 'Failed to decline offer');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.sender_id === user?.id;
    const offer = offers.find(o => o.message_id === item.id);

    // Render offer message separately
    if (item.type === 'SERVICE_SUGGESTION') {
      return (
        <OfferMessage
          message={item}
          offer={offer}
          isMyMessage={isMyMessage}
          onAccept={handleAcceptOffer}
          onDecline={handleDeclineOffer}
        />
      );
    }

    return (
      <MessageBubble
        message={item}
        isMyMessage={isMyMessage}
        onReply={(msg) => setReplyingTo(msg)}
      />
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

        {providerImage ? (
          <Image
            source={{ uri: providerImage }}
            style={[styles.providerImage, { width: spacing(6), height: spacing(6), borderRadius: spacing(3), marginLeft: spacing(2) }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.providerImagePlaceholder, { width: spacing(6), height: spacing(6), borderRadius: spacing(3), marginLeft: spacing(2) }]}>
            <Text style={[styles.providerImagePlaceholderText, { fontSize: normalizeFontSize(20) }]}>
              {providerType === 'therapist' ? '👤' : '🏪'}
            </Text>
          </View>
        )}

        <View style={[styles.headerCenter, { flex: 1, marginHorizontal: spacing(2) }]}>
          <Text style={[styles.headerTitle, { fontSize: normalizeFontSize(18) }]} numberOfLines={1}>
            {providerName}
          </Text>
          <Text style={[styles.headerSubtitle, { fontSize: normalizeFontSize(12), marginTop: spacing(0.3) }]}>
            {language === 'fr' ? 'En ligne' : 'Online'}
          </Text>
        </View>

        {/* Offer button (for providers only) */}
        {isProvider && (
          <TouchableOpacity
            style={[styles.offerButton, { width: spacing(5), height: spacing(5), borderRadius: spacing(2.5) }]}
            onPress={() => setShowOfferModal(true)}
          >
            <Text style={[styles.offerButtonIcon, { fontSize: normalizeFontSize(20) }]}>💼</Text>
          </TouchableOpacity>
        )}
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

      {/* Reply indicator */}
      {replyingTo && (
        <View style={[styles.replyingToContainer, { padding: spacing(1.5), borderTopWidth: 1, borderTopColor: '#E0E0E0' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.replyingToLabel, { fontSize: normalizeFontSize(11) }]}>
              {language === 'fr' ? 'Réponse à:' : 'Replying to:'}
            </Text>
            <Text style={[styles.replyingToText, { fontSize: normalizeFontSize(13) }]} numberOfLines={1}>
              {replyingTo.content}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <Text style={[styles.cancelReplyIcon, { fontSize: normalizeFontSize(20) }]}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <View style={[styles.recordingIndicator, { padding: spacing(2), borderTopWidth: 1, borderTopColor: '#E0E0E0' }]}>
          <View style={[styles.recordingDot, { width: spacing(1.5), height: spacing(1.5), borderRadius: spacing(0.75) }]} />
          <Text style={[styles.recordingText, { fontSize: normalizeFontSize(14), marginLeft: spacing(1.5) }]}>
            {language === 'fr' ? 'Enregistrement...' : 'Recording...'} {formatDuration(recordingDuration)}
          </Text>
          <TouchableOpacity
            style={[styles.cancelRecordingButton, { marginLeft: 'auto', paddingHorizontal: spacing(2), paddingVertical: spacing(1), borderRadius: spacing(1.5) }]}
            onPress={cancelRecording}
          >
            <Text style={[styles.cancelRecordingText, { fontSize: normalizeFontSize(12) }]}>
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input Area */}
      <View style={[styles.inputContainer, { padding: spacing(2), borderTopWidth: 1, borderTopColor: '#E0E0E0' }]}>
        {/* Attachment buttons */}
        <TouchableOpacity
          style={[styles.attachButton, { width: spacing(5), height: spacing(5), borderRadius: spacing(2.5), marginRight: spacing(1) }]}
          onPress={handlePickImage}
          disabled={sending || isRecording}
        >
          <Text style={[styles.attachIcon, { fontSize: normalizeFontSize(20) }]}>📷</Text>
        </TouchableOpacity>

        <TextInput
          style={[
            styles.input,
            {
              flex: 1,
              padding: spacing(1.5),
              borderRadius: spacing(3),
              fontSize: normalizeFontSize(14),
              marginRight: spacing(1),
            },
          ]}
          placeholder={language === 'fr' ? 'Tapez votre message...' : 'Type your message...'}
          placeholderTextColor="#999"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
          editable={!isRecording}
        />

        {/* Voice or Send button */}
        {newMessage.trim() ? (
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
        ) : (
          <TouchableOpacity
            style={[
              styles.voiceButton,
              {
                width: spacing(6),
                height: spacing(6),
                borderRadius: spacing(3),
              },
              isRecording && styles.voiceButtonRecording,
            ]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            disabled={sending}
          >
            <Text style={[styles.voiceIcon, { fontSize: normalizeFontSize(20) }]}>
              {isRecording ? '⏹' : '🎤'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Create Offer Modal */}
      <CreateOfferModal
        visible={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        onSubmit={handleCreateOffer}
      />
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
  providerImage: {},
  providerImagePlaceholder: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerImagePlaceholderText: {},
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
  offerButton: {
    backgroundColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerButtonIcon: {
    color: '#FFFFFF',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
  },
  replyingToContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyingToLabel: {
    color: '#666',
    marginBottom: 2,
  },
  replyingToText: {
    color: '#2D2D2D',
  },
  cancelReplyIcon: {
    color: '#666',
    paddingHorizontal: 8,
  },
  recordingIndicator: {
    backgroundColor: '#FFF3E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    backgroundColor: '#F44336',
  },
  recordingText: {
    color: '#E65100',
    flex: 1,
  },
  cancelRecordingButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelRecordingText: {
    color: '#666',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
  },
  attachButton: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachIcon: {},
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
  voiceButton: {
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonRecording: {
    backgroundColor: '#F44336',
  },
  voiceIcon: {
    color: '#FFFFFF',
  },
});

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import type { ChatMessage } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MessageBubbleProps {
  message: ChatMessage;
  isMyMessage: boolean;
  onReply?: (message: ChatMessage) => void;
  onLongPress?: (message: ChatMessage) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMyMessage,
  onReply,
  onLongPress,
}) => {
  const { normalizeFontSize, spacing } = useResponsive();
  const { language } = useI18n();

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const swipeableRef = useRef<Swipeable>(null);

  // Render reply action when swiping
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [0, 50, 100],
      outputRange: [0, 0, 0],
    });

    return (
      <Animated.View
        style={[
          styles.swipeAction,
          {
            transform: [{ translateX: trans }],
            width: spacing(10),
          },
        ]}
      >
        <Text style={[styles.swipeActionText, { fontSize: normalizeFontSize(20) }]}>
          ↩️
        </Text>
      </Animated.View>
    );
  };

  const handleSwipeableOpen = () => {
    if (onReply) {
      onReply(message);
      swipeableRef.current?.close();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playSound = async (uri: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      // Set audio mode to speakerphone for better volume
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing sound:', error);
      setIsPlaying(false);
    }
  };

  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Render different message types
  const renderContent = () => {
    switch (message.type) {
      case 'IMAGE':
        const imageUri = message.attachments?.[0];
        return imageUri ? (
          <TouchableOpacity onPress={() => setSelectedImage(imageUri)}>
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.imageMessage,
                {
                  width: SCREEN_WIDTH * 0.6,
                  height: SCREEN_WIDTH * 0.6,
                  borderRadius: spacing(1.5),
                },
              ]}
              resizeMode="cover"
            />
            {message.content && (
              <Text
                style={[
                  styles.messageText,
                  { fontSize: normalizeFontSize(14), marginTop: spacing(1) },
                  isMyMessage ? styles.myMessageText : styles.otherMessageText,
                ]}
              >
                {message.content}
              </Text>
            )}
          </TouchableOpacity>
        ) : null;

      case 'VOICE':
        const audioUri = message.attachments?.[0];
        return audioUri ? (
          <View style={styles.voiceMessageContainer}>
            <TouchableOpacity
              onPress={() => (isPlaying ? stopSound() : playSound(audioUri))}
              style={[
                styles.playButton,
                {
                  width: spacing(5),
                  height: spacing(5),
                  borderRadius: spacing(2.5),
                  backgroundColor: isMyMessage ? 'rgba(255, 255, 255, 0.3)' : '#F0F0F0', // Better contrast
                },
              ]}
            >
              <MaterialIcons
                name={isPlaying ? "pause" : "play-arrow"}
                size={normalizeFontSize(24)}
                color={isMyMessage ? '#FFFFFF' : '#2D2D2D'}
              />
            </TouchableOpacity>
            <View style={[styles.voiceInfo, { marginLeft: spacing(1.5) }]}>
              <View style={[styles.waveform, { height: spacing(4) }]}>
                {/* Simple waveform visualization */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveformBar,
                      {
                        width: 3,
                        height: spacing(Math.random() * 3 + 1),
                        marginHorizontal: 2,
                      },
                      isMyMessage
                        ? styles.myWaveformBar
                        : styles.otherWaveformBar,
                    ]}
                  />
                ))}
              </View>
              <Text
                style={[
                  styles.durationText,
                  { fontSize: normalizeFontSize(11), marginTop: spacing(0.5) },
                  isMyMessage ? styles.myMessageText : styles.otherMessageText,
                ]}
              >
                {formatDuration(message.duration_seconds)}
              </Text>
            </View>
          </View>
        ) : null;

      case 'SERVICE_SUGGESTION':
        // This is handled by OfferMessage component
        return null;

      case 'SYSTEM':
        return (
          <Text
            style={[
              styles.systemMessageText,
              { fontSize: normalizeFontSize(13), fontStyle: 'italic' },
            ]}
          >
            {message.content}
          </Text>
        );

      default: // TEXT
        return (
          <Text
            style={[
              styles.messageText,
              {
                fontSize: normalizeFontSize(14),
                lineHeight: normalizeFontSize(20),
                flexShrink: 1,
              },
              isMyMessage ? styles.myMessageText : styles.otherMessageText,
            ]}
          >
            {message.content}
          </Text>
        );
    }
  };

  // Don't render SERVICE_SUGGESTION here (handled separately)
  if (message.type === 'SERVICE_SUGGESTION') {
    return null;
  }

  // System messages have different styling
  if (message.type === 'SYSTEM') {
    return (
      <View style={[styles.systemMessageContainer, { marginVertical: spacing(1) }]}>
        <View
          style={[
            styles.systemMessageBubble,
            { paddingHorizontal: spacing(2), paddingVertical: spacing(1), borderRadius: spacing(2) },
          ]}
        >
          {renderContent()}
        </View>
      </View>
    );
  }

  return (
    <>
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <Swipeable
          ref={swipeableRef}
          renderRightActions={onReply ? renderRightActions : undefined}
          onSwipeableOpen={handleSwipeableOpen}
          overshootRight={false}
          rightThreshold={40}
        >
          <TouchableOpacity
            onLongPress={() => onLongPress?.(message)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.messageBubble,
                {
                  maxWidth: message.type === 'IMAGE' ? undefined : SCREEN_WIDTH * 0.75,
                  padding: spacing(1.5),
                  borderRadius: spacing(2),
                  alignSelf: isMyMessage ? 'flex-end' : 'flex-start',
                },
                isMyMessage ? styles.myMessage : styles.otherMessage,
              ]}
            >
              {/* Reply indicator */}
              {message.reply_to_message_id && (
                <View
                  style={[
                    styles.replyIndicator,
                    {
                      padding: spacing(1),
                      marginBottom: spacing(1),
                      borderRadius: spacing(1),
                      borderLeftWidth: 3,
                    },
                    isMyMessage
                      ? styles.myReplyIndicator
                      : styles.otherReplyIndicator,
                  ]}
                >
                  <Text
                    style={[
                      styles.replyText,
                      { fontSize: normalizeFontSize(12) },
                      isMyMessage ? styles.myMessageText : styles.otherMessageText,
                    ]}
                    numberOfLines={2}
                  >
                    {language === 'fr' ? '↩ Réponse à...' : '↩ Reply to...'}
                  </Text>
                </View>
              )}

              {renderContent()}

              <View
                style={[
                  styles.messageFooter,
                  { marginTop: spacing(0.5), flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
                ]}
              >
                <Text
                  style={[
                    styles.messageTime,
                    { fontSize: normalizeFontSize(11) },
                    isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
                  ]}
                >
                  {formatTime(message.created_at)}
                </Text>
                {isMyMessage && (
                  <Text
                    style={[
                      styles.readStatus,
                      { fontSize: normalizeFontSize(11), marginLeft: spacing(0.5) },
                    ]}
                  >
                    {message.is_read ? '✓✓' : '✓'}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Swipeable>
      </View>

      {/* Image Modal */}
      {selectedImage && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedImage(null)}
        >
          <View style={styles.imageModalContainer}>
            <TouchableOpacity
              style={styles.imageModalBackground}
              activeOpacity={1}
              onPress={() => setSelectedImage(null)}
            >
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { top: spacing(6), right: spacing(2), width: spacing(5), height: spacing(5) },
                ]}
                onPress={() => setSelectedImage(null)}
              >
                <Text style={[styles.closeButtonText, { fontSize: normalizeFontSize(24) }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
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
  messageFooter: {},
  messageTime: {},
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#999',
  },
  readStatus: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  replyIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  myReplyIndicator: {
    borderLeftColor: 'rgba(255, 255, 255, 0.5)',
  },
  otherReplyIndicator: {
    borderLeftColor: '#2D2D2D',
    backgroundColor: '#F5F5F5',
  },
  replyText: {
    opacity: 0.8,
  },
  replyButton: {
    alignSelf: 'flex-start',
  },
  replyButtonText: {
    color: '#666',
  },
  imageMessage: {},
  voiceMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 200,
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: '#FFFFFF',
  },
  voiceInfo: {
    flex: 1,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waveformBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  myWaveformBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  otherWaveformBar: {
    backgroundColor: '#2D2D2D',
  },
  durationText: {},
  systemMessageContainer: {
    alignItems: 'center',
  },
  systemMessageBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  systemMessageText: {
    color: '#666',
    textAlign: 'center',
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  imageModalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
  },
  swipeAction: {
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 20,
    borderRadius: 12,
    marginVertical: 4,
  },
  swipeActionText: {
    color: '#FFFFFF',
  },
});

/**
 * OrderCompleteScreen
 * Confirmation de commande avec chat intégré pour communiquer avec le salon
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { shadows } from '../../design-system/shadows';
import { typography } from '../../design-system/typography';

interface OrderCompleteScreenProps {
  navigation: any;
  route: any;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: ServiceSuggestion[];
}

interface ServiceSuggestion {
  id: string;
  name: string;
  price: number;
  duration: number;
  reviews: string;
  image: string;
  servicesCount: number;
}

const OrderCompleteScreen: React.FC<OrderCompleteScreenProps> = ({
  navigation,
  route,
}) => {
  const { bookingId, service, therapist, date, timeSlot, total } = route.params || {};

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello!',
      isUser: false,
      timestamp: new Date(),
    },
    {
      id: '2',
      text: 'Can I have some best service suggestions from your salon?',
      isUser: false,
      timestamp: new Date(),
    },
    {
      id: '3',
      text: 'Sure! Why not, here are some details!',
      isUser: true,
      timestamp: new Date(),
      suggestions: [
        {
          id: '1',
          name: 'Bridal makeover - with nail care',
          price: 1850,
          duration: 2,
          reviews: '360',
          image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
          servicesCount: 3,
        },
        {
          id: '2',
          name: 'Hairdressing with Organic mix cleansing',
          price: 1375,
          duration: 2,
          reviews: '1k',
          image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400',
          servicesCount: 3,
        },
      ],
    },
    {
      id: '4',
      text: 'Thanks!',
      isUser: false,
      timestamp: new Date(),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Auto scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.black} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Order</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          style={styles.headerButton}
        >
          <Ionicons name="close" size={24} color={colors.black} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary Card */}
        <View style={styles.orderSummaryCard}>
          <View style={styles.serviceRow}>
            <Image
              source={{ uri: service?.image || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400' }}
              style={styles.orderServiceImage}
            />
            <View style={styles.orderServiceInfo}>
              <Text style={styles.orderServiceName}>
                {service?.name || 'Deep Tissue French Massage'}
              </Text>
              <View style={styles.orderServiceMeta}>
                <Text style={styles.orderServicePrice}>${service?.price || 1245}</Text>
                <View style={styles.orderServiceDetail}>
                  <Ionicons name="time-outline" size={14} color={colors.white} />
                  <Text style={styles.orderServiceDetailText}>2h</Text>
                </View>
                <View style={styles.orderServiceDetail}>
                  <Ionicons name="star" size={14} color={colors.gold} />
                  <Text style={styles.orderServiceDetailText}>(3.9k)</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.orderFooter}>
            <View style={styles.orderLocation}>
              <Ionicons name="business-outline" size={14} color={colors.white} />
              <Text style={styles.orderLocationText}>Beau Monde Esthétique</Text>
            </View>
            <View style={styles.orderLocation}>
              <Ionicons name="location-outline" size={14} color={colors.white} />
              <Text style={styles.orderLocationText}>251 Rue Saint, Paris</Text>
            </View>
          </View>
        </View>

        {/* Salon Chat Header */}
        <View style={styles.chatHeader}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?img=10' }}
            style={styles.chatAvatar}
          />
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatSalonName}>L'Essence du Visage Ches</Text>
            <View style={styles.onlineStatus}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.chatMoreButton}>
            <Ionicons name="chatbubble-outline" size={24} color={colors.black} />
          </TouchableOpacity>
        </View>

        {/* Chat Messages */}
        <View style={styles.chatContainer}>
          {messages.map((message) => (
            <View key={message.id}>
              <View
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userMessage : styles.otherMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.isUser ? styles.userMessageText : styles.otherMessageText,
                  ]}
                >
                  {message.text}
                </Text>
              </View>

              {/* Service Suggestions */}
              {message.suggestions && (
                <View style={styles.suggestionsContainer}>
                  {message.suggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion.id}
                      style={styles.suggestionCard}
                    >
                      <Image
                        source={{ uri: suggestion.image }}
                        style={styles.suggestionImage}
                      />
                      <View style={styles.suggestionOverlay}>
                        <Text style={styles.suggestionBadge}>
                          Includes {suggestion.servicesCount} services
                        </Text>
                      </View>
                      <View style={styles.suggestionInfo}>
                        <Text style={styles.suggestionName}>{suggestion.name}</Text>
                        <View style={styles.suggestionMeta}>
                          <Text style={styles.suggestionPrice}>${suggestion.price}</Text>
                          <View style={styles.suggestionDetail}>
                            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                            <Text style={styles.suggestionDetailText}>{suggestion.duration}h</Text>
                          </View>
                          <View style={styles.suggestionDetail}>
                            <Ionicons name="star" size={12} color={colors.gold} />
                            <Text style={styles.suggestionDetailText}>({suggestion.reviews})</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Typing Indicator */}
        <View style={styles.typingIndicator}>
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          placeholderTextColor={colors.textSecondary}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Ionicons name="send" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  orderSummaryCard: {
    backgroundColor: colors.charcoal,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  serviceRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  orderServiceImage: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
  },
  orderServiceInfo: {
    flex: 1,
  },
  orderServiceName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  orderServiceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  orderServicePrice: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  orderServiceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderServiceDetailText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
  },
  orderFooter: {
    gap: spacing.sm,
  },
  orderLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  orderLocationText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatSalonName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
    marginBottom: 4,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
  onlineText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  chatMoreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    gap: spacing.md,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.coral,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gray100,
  },
  messageText: {
    fontSize: typography.fontSize.base,
  },
  userMessageText: {
    color: colors.white,
  },
  otherMessageText: {
    color: colors.black,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  suggestionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  suggestionImage: {
    width: '100%',
    height: 120,
  },
  suggestionOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  suggestionBadge: {
    backgroundColor: colors.blackAlpha20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    fontSize: typography.fontSize.xs,
    color: colors.white,
  },
  suggestionInfo: {
    padding: spacing.md,
  },
  suggestionName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
    marginBottom: spacing.sm,
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  suggestionPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.coral,
  },
  suggestionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  suggestionDetailText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.md,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: colors.gray50,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.black,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
});

export default OrderCompleteScreen;

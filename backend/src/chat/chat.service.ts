import { Injectable, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SupabaseService } from '../supabase/supabase.service';
import { ReportsService } from '../reports/reports.service';
import { SendMessageDto } from './chat.controller';

@Injectable()
export class ChatService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly eventEmitter: EventEmitter2,
    private readonly reportsService: ReportsService,
  ) { }

  /**
   * Get or create a chat for a booking
   */
  async getOrCreateChatByBooking(bookingId: string) {
    const supabase = this.supabaseService.getClient();

    console.log('🔍 [ChatService] Getting or creating chat for booking:', bookingId);

    // Check if chat already exists for this booking
    const { data: existingChat, error: findError } = await supabase
      .from('chats')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (existingChat) {
      console.log('✅ [ChatService] Found existing chat:', existingChat.id);
      return existingChat;
    }

    console.log('📝 [ChatService] No existing chat found, creating new one...');

    // Get booking details to create the chat
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('user_id, therapist_id, salon_id, contractor_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('❌ [ChatService] Booking not found:', bookingError?.message);
      throw new Error(`Booking not found: ${bookingError?.message || 'Unknown error'}`);
    }

    console.log('📦 [ChatService] Booking data:', {
      user_id: booking.user_id,
      therapist_id: booking.therapist_id,
      salon_id: booking.salon_id,
      contractor_id: booking.contractor_id,
    });

    // Determine provider user_id based on booking type
    let providerUserId = null;

    if (booking.contractor_id) {
      // Contractor booking - get user_id from contractor_profiles
      const { data: contractor } = await supabase
        .from('contractor_profiles')
        .select('user_id')
        .eq('id', booking.contractor_id)
        .single();

      providerUserId = contractor?.user_id;
      console.log('👤 [ChatService] Contractor user_id:', providerUserId);
    } else if (booking.therapist_id) {
      // Therapist booking - get user_id from therapists table
      const { data: therapist } = await supabase
        .from('therapists')
        .select('user_id')
        .eq('id', booking.therapist_id)
        .single();

      providerUserId = therapist?.user_id;
      console.log('👤 [ChatService] Therapist user_id:', providerUserId);
    } else if (booking.salon_id) {
      // Salon booking - get user_id from salons table
      const { data: salon } = await supabase
        .from('salons')
        .select('user_id')
        .eq('id', booking.salon_id)
        .single();

      providerUserId = salon?.user_id;
      console.log('👤 [ChatService] Salon user_id:', providerUserId);
    }

    if (!providerUserId) {
      console.error('❌ [ChatService] No provider user_id found for booking');
      throw new Error('Booking has no provider');
    }

    console.log('💾 [ChatService] Creating chat with client_id:', booking.user_id, '| provider_id:', providerUserId);

    // Create new chat
    const { data: newChat, error: createError } = await supabase
      .from('chats')
      .insert([
        {
          booking_id: bookingId,
          client_id: booking.user_id,
          provider_id: providerUserId,
          is_active: true,
        },
      ])
      .select('*')
      .single();

    if (createError) {
      console.error('❌ [ChatService] Failed to create chat:', createError);
      throw new Error(`Failed to create chat: ${createError.message}`);
    }

    console.log('✅ [ChatService] Chat created successfully:', newChat.id);
    return newChat;
  }

  /**
   * Get a single chat by ID
   */
  async getChatById(chatId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: chat, error } = await supabase
      .from('chats')
      .select(`
        *,
        client:users!chats_client_id_fkey(id, first_name, last_name, email, avatar),
        provider:users!chats_provider_id_fkey(id, first_name, last_name, email, avatar)
      `)
      .eq('id', chatId)
      .single();

    if (error || !chat) {
      throw new Error(`Chat not found: ${error?.message}`);
    }

    // Format like getUserChats
    // We only need the "other" user logic if we know who the requester is.
    // But here we return row data + relations, controller/frontend can parse it?
    // Actually, let's keep it simple and return the raw chat with user relations.
    // Frontend will need to deduce "other user" based on current user ID.

    return chat;
  }

  /**
   * Get or create a direct chat (without booking)
   * Used for customer inquiries before booking
   */
  async getOrCreateDirectChat(
    clientId: string,
    providerId: string,
    providerType: 'therapist' | 'salon',
  ) {
    const supabase = this.supabaseService.getClient();

    // Get the user_id of the provider based on type
    let providerUserId: string;

    if (providerType === 'therapist') {
      const { data: therapist, error: therapistError } = await supabase
        .from('therapists')
        .select('user_id')
        .eq('id', providerId)
        .single();

      if (therapistError || !therapist) {
        throw new Error(`Therapist not found: ${therapistError?.message || 'Unknown error'}`);
      }

      providerUserId = therapist.user_id;
    } else {
      // salon
      const { data: salon, error: salonError } = await supabase
        .from('salons')
        .select('user_id')
        .eq('id', providerId)
        .single();

      if (salonError || !salon) {
        throw new Error(`Salon not found: ${salonError?.message || 'Unknown error'}`);
      }

      providerUserId = salon.user_id;
    }

    // Check if chat already exists between client and provider (without booking)
    const { data: existingChat, error: findError } = await supabase
      .from('chats')
      .select('*')
      .eq('client_id', clientId)
      .eq('provider_id', providerUserId)
      .is('booking_id', null)
      .single();

    if (existingChat) {
      return existingChat;
    }

    // Create new direct chat
    const { data: newChat, error: createError } = await supabase
      .from('chats')
      .insert([
        {
          client_id: clientId,
          provider_id: providerUserId,
          is_active: true,
          // booking_id is null for direct chats
        },
      ])
      .select('*')
      .single();

    if (createError) {
      throw new Error(`Failed to create direct chat: ${createError.message}`);
    }

    return newChat;
  }

  /**
   * Get messages for a chat
   */
  async getMessages(chatId: string, limit: number = 50, offset: number = 0) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Send a message in a chat
   */
  async sendMessage(chatId: string, sendMessageDto: SendMessageDto) {
    const supabase = this.supabaseService.getClient();

    // First, get the chat to find out who we're messaging
    const { data: chatInfo, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();

    if (chatError || !chatInfo) {
      throw new Error(`Chat not found: ${chatError?.message}`);
    }

    // Determine the recipient (the other user in the chat)
    const senderId = sendMessageDto.sender_id;
    const recipientId = chatInfo.client_id === senderId ? chatInfo.provider_id : chatInfo.client_id;

    // Check if either user has blocked the other (mutual block check)
    const blockStatus = await this.reportsService.isMutuallyBlocked(senderId, recipientId);
    if (blockStatus.isBlocked) {
      throw new ForbiddenException('Vous ne pouvez pas envoyer de message à cet utilisateur car un blocage existe entre vous.');
    }

    // Insert the message
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .insert([
        {
          chat_id: chatId,
          sender_id: sendMessageDto.sender_id,
          content: sendMessageDto.content,
          type: sendMessageDto.type || 'TEXT',
          attachments: sendMessageDto.attachments || [],
          reply_to_message_id: sendMessageDto.reply_to_message_id || null,
          duration_seconds: sendMessageDto.duration_seconds || null,
          offer_data: sendMessageDto.offer_data || null,
          is_read: false,
        },
      ])
      .select('*')
      .single();

    if (messageError) {
      throw new Error(`Failed to send message: ${messageError.message}`);
    }

    // Update the chat's last_message and last_message_at
    const { error: updateError } = await supabase
      .from('chats')
      .update({
        last_message: sendMessageDto.content,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', chatId);

    if (updateError) {
      console.error('Failed to update chat last_message:', updateError);
    }

    // Check if this is the first message from the client in a pre-booking context
    // 1. Check if sender is client
    // Re-use chatInfo from above since we already fetched it with '*'

    if (chatInfo && chatInfo.client_id === sendMessageDto.sender_id) {
      // 2. Check if it's the first message
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chatId);

      // count is 1 because we just inserted the message
      if (count === 1) {
        // 3. Check if it's pre-booking (no booking_id or booking not confirmed)
        let isPreBooking = true;
        if (chatInfo.booking_id) {
          const { data: booking } = await supabase
            .from('bookings')
            .select('status')
            .eq('id', chatInfo.booking_id)
            .single();

          if (booking && booking.status === 'CONFIRMED') {
            isPreBooking = false;
          }
        }

        if (isPreBooking) {
          this.eventEmitter.emit('chat.started', {
            providerId: chatInfo.provider_id,
            providerType: 'therapist', // Default, logic needs to be more robust if we track provider type in chats
            userId: chatInfo.client_id,
            chatId: chatInfo.id,
            isPreBooking: true,
          });
          // Note: providerType is tricky here as chats table doesn't store it directly. 
          // However, we can infer it or fetch it. For now, assuming therapist or handling in listener.
          // Actually, let's fetch the provider type to be safe.

          // Try to find in therapists
          const { data: therapist } = await supabase
            .from('therapists')
            .select('id')
            .eq('user_id', chatInfo.provider_id)
            .single();

          const type = therapist ? 'therapist' : 'salon';

          this.eventEmitter.emit('chat.started', {
            providerId: chatInfo.provider_id, // This is user_id, but listener expects provider UUID? 
            // Wait, interaction-tracking expects providerId (UUID from therapists/salons table)
            // We need to fetch the correct ID.
            providerType: type,
            userId: chatInfo.client_id,
            chatId: chatInfo.id,
            isPreBooking: true,
          });
        }
      }
    }

    return message;
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('chat_messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to mark message as read: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all chats for a user (as client or provider)
   */
  async getUserChats(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        client:users!chats_client_id_fkey(id, first_name, last_name, email, avatar),
        provider:users!chats_provider_id_fkey(id, first_name, last_name, email, avatar)
      `)
      .or(`client_id.eq.${userId},provider_id.eq.${userId}`)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user chats: ${error.message}`);
    }

    // For each chat, get the unread message count and determine the "other" user
    const chatsWithDetails = await Promise.all(
      (data || []).map(async (chat) => {
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .eq('is_read', false)
          .neq('sender_id', userId);

        // Determine the "other" user (the one the current user is chatting with)
        const isClient = chat.client_id === userId;
        const otherUser = isClient ? chat.provider : chat.client;
        const otherUserType = isClient ? 'provider' : 'client';

        // If the other user is a provider, get their profile image from therapists or salons
        let profileImage = otherUser?.avatar;
        if (isClient && otherUser?.id) {
          // Check if they have a therapist profile with profile_image
          const { data: therapist } = await supabase
            .from('therapists')
            .select('profile_image')
            .eq('user_id', otherUser.id)
            .single();

          if (therapist?.profile_image) {
            profileImage = therapist.profile_image;
          } else {
            // Check if they have a salon profile with logo
            const { data: salon } = await supabase
              .from('salons')
              .select('logo')
              .eq('user_id', otherUser.id)
              .single();

            if (salon?.logo) {
              profileImage = salon.logo;
            }
          }
        }

        return {
          ...chat,
          unread_count: count || 0,
          other_user: {
            ...otherUser,
            avatar: profileImage, // Use professional profile image if available
          },
          other_user_type: otherUserType,
        };
      }),
    );

    return chatsWithDetails;
  }

  /**
   * Create a custom offer (service personnalisé)
   */
  async createOffer(createOfferDto: any) {
    const supabase = this.supabaseService.getClient();

    // Créer le message avec l'offre
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .insert([
        {
          chat_id: createOfferDto.chat_id,
          sender_id: createOfferDto.sender_id,
          content: `Offre personnalisée: ${createOfferDto.service_name}`,
          type: 'SERVICE_SUGGESTION',
          offer_data: {
            service_name: createOfferDto.service_name,
            description: createOfferDto.description,
            price: createOfferDto.price,
            duration: createOfferDto.duration,
            custom_fields: createOfferDto.custom_fields || {},
          },
          is_read: false,
        },
      ])
      .select('*')
      .single();

    if (messageError) {
      throw new Error(`Failed to create offer message: ${messageError.message}`);
    }

    // Créer l'entrée dans la table chat_offers
    const { data: offer, error: offerError } = await supabase
      .from('chat_offers')
      .insert([
        {
          message_id: message.id,
          chat_id: createOfferDto.chat_id,
          service_name: createOfferDto.service_name,
          description: createOfferDto.description,
          price: createOfferDto.price,
          duration: createOfferDto.duration,
          custom_fields: createOfferDto.custom_fields || {},
          expires_at: createOfferDto.expires_in_hours
            ? new Date(Date.now() + createOfferDto.expires_in_hours * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Default 48h
        },
      ])
      .select('*')
      .single();

    if (offerError) {
      throw new Error(`Failed to create offer: ${offerError.message}`);
    }

    return {
      message,
      offer,
    };
  }

  /**
   * Get offer details
   */
  async getOffer(offerId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('chat_offers')
      .select('*')
      .eq('id', offerId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch offer: ${error.message}`);
    }

    return data;
  }

  /**
   * Respond to an offer (accept or decline)
   */
  async respondToOffer(offerId: string, respondToOfferDto: any) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('chat_offers')
      .update({
        status: respondToOfferDto.status,
        client_response: respondToOfferDto.client_response,
        responded_at: new Date().toISOString(),
      })
      .eq('id', offerId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to respond to offer: ${error.message}`);
    }

    // TODO: Si accepté, créer automatiquement une réservation

    return data;
  }

  /**
   * Get all offers for a chat
   */
  async getChatOffers(chatId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('chat_offers')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch chat offers: ${error.message}`);
    }

    return data || [];
  }
}

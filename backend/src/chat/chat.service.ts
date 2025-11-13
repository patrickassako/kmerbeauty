import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SendMessageDto } from './chat.controller';

@Injectable()
export class ChatService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get or create a chat for a booking
   */
  async getOrCreateChatByBooking(bookingId: string) {
    const supabase = this.supabaseService.getClient();

    // Check if chat already exists for this booking
    const { data: existingChat, error: findError } = await supabase
      .from('chats')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (existingChat) {
      return existingChat;
    }

    // Get booking details to create the chat
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('user_id, therapist_id, salon_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Booking not found: ${bookingError?.message || 'Unknown error'}`);
    }

    // Determine provider_id (therapist or salon)
    const providerId = booking.therapist_id || booking.salon_id;
    if (!providerId) {
      throw new Error('Booking has no provider');
    }

    // Create new chat
    const { data: newChat, error: createError } = await supabase
      .from('chats')
      .insert([
        {
          booking_id: bookingId,
          client_id: booking.user_id,
          provider_id: providerId,
          is_active: true,
        },
      ])
      .select('*')
      .single();

    if (createError) {
      throw new Error(`Failed to create chat: ${createError.message}`);
    }

    return newChat;
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
      .select('*')
      .or(`client_id.eq.${userId},provider_id.eq.${userId}`)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user chats: ${error.message}`);
    }

    // For each chat, get the unread message count
    const chatsWithUnread = await Promise.all(
      (data || []).map(async (chat) => {
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .eq('is_read', false)
          .neq('sender_id', userId);

        return {
          ...chat,
          unread_count: count || 0,
        };
      }),
    );

    return chatsWithUnread;
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

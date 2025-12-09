import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ChatService } from './chat.service';

export interface SendMessageDto {
  sender_id: string;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'VOICE' | 'SERVICE_SUGGESTION' | 'SYSTEM';
  attachments?: string[];
  reply_to_message_id?: string;
  duration_seconds?: number; // Pour les messages vocaux
  offer_data?: {
    service_name: string;
    description?: string;
    price: number;
    duration: number; // minutes
    custom_fields?: Record<string, any>;
  };
}

export interface CreateOfferDto {
  chat_id: string;
  sender_id: string;
  service_name: string;
  description?: string;
  price: number;
  duration: number;
  custom_fields?: Record<string, any>;
  expires_in_hours?: number;
}

export interface RespondToOfferDto {
  status: 'ACCEPTED' | 'DECLINED';
  client_response?: string;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  /**
   * Get or create a chat for a booking
   */
  @Get('booking/:bookingId')
  async getOrCreateChatByBooking(@Param('bookingId') bookingId: string) {
    return this.chatService.getOrCreateChatByBooking(bookingId);
  }

  /**
   * Get a specific chat by ID
   */
  @Get('details/:chatId')
  async getChatById(@Param('chatId') chatId: string) {
    return this.chatService.getChatById(chatId);
  }

  /**
   * Get or create a direct chat (without booking)
   * POST /chat/direct
   */
  @Post('direct')
  async getOrCreateDirectChat(
    @Body() body: { clientId: string; providerId: string; providerType: 'therapist' | 'salon' },
  ) {
    return this.chatService.getOrCreateDirectChat(
      body.clientId,
      body.providerId,
      body.providerType,
    );
  }

  /**
   * Get messages for a chat
   */
  @Get(':chatId/messages')
  async getMessages(
    @Param('chatId') chatId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    return this.chatService.getMessages(chatId, limitNum, offsetNum);
  }

  /**
   * Send a message in a chat
   */
  @Post(':chatId/messages')
  async sendMessage(
    @Param('chatId') chatId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(chatId, sendMessageDto);
  }

  /**
   * Mark a message as read
   */
  @Patch('messages/:messageId/read')
  async markAsRead(@Param('messageId') messageId: string) {
    return this.chatService.markAsRead(messageId);
  }

  /**
   * Get all chats for a user
   */
  @Get('user/:userId')
  async getUserChats(@Param('userId') userId: string) {
    return this.chatService.getUserChats(userId);
  }

  /**
   * Create a custom offer (service personnalisé)
   * POST /chat/offers
   */
  @Post('offers')
  async createOffer(@Body() createOfferDto: CreateOfferDto) {
    return this.chatService.createOffer(createOfferDto);
  }

  /**
   * Get offer details
   * GET /chat/offers/:offerId
   */
  @Get('offers/:offerId')
  async getOffer(@Param('offerId') offerId: string) {
    return this.chatService.getOffer(offerId);
  }

  /**
   * Respond to an offer (accept or decline)
   * PATCH /chat/offers/:offerId/respond
   */
  @Patch('offers/:offerId/respond')
  async respondToOffer(
    @Param('offerId') offerId: string,
    @Body() respondToOfferDto: RespondToOfferDto,
  ) {
    return this.chatService.respondToOffer(offerId, respondToOfferDto);
  }

  /**
   * Get all offers for a chat
   * GET /chat/:chatId/offers
   */
  @Get(':chatId/offers')
  async getChatOffers(@Param('chatId') chatId: string) {
    return this.chatService.getChatOffers(chatId);
  }
}

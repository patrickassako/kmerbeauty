import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ChatService } from './chat.service';

export interface SendMessageDto {
  sender_id: string;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE';
  attachments?: string[];
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Get or create a chat for a booking
   */
  @Get('booking/:bookingId')
  async getOrCreateChatByBooking(@Param('bookingId') bookingId: string) {
    return this.chatService.getOrCreateChatByBooking(bookingId);
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
}

import {
    Controller,
    Get,
    Put,
    Post,
    Body,
    Param,
    BadRequestException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    /**
     * Get user notification preferences
     */
    @Get('preferences/:userId')
    async getPreferences(@Param('userId') userId: string) {
        return this.notificationsService.getPreferences(userId);
    }

    /**
     * Update user notification preferences
     */
    @Put('preferences/:userId')
    async updatePreferences(
        @Param('userId') userId: string,
        @Body() preferences: any,
    ) {
        return this.notificationsService.updatePreferences(userId, preferences);
    }

    /**
     * Register web push token
     */
    @Post('register-web-push')
    async registerWebPush(@Body() body: { userId: string; token: string }) {
        if (!body.userId || !body.token) {
            throw new BadRequestException('userId and token are required');
        }

        return this.notificationsService.registerWebPushToken(body.userId, body.token);
    }

    /**
     * Send admin announcement (from admin backoffice)
     */
    @Post('admin/announcement')
    async sendAnnouncement(
        @Body()
        body: {
            title: string;
            body: string;
            targetAudience?: 'all' | 'providers' | 'clients';
        },
    ) {
        if (!body.title || !body.body) {
            throw new BadRequestException('title and body are required');
        }

        const result = await this.notificationsService.sendAdminAnnouncement(
            body.title,
            body.body,
            body.targetAudience || 'all',
        );

        return {
            success: true,
            message: `Announcement sent to ${result.sent} users`,
            ...result,
        };
    }

    /**
     * Send test notification to a user
     */
    @Post('test')
    async sendTestNotification(@Body() body: { userId: string }) {
        if (!body.userId) {
            throw new BadRequestException('userId is required');
        }

        const result = await this.notificationsService.sendPushNotification({
            userId: body.userId,
            title: '🔔 Test de notification',
            body: 'Si vous voyez ceci, les notifications fonctionnent correctement !',
            type: 'announcements',
        });

        return {
            success: result,
            message: result ? 'Test notification sent' : 'Failed to send notification',
        };
    }

    /**
     * Get admin announcements history
     */
    @Get('admin/announcements')
    async getAnnouncements() {
        // This would typically be in an admin controller
        // but included here for convenience
        return { message: 'Use Supabase dashboard to view announcements' };
    }
}

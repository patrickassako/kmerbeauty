import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

interface NotificationPayload {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, any>;
    type?: string;
    sound?: string;
    badge?: number;
}

interface BulkNotificationPayload {
    userIds: string[];
    title: string;
    body: string;
    data?: Record<string, any>;
    type?: string;
}

interface NotificationPreferences {
    bookings: boolean;
    messages: boolean;
    reminders: boolean;
    credits: boolean;
    announcements: boolean;
    promotions: boolean;
    marketplace: boolean;
}

const defaultPreferences: NotificationPreferences = {
    bookings: true,
    messages: true,
    reminders: true,
    credits: true,
    announcements: true,
    promotions: true,
    marketplace: true,
};

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

    constructor(private readonly supabaseService: SupabaseService) { }

    /**
     * Get user notification preferences
     */
    async getPreferences(userId: string): Promise<NotificationPreferences> {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('users')
            .select('notification_preferences')
            .eq('id', userId)
            .single();

        if (error || !data) {
            return defaultPreferences;
        }

        return {
            ...defaultPreferences,
            ...data.notification_preferences,
        };
    }

    /**
     * Update user notification preferences
     */
    async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>) {
        const supabase = this.supabaseService.getClient();

        const currentPrefs = await this.getPreferences(userId);
        const newPrefs = { ...currentPrefs, ...preferences };

        const { error } = await supabase
            .from('users')
            .update({ notification_preferences: newPrefs })
            .eq('id', userId);

        if (error) {
            this.logger.error(`Failed to update preferences for ${userId}:`, error);
            throw error;
        }

        return newPrefs;
    }

    /**
     * Check if user has enabled a specific notification type
     */
    async canSendNotification(userId: string, type: string): Promise<boolean> {
        const prefs = await this.getPreferences(userId);
        const typeKey = type as keyof NotificationPreferences;

        if (typeKey in prefs) {
            return prefs[typeKey];
        }

        return true; // Default to true for unknown types
    }

    /**
     * Get user FCM/Expo push token
     */
    async getUserToken(userId: string): Promise<{ pushToken: string | null; webPushToken: string | null }> {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('users')
            .select('fcm_token, web_push_token')
            .eq('id', userId)
            .single();

        if (error || !data) {
            return { pushToken: null, webPushToken: null };
        }

        return {
            pushToken: data.fcm_token,
            webPushToken: data.web_push_token,
        };
    }

    /**
     * Send push notification to a single user
     */
    async sendPushNotification(payload: NotificationPayload): Promise<boolean> {
        const { userId, title, body, data = {}, type, sound = 'default' } = payload;

        // Check user preferences
        if (type) {
            const canSend = await this.canSendNotification(userId, type);
            if (!canSend) {
                this.logger.log(`User ${userId} has disabled ${type} notifications`);
                return false;
            }
        }

        // Get user token
        const { pushToken, webPushToken } = await this.getUserToken(userId);

        if (!pushToken && !webPushToken) {
            this.logger.warn(`No push token for user ${userId}`);
            return false;
        }

        const messages = [];

        // Expo/Mobile push
        if (pushToken) {
            messages.push({
                to: pushToken,
                sound,
                title,
                body,
                data: { ...data, type },
            });
        }

        // Web push (if implemented)
        if (webPushToken) {
            messages.push({
                to: webPushToken,
                sound,
                title,
                body,
                data: { ...data, type },
            });
        }

        return this.sendToExpoPush(messages);
    }

    /**
     * Send notification to multiple users (batch)
     */
    async sendBulkNotification(payload: BulkNotificationPayload): Promise<{ sent: number; failed: number }> {
        const { userIds, title, body, data = {}, type } = payload;

        let sent = 0;
        let failed = 0;

        // Get all user tokens and preferences in batch
        const supabase = this.supabaseService.getClient();
        const { data: users, error } = await supabase
            .from('users')
            .select('id, fcm_token, web_push_token, notification_preferences')
            .in('id', userIds);

        if (error || !users) {
            this.logger.error('Failed to fetch users for bulk notification');
            return { sent: 0, failed: userIds.length };
        }

        const messages: any[] = [];

        for (const user of users) {
            // Check preferences
            if (type) {
                const prefs = user.notification_preferences || defaultPreferences;
                const typeKey = type as keyof NotificationPreferences;
                if (typeKey in prefs && !prefs[typeKey]) {
                    continue;
                }
            }

            if (user.fcm_token) {
                messages.push({
                    to: user.fcm_token,
                    sound: 'default',
                    title,
                    body,
                    data: { ...data, type },
                });
            }

            if (user.web_push_token) {
                messages.push({
                    to: user.web_push_token,
                    sound: 'default',
                    title,
                    body,
                    data: { ...data, type },
                });
            }
        }

        // Send in batches of 100 (Expo limit)
        const batchSize = 100;
        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize);
            const success = await this.sendToExpoPush(batch);
            if (success) {
                sent += batch.length;
            } else {
                failed += batch.length;
            }
        }

        return { sent, failed };
    }

    /**
     * Send admin announcement to all users or specific audience
     */
    async sendAdminAnnouncement(
        title: string,
        body: string,
        targetAudience: 'all' | 'providers' | 'clients' = 'all'
    ): Promise<{ sent: number; failed: number }> {
        const supabase = this.supabaseService.getClient();

        // Save announcement to database
        const { data: announcement, error: insertError } = await supabase
            .from('admin_announcements')
            .insert({
                title,
                body,
                target_audience: targetAudience,
                sent_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (insertError) {
            this.logger.error('Failed to save announcement:', insertError);
        }

        // Get target users
        let query = supabase
            .from('users')
            .select('id')
            .not('fcm_token', 'is', null);

        if (targetAudience === 'providers') {
            query = query.eq('role', 'PROVIDER');
        } else if (targetAudience === 'clients') {
            query = query.eq('role', 'CLIENT');
        }

        const { data: users, error } = await query;

        if (error || !users) {
            return { sent: 0, failed: 0 };
        }

        const userIds = users.map(u => u.id);

        return this.sendBulkNotification({
            userIds,
            title,
            body,
            type: 'announcements',
            data: {
                announcementId: announcement?.id,
            },
        });
    }

    /**
     * Send welcome notification to new user
     */
    async sendWelcomeNotification(userId: string, userName: string) {
        return this.sendPushNotification({
            userId,
            title: '🎉 Bienvenue sur KmerBeauty !',
            body: `Bonjour ${userName} ! Découvrez les meilleurs professionnels de beauté près de chez vous.`,
            type: 'announcements',
            data: {
                type: 'welcome',
            },
        });
    }

    /**
     * Send credit purchase confirmation
     */
    async sendCreditPurchaseNotification(userId: string, credits: number, amount: number) {
        return this.sendPushNotification({
            userId,
            title: '💰 Crédits ajoutés !',
            body: `${credits} crédits ont été ajoutés à votre compte (${amount.toLocaleString()} XAF)`,
            type: 'credits',
            data: {
                type: 'credit_purchase',
                credits,
                amount,
            },
        });
    }

    /**
     * Send booking reminder (24h before)
     */
    async sendBookingReminder(
        userId: string,
        bookingId: string,
        providerName: string,
        dateTime: string
    ) {
        return this.sendPushNotification({
            userId,
            title: '⏰ Rappel de rendez-vous',
            body: `Votre rendez-vous avec ${providerName} est demain à ${dateTime}`,
            type: 'reminders',
            data: {
                type: 'booking_reminder',
                bookingId,
            },
        });
    }

    /**
     * Register web push token for a user
     */
    async registerWebPushToken(userId: string, token: string) {
        const supabase = this.supabaseService.getClient();

        const { error } = await supabase
            .from('users')
            .update({ web_push_token: token })
            .eq('id', userId);

        if (error) {
            this.logger.error(`Failed to register web push token for ${userId}:`, error);
            throw error;
        }

        this.logger.log(`Web push token registered for user ${userId}`);
        return true;
    }

    /**
     * Internal: Send messages to Expo Push API
     */
    private async sendToExpoPush(messages: any[]): Promise<boolean> {
        if (messages.length === 0) return true;

        try {
            const response = await fetch(this.EXPO_PUSH_URL, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messages),
            });

            const result = await response.json();

            if (result.errors) {
                this.logger.error('Expo Push errors:', result.errors);
                return false;
            }

            // Check for individual message errors
            if (result.data) {
                const errors = result.data.filter((r: any) => r.status === 'error');
                if (errors.length > 0) {
                    this.logger.warn(`${errors.length}/${messages.length} messages failed:`, errors);
                }
            }

            this.logger.log(`Successfully sent ${messages.length} push notifications`);
            return true;
        } catch (error) {
            this.logger.error('Failed to send to Expo Push:', error);
            return false;
        }
    }
}

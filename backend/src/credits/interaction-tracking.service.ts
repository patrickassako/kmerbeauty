import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CreditsService } from './credits.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class InteractionTrackingService {
    private readonly logger = new Logger(InteractionTrackingService.name);

    constructor(
        private readonly creditsService: CreditsService,
        private readonly supabaseService: SupabaseService,
    ) { }

    private async getCost(interactionType: string): Promise<number> {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('interaction_costs')
            .select('cost')
            .eq('interaction_type', interactionType)
            .single();

        if (error || !data) {
            this.logger.warn(`Could not fetch cost for ${interactionType}, using default 0`);
            return 0;
        }
        return data.cost;
    }

    async debitCredits(
        providerId: string,
        providerType: 'therapist' | 'salon',
        interactionType: string,
        referenceId: string,
        metadata: any = {}
    ) {
        console.log(`[InteractionTrackingService] Attempting to debit credits for ${providerId} (${providerType}), interaction: ${interactionType}`);
        const supabase = this.supabaseService.getClient();

        // 1. Get interaction cost
        const { data: interaction, error: interactionError } = await supabase
            .from('interaction_costs')
            .select('cost')
            .eq('interaction_type', interactionType)
            .single();

        if (interactionError || !interaction) {
            console.error(`[InteractionTrackingService] Error fetching interaction cost for ${interactionType}:`, interactionError);
            return;
        }

        const cost = interaction.cost;
        console.log(`[InteractionTrackingService] Cost for ${interactionType} is ${cost} credits`);

        // 2. Check provider balance
        const { data: balanceData, error: balanceError } = await supabase
            .from('provider_credits')
            .select('balance, id, total_spent') // Also select total_spent to update it
            .eq('provider_id', providerId)
            .single();

        if (balanceError) {
            console.error(`[InteractionTrackingService] Error fetching balance for ${providerId}:`, balanceError);
            // If no balance record, maybe create one? Or assume 0?
            // For now, just return
            return;
        }

        if (!balanceData || balanceData.balance < cost) {
            console.warn(`[InteractionTrackingService] Insufficient balance for provider ${providerId}. Balance: ${balanceData?.balance}, Cost: ${cost}`);
            // TODO: Emit event for low balance or notify provider?
            return;
        }

        console.log(`[InteractionTrackingService] Provider has sufficient balance (${balanceData.balance}). Proceeding with debit.`);

        // 3. Perform transaction (debit)
        // We should use a transaction (RPC or multiple steps with checks)
        // For MVP, simplistic approach: insert transaction then update balance

        const { error: transactionError } = await supabase
            .from('credit_transactions')
            .insert({
                provider_id: providerId,
                provider_type: providerType,
                amount: -cost, // Debit is negative
                transaction_type: interactionType.toUpperCase(),
                reference_id: referenceId,
                balance_before: balanceData.balance,
                balance_after: balanceData.balance - cost,
                metadata: { ...metadata, description: `Debit for ${interactionType}` }
            });

        if (transactionError) {
            console.error(`[InteractionTrackingService] Error recording transaction:`, transactionError);
            return;
        }

        // 4. Update balance
        const { error: updateError } = await supabase
            .from('provider_credits')
            .update({
                balance: balanceData.balance - cost,
                total_spent: balanceData.total_spent + cost, // Update total_spent
                updated_at: new Date()
            })
            .eq('id', balanceData.id);

        if (updateError) {
            console.error(`[InteractionTrackingService] Error updating balance:`, updateError);
            // This is bad, transaction recorded but balance not updated.
            // In real app, use database function for atomicity.
        } else {
            console.log(`[InteractionTrackingService] Successfully debited ${cost} credits. New balance: ${balanceData.balance - cost}`);
        }
    }

    @OnEvent('profile.viewed')
    async handleProfileView(payload: { providerId: string; providerType: 'therapist' | 'salon'; userId: string }) {
        console.log(`[InteractionTrackingService] profile.viewed event received:`, payload);

        // Per user request: Always debit for profile view, even if already viewed.
        // Removed the check for existing views.

        await this.debitCredits(
            payload.providerId,
            payload.providerType,
            'profile_view',
            payload.userId, // Use userId as reference
            { userId: payload.userId }
        );
    }

    @OnEvent('chat.started')
    async handleChatStarted(payload: {
        providerId: string;
        providerType: 'therapist' | 'salon';
        userId: string;
        chatId: string;
        isPreBooking: boolean;
    }) {
        if (payload.isPreBooking) {
            await this.debitCredits(
                payload.providerId,
                payload.providerType,
                'chat_pre_booking',
                payload.chatId,
                { userId: payload.userId }
            );
        }
    }

    @OnEvent('booking.confirmed')
    async handleBookingConfirmed(payload: {
        providerId: string;
        providerType: 'therapist' | 'salon';
        bookingId: string;
    }) {
        await this.debitCredits(
            payload.providerId,
            payload.providerType,
            'booking_confirmed',
            payload.bookingId
        );
    }

    @OnEvent('review.created')
    async handleReviewCreated(payload: {
        providerId: string;
        providerType: 'therapist' | 'salon';
        reviewId: string;
    }) {
        await this.debitCredits(
            payload.providerId,
            payload.providerType,
            'review_created',
            payload.reviewId
        );
    }

    @OnEvent('favorite.added')
    async handleFavoriteAdded(payload: {
        providerId: string;
        providerType: 'therapist' | 'salon';
        userId: string;
    }) {
        await this.debitCredits(
            payload.providerId,
            payload.providerType,
            'favorite_added',
            payload.userId,
            { userId: payload.userId }
        );
    }
}

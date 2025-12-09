import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreditsService } from './credits.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class MonthlyCreditsService {
    private readonly logger = new Logger(MonthlyCreditsService.name);

    constructor(
        private readonly creditsService: CreditsService,
        private readonly supabaseService: SupabaseService,
    ) { }

    @Cron('0 0 1 * *') // Run at midnight on the 1st of every month
    async handleMonthlyCredits() {
        this.logger.log('Starting monthly credits distribution...');
        const supabase = this.supabaseService.getClient();

        // 1. Get all active providers (therapists and salons)
        // We need to check both tables or have a unified view.
        // For MVP, let's iterate through provider_credits table which should exist for all initialized providers.
        // But provider_credits might not have all providers if they haven't been initialized.
        // Better to query therapists and salons tables.

        // Therapists
        const { data: therapists, error: therapistsError } = await supabase
            .from('therapists')
            .select('id')
            .eq('is_active', true);

        if (therapistsError) {
            this.logger.error(`Failed to fetch therapists: ${therapistsError.message}`);
        } else if (therapists) {
            for (const therapist of therapists) {
                await this.giveMonthlyCredit(therapist.id, 'therapist');
            }
        }

        // Salons
        const { data: salons, error: salonsError } = await supabase
            .from('salons')
            .select('id')
            .eq('is_active', true);

        if (salonsError) {
            this.logger.error(`Failed to fetch salons: ${salonsError.message}`);
        } else if (salons) {
            for (const salon of salons) {
                await this.giveMonthlyCredit(salon.id, 'salon');
            }
        }

        this.logger.log('Monthly credits distribution completed.');
    }

    private async giveMonthlyCredit(providerId: string, providerType: 'therapist' | 'salon') {
        try {
            // Check if already given this month (optional, but good for idempotency if cron runs twice)
            // We can check provider_credits.monthly_credits_last_given
            const balanceData = await this.creditsService.getBalance(providerId, providerType);

            const lastGiven = balanceData.monthly_credits_last_given ? new Date(balanceData.monthly_credits_last_given) : null;
            const now = new Date();

            if (lastGiven && lastGiven.getMonth() === now.getMonth() && lastGiven.getFullYear() === now.getFullYear()) {
                // Already given this month
                return;
            }

            const amount = 5.00;
            const currentBalance = balanceData.balance;
            const newBalance = currentBalance + amount;

            await this.creditsService.recordTransaction({
                providerId,
                providerType,
                amount,
                transactionType: 'MONTHLY_BONUS',
                balanceBefore: currentBalance,
                balanceAfter: newBalance,
            });

            // Update balance and timestamp
            const supabase = this.supabaseService.getClient();
            await supabase
                .from('provider_credits')
                .update({
                    balance: newBalance,
                    total_earned: balanceData.total_earned + amount,
                    monthly_credits_last_given: now.toISOString(),
                })
                .eq('provider_id', providerId)
                .eq('provider_type', providerType);

            this.logger.log(`Given monthly credits to ${providerType} ${providerId}`);
        } catch (error) {
            this.logger.error(`Failed to give monthly credits to ${providerId}: ${error.message}`);
        }
    }
}

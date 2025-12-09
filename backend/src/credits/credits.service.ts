import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CreditsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    async getBalance(providerId: string, providerType: 'therapist' | 'salon') {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('provider_credits')
            .select('*')
            .eq('provider_id', providerId)
            .eq('provider_type', providerType)
            .single();

        if (error && error.code === 'PGRST116') {
            // Not found, create initial record
            return this.initializeCredits(providerId, providerType);
        }

        if (error) {
            throw new Error(`Failed to fetch credits: ${error.message}`);
        }

        return data;
    }

    async initializeCredits(providerId: string, providerType: 'therapist' | 'salon') {
        const supabase = this.supabaseService.getClient();

        const initialData = {
            provider_id: providerId,
            provider_type: providerType,
            balance: 20.00,
            total_earned: 20.00,
            total_spent: 0.00,
            monthly_credits_last_given: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('provider_credits')
            .insert(initialData)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to initialize credits: ${error.message}`);
        }

        // Record initial transaction
        await this.recordTransaction({
            providerId,
            providerType,
            amount: 20.00,
            transactionType: 'INITIAL_BONUS',
            balanceBefore: 0,
            balanceAfter: 20.00,
        });

        return data;
    }

    async recordTransaction(params: {
        providerId: string;
        providerType: 'therapist' | 'salon';
        amount: number;
        transactionType: string;
        referenceId?: string;
        balanceBefore: number;
        balanceAfter: number;
        metadata?: any;
    }) {
        const supabase = this.supabaseService.getClient();

        const { error } = await supabase
            .from('credit_transactions')
            .insert({
                provider_id: params.providerId,
                provider_type: params.providerType,
                amount: params.amount,
                transaction_type: params.transactionType,
                reference_id: params.referenceId,
                balance_before: params.balanceBefore,
                balance_after: params.balanceAfter,
                metadata: params.metadata,
            });

        if (error) {
            console.error('Failed to record transaction:', error);
            // Don't throw here to avoid breaking the main flow if logging fails
        }
    }

    async getTransactions(providerId: string, providerType: 'therapist' | 'salon', page = 1, limit = 20) {
        const supabase = this.supabaseService.getClient();

        // Ensure numbers
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 20;

        const from = (pageNum - 1) * limitNum;
        const to = from + limitNum - 1;

        const { data, error, count } = await supabase
            .from('credit_transactions')
            .select('*', { count: 'exact' })
            .eq('provider_id', providerId)
            .eq('provider_type', providerType)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            throw new Error(`Failed to fetch transactions: ${error.message}`);
        }

        return { data: data || [], count: count || 0 };
    }

    async addCredits(
        providerId: string,
        providerType: 'therapist' | 'salon',
        amount: number,
        reason: string,
        referenceId?: string,
    ) {
        const balanceData = await this.getBalance(providerId, providerType);
        const currentBalance = balanceData.balance;
        const newBalance = currentBalance + amount;

        await this.recordTransaction({
            providerId,
            providerType,
            amount,
            transactionType: reason,
            referenceId,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
        });

        const supabase = this.supabaseService.getClient();
        await supabase
            .from('provider_credits')
            .update({
                balance: newBalance,
                total_earned: balanceData.total_earned + amount,
            })
            .eq('provider_id', providerId)
            .eq('provider_type', providerType);

        return { newBalance };
    }

    async getPacks() {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('credit_packs')
            .select('*')
            .eq('active', true)
            .order('display_order', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch credit packs: ${error.message}`);
        }

        return data || [];
    }
}

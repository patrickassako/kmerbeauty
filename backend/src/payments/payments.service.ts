import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreditsService } from '../credits/credits.service';
import { SupabaseService } from '../supabase/supabase.service';
import axios from 'axios';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    private readonly flutterwavePublicKey: string;
    private readonly flutterwaveSecretKey: string;
    private readonly flutterwaveEncryptionKey: string;
    private readonly flutterwaveSecretHash: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly creditsService: CreditsService,
        private readonly supabaseService: SupabaseService,
    ) {
        this.flutterwavePublicKey = this.configService.get<string>('FLUTTERWAVE_PUBLIC_KEY');
        this.flutterwaveSecretKey = this.configService.get<string>('FLUTTERWAVE_SECRET_KEY');
        this.flutterwaveEncryptionKey = this.configService.get<string>('FLUTTERWAVE_ENCRYPTION_KEY');
        this.flutterwaveSecretHash = this.configService.get<string>('FLUTTERWAVE_SECRET_HASH');
    }

    async initiatePayment(params: {
        amount: number;
        currency: string;
        email: string;
        phoneNumber: string;
        name: string;
        providerId: string;
        providerType: 'therapist' | 'salon';
        packId: string;
        redirectUrl: string;
        paymentMethod?: 'orange_money' | 'mtn_momo' | 'card';
    }) {
        try {
            const txRef = `tx-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

            // Determine payment options based on method
            let paymentOptions = 'card,mobilemoney,ussd';
            let paymentPlan = null;

            if (params.paymentMethod === 'orange_money' || params.paymentMethod === 'mtn_momo') {
                paymentOptions = 'mobilemoney';
                // Flutterwave Mobile Money payload
                const mobileMoneyPayload = {
                    tx_ref: txRef,
                    amount: params.amount,
                    currency: params.currency,
                    network: params.paymentMethod === 'orange_money' ? 'ORANGE' : 'MTN',
                    email: params.email,
                    phone_number: params.phoneNumber,
                    fullname: params.name,
                    meta: {
                        provider_id: params.providerId,
                        provider_type: params.providerType,
                        pack_id: params.packId,
                    },
                };

                const response = await axios.post(
                    'https://api.flutterwave.com/v3/charges?type=mobile_money_franco',
                    mobileMoneyPayload,
                    {
                        headers: {
                            Authorization: `Bearer ${this.flutterwaveSecretKey}`,
                            'Content-Type': 'application/json',
                        },
                    },
                );

                if (response.data.status === 'success') {
                    // Record pending purchase in database
                    const supabase = this.supabaseService.getClient();

                    // Get pack details to store credits amount
                    const { data: pack, error: packError } = await supabase
                        .from('credit_packs')
                        .select('*')
                        .eq('id', params.packId)
                        .single();

                    this.logger.log(`Pack lookup for ${params.packId}: ${pack ? JSON.stringify(pack) : 'NOT FOUND'}`);

                    if (packError) {
                        this.logger.error(`Pack fetch error: ${packError.message}`);
                    }

                    // Use credits from pack, fallback to calculating from price
                    let totalCredits = 0;
                    if (pack) {
                        totalCredits = pack.credits || 0;
                        // If pack has bonus_credits column, add it
                        if ('bonus_credits' in pack && pack.bonus_credits) {
                            totalCredits += pack.bonus_credits;
                        }
                    }

                    this.logger.log(`Total credits to be added: ${totalCredits} (from pack: ${JSON.stringify(pack)})`);

                    await supabase.from('credit_purchases').insert({
                        provider_id: params.providerId,
                        provider_type: params.providerType,
                        pack_id: params.packId,
                        credits_amount: totalCredits,
                        price_paid: params.amount,
                        payment_method: params.paymentMethod,
                        payment_provider: 'flutterwave',
                        flutterwave_transaction_id: response.data.data.id?.toString(),
                        flutterwave_tx_ref: txRef,
                        payment_status: 'pending',
                        payment_data: response.data,
                    });


                    // Return the transaction ID for status checking
                    return {
                        link: null,
                        transactionId: response.data.data.id,
                        status: response.data.data.status,
                        message: 'Veuillez confirmer le paiement sur votre téléphone',
                    };
                } else {
                    throw new Error(response.data.message || 'Failed to initiate mobile money payment');
                }
            } else {
                // Standard card/web payment
                const payload = {
                    tx_ref: txRef,
                    amount: params.amount,
                    currency: params.currency,
                    redirect_url: params.redirectUrl,
                    payment_options: paymentOptions,
                    customer: {
                        email: params.email,
                        phonenumber: params.phoneNumber,
                        name: params.name,
                    },
                    meta: {
                        provider_id: params.providerId,
                        provider_type: params.providerType,
                        pack_id: params.packId,
                    },
                    customizations: {
                        title: 'KmerServices Credits',
                        description: `Purchase of credits pack`,
                        logo: 'https://kmerservices.com/logo.png',
                    },
                };

                const response = await axios.post(
                    'https://api.flutterwave.com/v3/payments',
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${this.flutterwaveSecretKey}`,
                            'Content-Type': 'application/json',
                        },
                    },
                );

                if (response.data.status === 'success') {
                    // Record pending purchase in database
                    const supabase = this.supabaseService.getClient();

                    // Get pack details to store credits amount
                    const { data: pack } = await supabase
                        .from('credit_packs')
                        .select('*')
                        .eq('id', params.packId)
                        .single();

                    let totalCredits = 0;
                    if (pack) {
                        totalCredits = pack.credits || 0;
                        if ('bonus_credits' in pack && pack.bonus_credits) {
                            totalCredits += pack.bonus_credits;
                        }
                    }

                    await supabase.from('credit_purchases').insert({
                        provider_id: params.providerId,
                        provider_type: params.providerType,
                        pack_id: params.packId,
                        credits_amount: totalCredits,
                        price_paid: params.amount,
                        payment_method: 'card',
                        payment_provider: 'flutterwave',
                        flutterwave_tx_ref: txRef,
                        payment_status: 'pending',
                        payment_data: response.data,
                    });

                    return { link: response.data.data.link };
                } else {
                    throw new Error('Failed to initiate payment');
                }
            }
        } catch (error) {
            this.logger.error(`Payment initiation failed: ${error.message}`);
            if (error.response?.data) {
                this.logger.error(`Flutterwave error: ${JSON.stringify(error.response.data)}`);
            }
            throw new Error(`Payment initiation failed: ${error.message}`);
        }
    }

    async verifyPayment(transactionId: string) {
        try {
            const response = await axios.get(
                `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
                {
                    headers: {
                        Authorization: `Bearer ${this.flutterwaveSecretKey}`,
                    },
                },
            );

            const data = response.data.data;

            this.logger.log(`Payment ${transactionId} status from Flutterwave: ${data.status}`);

            if (data.status === 'successful') {
                const txRef = data.tx_ref;
                const amount = data.amount;

                // Verify with database record - search by tx_ref OR by transaction ID
                const supabase = this.supabaseService.getClient();

                // First try to find by flutterwave_tx_ref
                let { data: purchase, error } = await supabase
                    .from('credit_purchases')
                    .select('*')
                    .eq('flutterwave_tx_ref', txRef)
                    .single();

                // If not found by tx_ref, try to find by flutterwave_transaction_id
                if (error || !purchase) {
                    const result = await supabase
                        .from('credit_purchases')
                        .select('*')
                        .eq('flutterwave_transaction_id', transactionId)
                        .single();

                    purchase = result.data;
                    error = result.error;

                    if (error || !purchase) {
                        this.logger.error(`Purchase not found for transaction ${transactionId} or tx_ref ${txRef}`);
                        throw new Error('Purchase record not found');
                    }
                }

                if (purchase.payment_status === 'completed') {
                    return { status: 'already_completed', purchase };
                }

                if (purchase.price_paid !== amount) {
                    this.logger.warn(`Amount mismatch for tx ${txRef}: expected ${purchase.price_paid}, got ${amount}`);
                }

                // Mark as completed
                await supabase
                    .from('credit_purchases')
                    .update({
                        payment_status: 'completed',
                        payment_data: data,
                        completed_at: new Date().toISOString(),
                    })
                    .eq('id', purchase.id);

                // Credit the provider - use credits_amount from purchase record
                if (purchase.credits_amount > 0) {
                    await this.creditsService.addCredits(
                        purchase.provider_id,
                        purchase.provider_type,
                        purchase.credits_amount,
                        'PURCHASE',
                        purchase.id,
                    );

                    this.logger.log(`✅ Credited ${purchase.credits_amount} credits to provider ${purchase.provider_id}`);
                }

                return {
                    status: 'success',
                    purchase,
                    creditsAdded: purchase.credits_amount
                };
            } else if (data.status === 'failed') {
                // Payment actually failed in Flutterwave
                return { status: 'failed', data };
            } else {
                // Payment is still pending or in another state
                return { status: 'pending', data };
            }
        } catch (error) {
            this.logger.error(`Payment verification failed: ${error.message}`);
            throw error;
        }
    }

    // TEST ONLY: Manually complete a payment (simulates successful Flutterwave confirmation)
    async manuallyCompletePayment(transactionId: string) {
        try {
            const supabase = this.supabaseService.getClient();

            // Find purchase by transaction ID
            const { data: purchase, error } = await supabase
                .from('credit_purchases')
                .select('*')
                .eq('flutterwave_transaction_id', transactionId)
                .single();

            if (error || !purchase) {
                throw new Error('Purchase not found');
            }

            if (purchase.payment_status === 'completed') {
                return { status: 'already_completed', purchase };
            }

            // Mark as completed
            await supabase
                .from('credit_purchases')
                .update({
                    payment_status: 'completed',
                    completed_at: new Date().toISOString(),
                })
                .eq('id', purchase.id);

            // Credit the provider
            if (purchase.credits_amount > 0) {
                await this.creditsService.addCredits(
                    purchase.provider_id,
                    purchase.provider_type,
                    purchase.credits_amount,
                    'PURCHASE',
                    purchase.id,
                );

                this.logger.log(`✅ [TEST] Credited ${purchase.credits_amount} credits to provider ${purchase.provider_id}`);
            }

            return {
                status: 'success',
                message: 'Payment manually completed (TEST MODE)',
                purchase,
                creditsAdded: purchase.credits_amount
            };
        } catch (error) {
            this.logger.error(`Manual payment completion failed: ${error.message}`);
            throw error;
        }
    }
}

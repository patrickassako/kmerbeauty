"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { creditsApi, contractorApi } from '@/services/api';
import {
    Loader2,
    CreditCard,
    Wallet,
    History,
    Check,
    AlertCircle,
    ArrowRight,
    Smartphone,
    Plus,
    Minus,
    RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreditPack {
    id: string;
    name: string;
    credits: number;
    price_fcfa: number;
    discount_percentage: number;
    display_order: number;
    active: boolean;
}

interface Transaction {
    id: string;
    amount: number;
    transaction_type: string;
    balance_before: number;
    balance_after: number;
    created_at: string;
    reference_id?: string;
}

type PaymentMethod = 'ORANGE_MONEY' | 'MTN_MOBILE_MONEY' | 'CARD';

export default function CreditsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [packs, setPacks] = useState<CreditPack[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ORANGE_MONEY');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [contractorId, setContractorId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'recharge' | 'history'>('recharge');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/login?redirect=/pro/credits');
                return;
            }

            // Get contractor profile
            const profile = await contractorApi.getProfileByUserId(session.user.id);
            if (!profile) {
                router.push('/pro/register');
                return;
            }

            setContractorId(profile.id);

            // Load credits data
            const [balanceData, packsData] = await Promise.all([
                creditsApi.getBalance(profile.id, 'therapist'),
                creditsApi.getPacks(),
            ]);

            setBalance(balanceData?.balance || 0);
            setPacks(packsData || []);

            // Load transactions
            try {
                const transData = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/credits/transactions/${profile.id}?type=therapist`,
                    {
                        headers: {
                            'Authorization': `Bearer ${session.access_token}`,
                        },
                    }
                );
                const trans = await transData.json();
                setTransactions(trans.data || []);
            } catch (e) {
                console.error('Failed to load transactions:', e);
            }

        } catch (error) {
            console.error('Error loading credits:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPack = (pack: CreditPack) => {
        setSelectedPack(pack);
        setShowPaymentModal(true);
    };

    const handlePayment = async () => {
        if (!selectedPack || !contractorId) return;

        if ((paymentMethod === 'ORANGE_MONEY' || paymentMethod === 'MTN_MOBILE_MONEY') && !phoneNumber) {
            alert('Veuillez entrer votre numéro de téléphone');
            return;
        }

        setProcessing(true);

        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const { data: { user } } = await supabase.auth.getUser();

            if (!session || !user) {
                alert('Veuillez vous reconnecter');
                return;
            }

            // Get user profile for name
            const { data: profile } = await supabase
                .from('users')
                .select('first_name, last_name, phone')
                .eq('id', user.id)
                .single();

            const paymentMethodMap: Record<PaymentMethod, string> = {
                'ORANGE_MONEY': 'orange_money',
                'MTN_MOBILE_MONEY': 'mtn_momo',
                'CARD': 'card'
            };

            const paymentData = {
                amount: selectedPack.price_fcfa,
                currency: 'XAF',
                email: user.email,
                phoneNumber: phoneNumber || profile?.phone || '',
                name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Client',
                providerId: contractorId,
                providerType: 'therapist',
                packId: selectedPack.id,
                redirectUrl: `${window.location.origin}/pro/credits?payment=success`,
                paymentMethod: paymentMethodMap[paymentMethod],
            };

            console.log('📤 Initiating payment:', paymentData);

            // Call backend to initiate payment
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(paymentData),
            });

            const result = await response.json();
            console.log('📥 Payment response:', result);

            if (!response.ok) {
                throw new Error(result.message || 'Erreur lors de l\'initialisation du paiement');
            }

            if (result.link) {
                // Card payment - redirect to Flutterwave checkout
                window.location.href = result.link;
            } else if (result.transactionId) {
                // Mobile money - show confirmation message
                setShowPaymentModal(false);
                alert(`${result.message}\n\nVeuillez confirmer le paiement sur votre téléphone.\n\nMontant: ${selectedPack.price_fcfa} XAF\nCrédits: ${selectedPack.credits}`);

                // Poll for payment status
                setTimeout(() => loadData(), 30000);
            } else {
                throw new Error('Réponse de paiement invalide');
            }

        } catch (error: any) {
            console.error('❌ Payment error:', error);
            alert(`Erreur: ${error.message || 'Une erreur est survenue lors du paiement'}`);
        } finally {
            setProcessing(false);
        }
    };

    const getTransactionLabel = (type: string) => {
        const labels: { [key: string]: string } = {
            'INITIAL_BONUS': 'Bonus de bienvenue',
            'MONTHLY_FREE': 'Crédits mensuels gratuits',
            'PURCHASE': 'Achat de crédits',
            'PROFILE_VIEW': 'Vue de profil',
            'PHONE_REVEAL': 'Révélation téléphone',
            'BOOKING_RECEIVED': 'Réservation reçue',
            'REFUND': 'Remboursement',
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-b-3xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">Mes Crédits</h1>
                    <button onClick={loadData} className="p-2 hover:bg-white/20 rounded-full transition">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
                    <p className="text-white/70 text-sm mb-1">Solde disponible</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-amber-400">{balance.toFixed(1)}</span>
                        <span className="text-white/70">crédits</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mt-6 mx-4">
                <button
                    onClick={() => setActiveTab('recharge')}
                    className={`flex-1 py-3 text-center font-medium transition ${activeTab === 'recharge'
                        ? 'text-amber-600 border-b-2 border-amber-500'
                        : 'text-gray-500'
                        }`}
                >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Recharger
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-3 text-center font-medium transition ${activeTab === 'history'
                        ? 'text-amber-600 border-b-2 border-amber-500'
                        : 'text-gray-500'
                        }`}
                >
                    <History className="w-4 h-4 inline mr-2" />
                    Historique
                </button>
            </div>

            {/* Content */}
            <div className="px-4 mt-6">
                {activeTab === 'recharge' ? (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">Choisissez un pack</h2>

                        {packs.length === 0 ? (
                            <div className="bg-white rounded-xl p-6 text-center text-gray-500">
                                <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>Aucun pack disponible pour le moment</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {packs.map((pack) => (
                                    <div
                                        key={pack.id}
                                        onClick={() => handleSelectPack(pack)}
                                        className={`relative bg-white rounded-xl p-5 border-2 cursor-pointer transition-all hover:shadow-md ${(pack.discount_percentage || 0) >= 20
                                            ? 'border-amber-500 shadow-amber-100'
                                            : 'border-gray-100 hover:border-amber-300'
                                            }`}
                                    >
                                        {(pack.discount_percentage || 0) >= 20 && (
                                            <div className="absolute -top-3 left-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                                -{pack.discount_percentage}%
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 text-lg">
                                                    {pack.credits || 0} crédits
                                                </h3>
                                                <p className="text-gray-500 text-sm mt-1">
                                                    {pack.name || 'Pack de crédits'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {(pack.price_fcfa || 0).toLocaleString()}
                                                </p>
                                                <p className="text-gray-500 text-sm">XAF</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-end text-amber-600 font-medium">
                                            <span>Acheter</span>
                                            <ArrowRight className="w-4 h-4 ml-1" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">Historique des transactions</h2>

                        {transactions.length === 0 ? (
                            <div className="bg-white rounded-xl p-6 text-center text-gray-500">
                                <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>Aucune transaction</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="bg-white rounded-xl p-4 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    {tx.amount > 0 ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {getTransactionLabel(tx.transaction_type)}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(tx.created_at).toLocaleDateString('fr-FR', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`text-right font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(1)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedPack && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
                    <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold">Paiement</h2>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="p-6 bg-amber-50 border-b">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {selectedPack.credits || 0} crédits
                                    </p>
                                    {(selectedPack.discount_percentage || 0) > 0 && (
                                        <p className="text-sm text-green-600">
                                            -{selectedPack.discount_percentage}% de réduction
                                        </p>
                                    )}
                                </div>
                                <p className="text-2xl font-bold text-amber-600">
                                    {(selectedPack.price_fcfa || 0).toLocaleString()} XAF
                                </p>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="p-6">
                            <h3 className="font-semibold mb-4">Moyen de paiement</h3>

                            <div className="space-y-3">
                                {/* Orange Money */}
                                <label
                                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${paymentMethod === 'ORANGE_MONEY'
                                        ? 'border-orange-500 bg-orange-50'
                                        : 'border-gray-200'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="ORANGE_MONEY"
                                        checked={paymentMethod === 'ORANGE_MONEY'}
                                        onChange={() => setPaymentMethod('ORANGE_MONEY')}
                                        className="sr-only"
                                    />
                                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">
                                        OM
                                    </div>
                                    <span className="font-medium flex-1">Orange Money</span>
                                    {paymentMethod === 'ORANGE_MONEY' && (
                                        <Check className="w-5 h-5 text-orange-500" />
                                    )}
                                </label>

                                {/* MTN Mobile Money */}
                                <label
                                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${paymentMethod === 'MTN_MOBILE_MONEY'
                                        ? 'border-yellow-500 bg-yellow-50'
                                        : 'border-gray-200'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="MTN_MOBILE_MONEY"
                                        checked={paymentMethod === 'MTN_MOBILE_MONEY'}
                                        onChange={() => setPaymentMethod('MTN_MOBILE_MONEY')}
                                        className="sr-only"
                                    />
                                    <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center text-black font-bold text-sm mr-3">
                                        MTN
                                    </div>
                                    <span className="font-medium flex-1">MTN Mobile Money</span>
                                    {paymentMethod === 'MTN_MOBILE_MONEY' && (
                                        <Check className="w-5 h-5 text-yellow-500" />
                                    )}
                                </label>

                                {/* Card */}
                                <label
                                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${paymentMethod === 'CARD'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="CARD"
                                        checked={paymentMethod === 'CARD'}
                                        onChange={() => setPaymentMethod('CARD')}
                                        className="sr-only"
                                    />
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mr-3">
                                        <CreditCard className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="font-medium flex-1">Carte bancaire</span>
                                    {paymentMethod === 'CARD' && (
                                        <Check className="w-5 h-5 text-blue-500" />
                                    )}
                                </label>
                            </div>

                            {/* Phone Number (for Mobile Money) */}
                            {(paymentMethod === 'ORANGE_MONEY' || paymentMethod === 'MTN_MOBILE_MONEY') && (
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Smartphone className="w-4 h-4 inline mr-2" />
                                        Numéro de téléphone
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="+237 6XX XXX XXX"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                                    />
                                    <p className="text-sm text-gray-500 mt-2">
                                        Vous recevrez une notification pour confirmer le paiement
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 border-t">
                            <Button
                                onClick={handlePayment}
                                disabled={processing}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-6 text-lg font-semibold rounded-xl"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Traitement...
                                    </>
                                ) : (
                                    <>
                                        Payer {(selectedPack.price_fcfa || 0).toLocaleString()} XAF
                                    </>
                                )}
                            </Button>
                            <p className="text-center text-xs text-gray-500 mt-4">
                                Paiement sécurisé par Flutterwave
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

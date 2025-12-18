"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, Phone, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

function PaymentVerificationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const transactionId = searchParams.get('transactionId');
    const paymentMethod = searchParams.get('paymentMethod') as 'orange_money' | 'mtn_momo';
    const phoneNumber = searchParams.get('phoneNumber') || '';
    const amount = parseInt(searchParams.get('amount') || '0');
    const packName = searchParams.get('packName') || 'Pack de crédits';

    const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
    const [pollingCount, setPollingCount] = useState(0);
    const [message, setMessage] = useState('Vérification du paiement en cours...');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const ussdCode = paymentMethod === 'orange_money' ? '#150*50#' : '*126#';
    const operatorName = paymentMethod === 'orange_money' ? 'Orange Money' : 'MTN Mobile Money';
    const operatorColor = paymentMethod === 'orange_money' ? '#FF6600' : '#FFCC00';
    const operatorBg = paymentMethod === 'orange_money' ? 'bg-orange-500' : 'bg-yellow-400';
    const operatorTextColor = paymentMethod === 'orange_money' ? 'text-white' : 'text-black';

    useEffect(() => {
        if (!transactionId) {
            router.push('/pro/credits');
            return;
        }

        // Start polling immediately
        checkPaymentStatus();

        // Then poll every 3 seconds
        intervalRef.current = setInterval(() => {
            checkPaymentStatus();
        }, 3000);

        // Stop polling after 2 minutes (40 checks)
        timeoutRef.current = setTimeout(() => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (status === 'pending') {
                setStatus('failed');
                setMessage('Le délai de vérification a expiré. Veuillez réessayer.');
            }
        }, 120000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [transactionId]);

    const checkPaymentStatus = async () => {
        try {
            setPollingCount(prev => prev + 1);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/payments/verify/${transactionId}`
            );
            const data = await response.json();

            console.log('📊 Payment verification response:', data);

            if (data.status === 'success' || data.status === 'already_completed') {
                // Clear polling
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                setStatus('success');
                setMessage(data.status === 'already_completed'
                    ? 'Paiement déjà complété ! Vos crédits ont été ajoutés.'
                    : 'Paiement réussi ! Vos crédits ont été ajoutés.');

                // Navigate back to credits after showing success
                setTimeout(() => {
                    router.push('/pro/credits');
                }, 2500);
            } else if (data.status === 'failed') {
                // Clear polling
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                setStatus('failed');
                setMessage('Le paiement a échoué. Veuillez réessayer.');
            }
            // If status is still pending, continue polling
        } catch (error: any) {
            console.error('❌ Error checking payment status (attempt ' + pollingCount + '):', error.message);
            // Continue polling silently on error
        }
    };

    const handleDialUSSD = () => {
        // On web, we can't directly dial, but we can show the code to copy
        if (navigator.clipboard) {
            navigator.clipboard.writeText(ussdCode);
            alert(`Code USSD copié : ${ussdCode}\n\nComposez ce code sur votre téléphone pour accéder à ${operatorName}.`);
        }
    };

    if (!transactionId) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Status Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                    {/* Operator Badge */}
                    <div className={`inline-flex items-center gap-2 ${operatorBg} ${operatorTextColor} px-4 py-2 rounded-full font-bold text-sm mb-6`}>
                        <Phone className="w-4 h-4" />
                        {operatorName}
                    </div>

                    {/* Status Icon */}
                    <div className="mb-6">
                        {status === 'pending' && (
                            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-amber-100 to-orange-100 flex items-center justify-center">
                                <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-16 h-16 text-green-500" />
                            </div>
                        )}
                        {status === 'failed' && (
                            <div className="w-24 h-24 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle className="w-16 h-16 text-red-500" />
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {status === 'pending' && 'Paiement en cours'}
                        {status === 'success' && 'Paiement réussi !'}
                        {status === 'failed' && 'Paiement échoué'}
                    </h1>

                    {/* Message */}
                    <p className="text-gray-600 mb-6">{message}</p>

                    {/* Payment Details */}
                    {status === 'pending' && (
                        <>
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-gray-500">Méthode</span>
                                    <span className="font-semibold text-gray-900">{operatorName}</span>
                                </div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-gray-500">Numéro</span>
                                    <span className="font-semibold text-gray-900">{phoneNumber}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Montant</span>
                                    <span className="font-bold text-lg text-amber-600">{amount.toLocaleString()} XAF</span>
                                </div>
                            </div>

                            {/* USSD Instructions */}
                            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-6">
                                <p className="text-sm font-semibold text-gray-800 mb-2">
                                    📱 Si le paiement ne se lance pas automatiquement
                                </p>
                                <p className="text-sm text-gray-600 mb-3">
                                    Composez le code suivant sur votre téléphone :
                                </p>
                                <button
                                    onClick={handleDialUSSD}
                                    className="w-full bg-gray-900 text-amber-400 font-bold text-2xl py-3 rounded-lg hover:bg-gray-800 transition tracking-wider"
                                >
                                    {ussdCode}
                                </button>
                                <p className="text-xs text-gray-500 mt-2 italic">
                                    Cliquez pour copier le code
                                </p>
                            </div>

                            {/* Polling Indicator */}
                            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Vérification {pollingCount}...</span>
                            </div>
                        </>
                    )}

                    {/* Action Buttons */}
                    {status !== 'pending' && (
                        <Button
                            onClick={() => router.push('/pro/credits')}
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-6 text-lg font-semibold rounded-xl mt-4"
                        >
                            Retour aux crédits
                        </Button>
                    )}

                    {status === 'failed' && (
                        <Button
                            onClick={() => router.push('/pro/credits')}
                            variant="outline"
                            className="w-full mt-3 py-6 text-lg font-semibold rounded-xl"
                        >
                            Réessayer
                        </Button>
                    )}
                </div>

                {/* Help Text */}
                {status === 'pending' && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                        Veuillez confirmer le paiement sur votre téléphone.
                        <br />
                        Cette page se mettra à jour automatiquement.
                    </p>
                )}
            </div>
        </div>
    );
}

export default function PaymentVerificationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
        }>
            <PaymentVerificationContent />
        </Suspense>
    );
}

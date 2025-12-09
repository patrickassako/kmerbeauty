import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Linking,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import api from '../../services/api';

interface PaymentVerificationParams {
    transactionId: string;
    paymentMethod: 'orange_money' | 'mtn_momo';
    phoneNumber: string;
    amount: number;
    packName: string;
}

export const PaymentVerificationScreen: React.FC = () => {
    const route = useRoute();
    const navigation = useNavigation<any>();
    const { normalizeFontSize, spacing } = useResponsive();
    const params = route.params as PaymentVerificationParams;

    const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
    const [pollingCount, setPollingCount] = useState(0);
    const [message, setMessage] = useState('Vérification du paiement en cours...');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const ussdCode = params.paymentMethod === 'orange_money' ? '#150*50#' : '*126#';
    const operatorName = params.paymentMethod === 'orange_money' ? 'Orange Money' : 'MTN Mobile Money';

    useEffect(() => {
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
    }, []);

    const checkPaymentStatus = async () => {
        try {
            setPollingCount(prev => prev + 1);

            const response = await api.get(`/payments/verify/${params.transactionId}`);

            console.log('📊 Payment verification response:', JSON.stringify(response.data, null, 2));

            if (response.data.status === 'success') {
                // Clear polling
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                setStatus('success');
                setMessage('Paiement réussi ! Vos crédits ont été ajoutés.');

                // Navigate back to dashboard after showing success
                setTimeout(() => {
                    navigation.navigate('ContractorDashboard');
                }, 2000);
            } else if (response.data.status === 'failed') {
                // Clear polling
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                setStatus('failed');
                setMessage('Le paiement a échoué. Veuillez réessayer.');

                // Stay on screen to show error
            } else if (response.data.status === 'already_completed') {
                // Payment already processed
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                setStatus('success');
                setMessage('Paiement déjà complété ! Vos crédits ont été ajoutés.');

                // Navigate back to dashboard
                setTimeout(() => {
                    navigation.navigate('ContractorDashboard');
                }, 2000);
            } else {
                console.log('⏳ Payment still pending, continuing to poll...');
            }
            // If status is still pending, continue polling
        } catch (error: any) {
            console.error('❌ Error checking payment status (attempt ' + pollingCount + '):', error.message);

            // Don't show error immediately - the payment record might not exist yet
            // Only show error after many attempts (let the timeout handle it)
            // This prevents showing "failed" when the payment is just being processed

            // Continue polling silently on error
        }
    };

    const handleDialUSSD = () => {
        const url = `tel:${encodeURIComponent(ussdCode)}`;
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert('Erreur', 'Impossible d\'ouvrir le composeur téléphonique');
            }
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={[styles.content, { padding: spacing(3) }]}>
                {/* Status Icon */}
                <View style={[styles.iconContainer, { marginBottom: spacing(3) }]}>
                    {status === 'pending' && (
                        <ActivityIndicator size="large" color="#FF8C00" />
                    )}
                    {status === 'success' && (
                        <Text style={[styles.statusIcon, { fontSize: normalizeFontSize(80) }]}>✅</Text>
                    )}
                    {status === 'failed' && (
                        <Text style={[styles.statusIcon, { fontSize: normalizeFontSize(80) }]}>❌</Text>
                    )}
                </View>

                {/* Title */}
                <Text style={[styles.title, { fontSize: normalizeFontSize(24), marginBottom: spacing(2) }]}>
                    {status === 'pending' && 'Paiement en cours'}
                    {status === 'success' && 'Paiement réussi !'}
                    {status === 'failed' && 'Paiement échoué'}
                </Text>

                {/* Message */}
                <Text style={[styles.message, { fontSize: normalizeFontSize(16), marginBottom: spacing(3) }]}>
                    {message}
                </Text>

                {/* Payment Details */}
                {status === 'pending' && (
                    <>
                        <View style={[styles.detailsCard, { padding: spacing(2.5), marginBottom: spacing(3) }]}>
                            <View style={[styles.detailRow, { marginBottom: spacing(1.5) }]}>
                                <Text style={[styles.detailLabel, { fontSize: normalizeFontSize(14) }]}>
                                    Méthode :
                                </Text>
                                <Text style={[styles.detailValue, { fontSize: normalizeFontSize(14) }]}>
                                    {operatorName}
                                </Text>
                            </View>
                            <View style={[styles.detailRow, { marginBottom: spacing(1.5) }]}>
                                <Text style={[styles.detailLabel, { fontSize: normalizeFontSize(14) }]}>
                                    Numéro :
                                </Text>
                                <Text style={[styles.detailValue, { fontSize: normalizeFontSize(14) }]}>
                                    {params.phoneNumber}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { fontSize: normalizeFontSize(14) }]}>
                                    Montant :
                                </Text>
                                <Text style={[styles.detailValue, { fontSize: normalizeFontSize(14) }]}>
                                    {params.amount.toLocaleString()} FCFA
                                </Text>
                            </View>
                        </View>

                        {/* USSD Instructions */}
                        <View style={[styles.ussdCard, { padding: spacing(2.5), marginBottom: spacing(3) }]}>
                            <Text style={[styles.ussdTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1.5) }]}>
                                📱 Si le paiement ne se lance pas automatiquement
                            </Text>
                            <Text style={[styles.ussdInstruction, { fontSize: normalizeFontSize(14), marginBottom: spacing(2) }]}>
                                Composez le code suivant sur votre téléphone :
                            </Text>
                            <TouchableOpacity
                                style={[styles.ussdButton, { padding: spacing(2) }]}
                                onPress={handleDialUSSD}
                            >
                                <Text style={[styles.ussdCode, { fontSize: normalizeFontSize(28) }]}>
                                    {ussdCode}
                                </Text>
                            </TouchableOpacity>
                            <Text style={[styles.ussdHint, { fontSize: normalizeFontSize(12), marginTop: spacing(1) }]}>
                                Appuyez pour composer automatiquement
                            </Text>
                        </View>

                        {/* Polling indicator */}
                        <Text style={[styles.pollingText, { fontSize: normalizeFontSize(12) }]}>
                            Vérification {pollingCount}...
                        </Text>
                    </>
                )}

                {/* Action Buttons */}
                {status !== 'pending' && (
                    <TouchableOpacity
                        style={[styles.actionButton, { padding: spacing(2), marginTop: spacing(3) }]}
                        onPress={() => navigation.navigate('ContractorDashboard')}
                    >
                        <Text style={[styles.actionButtonText, { fontSize: normalizeFontSize(16) }]}>
                            Retour au tableau de bord
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusIcon: {
        textAlign: 'center',
    },
    title: {
        fontWeight: '700',
        color: '#2D2D2D',
        textAlign: 'center',
    },
    message: {
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    detailsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        color: '#666',
        fontWeight: '500',
    },
    detailValue: {
        color: '#2D2D2D',
        fontWeight: '600',
    },
    ussdCard: {
        backgroundColor: '#FFF8E1',
        borderRadius: 16,
        width: '100%',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    ussdTitle: {
        fontWeight: '700',
        color: '#2D2D2D',
        textAlign: 'center',
    },
    ussdInstruction: {
        color: '#666',
        textAlign: 'center',
    },
    ussdButton: {
        backgroundColor: '#2D2D2D',
        borderRadius: 12,
        alignItems: 'center',
    },
    ussdCode: {
        color: '#FFD700',
        fontWeight: '700',
        letterSpacing: 2,
    },
    ussdHint: {
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    pollingText: {
        color: '#999',
        textAlign: 'center',
        marginTop: 16,
    },
    actionButton: {
        backgroundColor: '#2D2D2D',
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

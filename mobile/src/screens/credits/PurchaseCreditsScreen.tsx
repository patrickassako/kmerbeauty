import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../../i18n/I18nContext';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';
import { creditsApi, contractorApi, type CreditPack, type CreditBalance } from '../../services/api';
import { PaymentMethodSelector, type PaymentMethod } from '../../components/credits/PaymentMethodSelector';

export const PurchaseCreditsScreen: React.FC = () => {
    const { t } = useI18n();
    const { normalizeFontSize, spacing } = useResponsive();
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [packs, setPacks] = useState<CreditPack[]>([]);
    const [balance, setBalance] = useState<CreditBalance | null>(null);
    const [purchasing, setPurchasing] = useState(false);
    const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
    const [providerId, setProviderId] = useState<string | null>(null);
    const [showPaymentSelector, setShowPaymentSelector] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Get provider profile
            const profile = await contractorApi.getProfileByUserId(user?.id || '');
            if (profile) {
                setProviderId(profile.id);

                // Load balance and packs in parallel
                const [balanceData, packsData] = await Promise.all([
                    creditsApi.getBalance(profile.id, 'therapist'),
                    creditsApi.getPacks(),
                ]);

                setBalance(balanceData);
                setPacks(packsData);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            Alert.alert('Erreur', 'Impossible de charger les données');
        } finally {
            setLoading(false);
        }
    };

    const handlePackSelect = (pack: CreditPack) => {
        setSelectedPack(pack);
        setShowPaymentSelector(true);
    };

    const handlePaymentConfirm = async (method: PaymentMethod, phoneNumber?: string) => {
        if (!user || !providerId || !selectedPack) {
            Alert.alert('Erreur', 'Informations manquantes');
            return;
        }

        try {
            setPurchasing(true);
            setShowPaymentSelector(false);

            const response = await creditsApi.initiatePurchase({
                amount: selectedPack.price_fcfa,
                currency: 'XAF',
                email: user.email || '',
                phoneNumber: phoneNumber || user.phone || '',
                name: `${user.first_name} ${user.last_name}`,
                providerId: providerId,
                providerType: 'therapist',
                packId: selectedPack.id,
                paymentMethod: method,
                redirectUrl: 'kmerservices://payment-success',
            });

            if (response.transactionId) {
                // Mobile Money payment - navigate to verification screen
                setShowPaymentSelector(false);
                setPurchasing(false);

                navigation.navigate('PaymentVerification', {
                    transactionId: response.transactionId,
                    paymentMethod: method,
                    phoneNumber: phoneNumber,
                    amount: selectedPack.price_fcfa,
                    packName: selectedPack.name,
                });

                setSelectedPack(null);
            } else if (response.link) {
                // Card payment - open web link
                const supported = await Linking.canOpenURL(response.link);
                if (supported) {
                    await Linking.openURL(response.link);
                } else {
                    Alert.alert('Erreur', 'Impossible d\'ouvrir le lien de paiement');
                }
                setSelectedPack(null);
            }
        } catch (error) {
            console.error('Payment initiation failed:', error);
            Alert.alert(
                'Erreur',
                error.response?.data?.message || 'Échec de l\'initialisation du paiement. Vérifiez votre connexion et réessayez.'
            );
        } finally {
            setPurchasing(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.loadingContainer]} edges={['top', 'bottom']}>
                <ActivityIndicator size="large" color="#2D2D2D" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <ScrollView contentContainerStyle={{ paddingBottom: spacing(4) }}>
                <View style={[styles.header, { padding: spacing(2), marginBottom: spacing(2) }]}>
                    <Text style={[styles.title, { fontSize: normalizeFontSize(24) }]}>
                        Acheter des crédits
                    </Text>
                    <Text style={[styles.subtitle, { fontSize: normalizeFontSize(14), marginTop: spacing(1) }]}>
                        Choisissez le pack qui vous convient
                    </Text>
                </View>

                {/* Balance Card */}
                {balance && (
                    <View style={[styles.balanceCard, { padding: spacing(2.5), marginHorizontal: spacing(2), marginBottom: spacing(3) }]}>
                        <Text style={[styles.balanceLabel, { fontSize: normalizeFontSize(14) }]}>
                            💰 Solde actuel
                        </Text>
                        <Text style={[styles.balanceAmount, { fontSize: normalizeFontSize(42), marginTop: spacing(0.5) }]}>
                            {Math.floor(balance.balance)}
                        </Text>
                        <Text style={[styles.balanceSubtext, { fontSize: normalizeFontSize(12), marginTop: spacing(0.5) }]}>
                            crédits disponibles
                        </Text>
                    </View>
                )}

                {packs.map((pack) => {
                    const totalCredits = pack.credits + (pack.bonus_credits || 0);
                    const isPopular = pack.discount_percentage >= 20; // Popular if discount >= 20%

                    return (
                        <TouchableOpacity
                            key={pack.id}
                            style={[
                                styles.packCard,
                                { padding: spacing(3), marginHorizontal: spacing(2), marginBottom: spacing(2) },
                                isPopular && styles.packCardPopular,
                            ]}
                            onPress={() => handlePackSelect(pack)}
                            disabled={purchasing}
                        >
                            {isPopular && (
                                <View style={[styles.popularBadge, { paddingHorizontal: spacing(2), paddingVertical: spacing(0.5) }]}>
                                    <Text style={[styles.popularBadgeText, { fontSize: normalizeFontSize(11) }]}>
                                        ⭐ POPULAIRE
                                    </Text>
                                </View>
                            )}

                            <Text style={[styles.packName, { fontSize: normalizeFontSize(20), marginBottom: spacing(1) }, isPopular && styles.packNamePopular]}>
                                {pack.name}
                            </Text>

                            <View style={styles.creditsInfo}>
                                <Text style={[styles.creditsAmount, { fontSize: normalizeFontSize(36) }, isPopular && styles.creditsAmountPopular]}>
                                    {totalCredits}
                                </Text>
                                <Text style={[styles.creditsLabel, { fontSize: normalizeFontSize(14) }, isPopular && styles.creditsLabelPopular]}>
                                    crédits
                                </Text>
                            </View>

                            {pack.bonus_credits > 0 && (
                                <View style={[styles.bonusTag, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), marginTop: spacing(1) }]}>
                                    <Text style={[styles.bonusText, { fontSize: normalizeFontSize(12) }]}>
                                        +{pack.bonus_credits} crédits bonus
                                    </Text>
                                </View>
                            )}

                            <View style={[styles.breakdown, { marginTop: spacing(2), paddingTop: spacing(2) }, isPopular && styles.breakdownPopular]}>
                                <Text style={[styles.breakdownText, { fontSize: normalizeFontSize(13) }, isPopular && styles.breakdownTextPopular]}>
                                    {pack.credits} crédits de base
                                </Text>
                                {pack.bonus_credits > 0 && (
                                    <Text style={[styles.breakdownText, { fontSize: normalizeFontSize(13) }, isPopular && styles.breakdownTextPopular]}>
                                        + {pack.bonus_credits} bonus ({pack.discount_percentage}% de réduction)
                                    </Text>
                                )}
                            </View>

                            <View style={[styles.priceContainer, { marginTop: spacing(2) }]}>
                                <Text style={[styles.price, { fontSize: normalizeFontSize(28) }, isPopular && styles.pricePopular]}>
                                    {pack.price_fcfa.toLocaleString()} XAF
                                </Text>
                                <Text style={[styles.pricePerCredit, { fontSize: normalizeFontSize(12), marginTop: spacing(0.5) }, isPopular && styles.pricePerCreditPopular]}>
                                    {Math.floor(pack.price_fcfa / totalCredits)} XAF / crédit
                                </Text>
                            </View>

                            {purchasing && selectedPack?.id === pack.id ? (
                                <ActivityIndicator
                                    size="small"
                                    color={isPopular ? '#FFFFFF' : '#2D2D2D'}
                                    style={{ marginTop: spacing(2) }}
                                />
                            ) : (
                                <View style={[styles.buyButton, { marginTop: spacing(2), padding: spacing(1.5) }]}>
                                    <Text style={[styles.buyButtonText, { fontSize: normalizeFontSize(16) }]}>
                                        Acheter maintenant
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}

                <View style={[styles.infoCard, { padding: spacing(2), marginHorizontal: spacing(2), marginTop: spacing(2) }]}>
                    <Text style={[styles.infoTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1) }]}>
                        💳 Moyens de paiement acceptés
                    </Text>
                    <Text style={[styles.infoText, { fontSize: normalizeFontSize(13) }]}>
                        • Mobile Money (MTN, Orange){'\n'}
                        • Carte bancaire (bientôt)
                    </Text>
                </View>

                {/* Payment Method Selector */}
                <PaymentMethodSelector
                    visible={showPaymentSelector}
                    onClose={() => setShowPaymentSelector(false)}
                    onConfirm={handlePaymentConfirm}
                    amount={selectedPack?.price_fcfa || 0}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#FFFFFF',
    },
    balanceCard: {
        backgroundColor: '#2D2D2D',
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    balanceLabel: {
        color: '#FFFFFF',
        opacity: 0.8,
        fontWeight: '500',
    },
    balanceAmount: {
        color: '#FFD700',
        fontWeight: '700',
    },
    balanceSubtext: {
        color: '#FFFFFF',
        opacity: 0.6,
    },
    title: {
        fontWeight: '700',
        color: '#2D2D2D',
    },
    subtitle: {
        color: '#666',
    },
    packCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        position: 'relative',
    },
    packCardPopular: {
        backgroundColor: '#2D2D2D',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    popularBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#FFD700',
        borderRadius: 12,
    },
    popularBadgeText: {
        fontWeight: '700',
        color: '#2D2D2D',
    },
    packName: {
        fontWeight: '700',
        color: '#2D2D2D',
    },
    packNamePopular: {
        color: '#FFFFFF',
    },
    creditsInfo: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 8,
    },
    creditsAmount: {
        fontWeight: '700',
        color: '#2D2D2D',
        marginRight: 8,
    },
    creditsAmountPopular: {
        color: '#FFD700',
    },
    creditsLabel: {
        color: '#666',
        fontWeight: '500',
    },
    creditsLabelPopular: {
        color: '#FFFFFF',
        opacity: 0.8,
    },
    bonusTag: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    bonusText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    breakdown: {
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    breakdownPopular: {
        borderTopColor: '#444',
    },
    breakdownText: {
        color: '#666',
        marginBottom: 4,
    },
    breakdownTextPopular: {
        color: '#FFFFFF',
        opacity: 0.8,
    },
    priceContainer: {
        alignItems: 'center',
    },
    price: {
        fontWeight: '700',
        color: '#2D2D2D',
    },
    pricePopular: {
        color: '#FFFFFF',
    },
    pricePerCredit: {
        color: '#999',
    },
    pricePerCreditPopular: {
        color: '#FFFFFF',
        opacity: 0.6,
    },
    buyButton: {
        backgroundColor: '#2D2D2D',
        borderRadius: 12,
        alignItems: 'center',
    },
    buyButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
    infoTitle: {
        fontWeight: '600',
        color: '#2D2D2D',
    },
    infoText: {
        color: '#666',
        lineHeight: 20,
    },
});

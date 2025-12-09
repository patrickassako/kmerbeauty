import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useI18n } from '../../i18n/I18nContext';
import { useResponsive } from '../../hooks/useResponsive';
import api from '../../services/api';

interface CreditBalance {
    balance: number;
    total_earned: number;
    total_spent: number;
    monthly_credits_last_given: string;
}

interface Transaction {
    id: string;
    amount: number;
    transaction_type: string;
    balance_before: number;
    balance_after: number;
    created_at: string;
    metadata?: any;
}

export const CreditsDashboardScreen: React.FC = () => {
    const { t } = useI18n();
    const { normalizeFontSize, spacing } = useResponsive();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [balance, setBalance] = useState<CreditBalance | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const loadData = async () => {
        try {
            // Get provider ID and type from auth context (you'll need to implement this)
            const providerId = 'YOUR_PROVIDER_ID'; // TODO: Get from auth context
            const providerType = 'therapist'; // TODO: Get from auth context

            const [balanceRes, transactionsRes] = await Promise.all([
                api.get(`/credits/balance/${providerId}?type=${providerType}`),
                api.get(`/credits/transactions/${providerId}?type=${providerType}&limit=20`),
            ]);

            setBalance(balanceRes.data);
            setTransactions(transactionsRes.data.data || []);
        } catch (error) {
            console.error('Failed to load credits data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const getTransactionColor = (type: string) => {
        if (type.includes('PURCHASE') || type.includes('BONUS') || type.includes('REFERRAL')) {
            return '#4CAF50';
        }
        return '#FF5252';
    };

    const formatTransactionType = (type: string) => {
        const types: Record<string, string> = {
            'INITIAL_BONUS': 'Bonus de bienvenue',
            'MONTHLY_BONUS': 'Bonus mensuel',
            'PURCHASE': 'Achat de crédits',
            'PROFILE_VIEW': 'Vue profil',
            'CHAT_PRE_BOOKING': 'Chat pré-réservation',
            'BOOKING_CONFIRMED': 'Réservation confirmée',
            'REVIEW_CREATED': 'Avis créé',
            'FAVORITE_ADDED': 'Ajout favoris',
            'REFERRAL_SIGNUP': 'Bonus parrainage (inscription)',
            'REFERRAL_BOOKING': 'Bonus parrainage (réservation)',
        };
        return types[type] || type;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2D2D2D" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Balance Card */}
            <View style={[styles.balanceCard, { padding: spacing(3), marginHorizontal: spacing(2), marginTop: spacing(2) }]}>
                <Text style={[styles.balanceLabel, { fontSize: normalizeFontSize(14) }]}>
                    Solde de crédits
                </Text>
                <Text style={[styles.balanceAmount, { fontSize: normalizeFontSize(48), marginVertical: spacing(1) }]}>
                    {balance?.balance?.toFixed(1) || '0.0'}
                </Text>

                <View style={styles.balanceDetails}>
                    <View style={styles.balanceDetailItem}>
                        <Text style={[styles.balanceDetailLabel, { fontSize: normalizeFontSize(12) }]}>
                            Total gagné
                        </Text>
                        <Text style={[styles.balanceDetailValue, { fontSize: normalizeFontSize(16) }]}>
                            {balance?.total_earned?.toFixed(1) || '0.0'}
                        </Text>
                    </View>
                    <View style={styles.balanceDetailItem}>
                        <Text style={[styles.balanceDetailLabel, { fontSize: normalizeFontSize(12) }]}>
                            Total dépensé
                        </Text>
                        <Text style={[styles.balanceDetailValue, { fontSize: normalizeFontSize(16) }]}>
                            {balance?.total_spent?.toFixed(1) || '0.0'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity style={[styles.buyButton, { padding: spacing(2), marginTop: spacing(2) }]}>
                    <Text style={[styles.buyButtonText, { fontSize: normalizeFontSize(16) }]}>
                        Acheter des crédits
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Transactions List */}
            <View style={[styles.section, { marginTop: spacing(3), paddingHorizontal: spacing(2) }]}>
                <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18), marginBottom: spacing(2) }]}>
                    Historique
                </Text>

                {transactions.length === 0 ? (
                    <Text style={[styles.emptyText, { fontSize: normalizeFontSize(14) }]}>
                        Aucune transaction pour le moment
                    </Text>
                ) : (
                    transactions.map((transaction) => (
                        <View key={transaction.id} style={[styles.transactionItem, { padding: spacing(2), marginBottom: spacing(1.5) }]}>
                            <View style={styles.transactionHeader}>
                                <Text style={[styles.transactionType, { fontSize: normalizeFontSize(14) }]}>
                                    {formatTransactionType(transaction.transaction_type)}
                                </Text>
                                <Text
                                    style={[
                                        styles.transactionAmount,
                                        { fontSize: normalizeFontSize(16), color: getTransactionColor(transaction.transaction_type) },
                                    ]}
                                >
                                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(1)}
                                </Text>
                            </View>
                            <View style={styles.transactionFooter}>
                                <Text style={[styles.transactionDate, { fontSize: normalizeFontSize(12) }]}>
                                    {new Date(transaction.created_at).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </Text>
                                <Text style={[styles.transactionBalance, { fontSize: normalizeFontSize(12) }]}>
                                    Solde: {transaction.balance_after.toFixed(1)}
                                </Text>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    balanceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    balanceLabel: {
        color: '#666',
        fontWeight: '500',
    },
    balanceAmount: {
        fontWeight: '700',
        color: '#2D2D2D',
    },
    balanceDetails: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    balanceDetailItem: {
        alignItems: 'center',
    },
    balanceDetailLabel: {
        color: '#999',
        marginBottom: 4,
    },
    balanceDetailValue: {
        fontWeight: '600',
        color: '#2D2D2D',
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
    section: {
    },
    sectionTitle: {
        fontWeight: '700',
        color: '#2D2D2D',
    },
    emptyText: {
        color: '#999',
        textAlign: 'center',
        marginTop: 40,
    },
    transactionItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    transactionType: {
        fontWeight: '600',
        color: '#2D2D2D',
        flex: 1,
    },
    transactionAmount: {
        fontWeight: '700',
    },
    transactionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    transactionDate: {
        color: '#999',
    },
    transactionBalance: {
        color: '#666',
    },
});

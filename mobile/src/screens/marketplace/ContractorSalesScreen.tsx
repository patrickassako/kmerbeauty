import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { marketplaceApi } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const STATUS_LABELS: any = {
    pending: { label: 'En attente', color: '#FFA500' },
    confirmed: { label: 'Confirmée', color: '#4CAF50' },
    ready_for_pickup: { label: 'Prêt', color: '#2196F3' },
    delivered: { label: 'Livrée', color: '#4CAF50' },
    cancelled: { label: 'Annulée', color: '#F44336' },
};

export const ContractorSalesScreen = () => {
    const { normalizeFontSize, spacing } = useResponsive();
    const navigation = useNavigation<any>();

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await marketplaceApi.getOrders('seller');
            setOrders(data);
        } catch (error) {
            console.error('Error loading orders:', error);
            Alert.alert('Erreur', 'Impossible de charger les commandes');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadOrders();
        setRefreshing(false);
    };

    const handleUpdateStatus = (orderId: string, currentStatus: string) => {
        const nextStatuses: any = {
            pending: 'confirmed',
            confirmed: 'ready_for_pickup',
            ready_for_pickup: 'delivered',
        };

        const nextStatus = nextStatuses[currentStatus];
        if (!nextStatus) return;

        Alert.alert(
            'Mettre à jour le statut',
            `Passer à "${STATUS_LABELS[nextStatus].label}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    onPress: async () => {
                        try {
                            await marketplaceApi.updateOrderStatus(orderId, { status: nextStatus });
                            await loadOrders();
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
                        }
                    },
                },
            ]
        );
    };

    const handleMarkPaid = (orderId: string) => {
        Alert.alert(
            'Confirmer le paiement',
            'Le client a-t-il payé ?',
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui',
                    onPress: async () => {
                        try {
                            await marketplaceApi.updateOrderStatus(orderId, { payment_status: 'paid' });
                            await loadOrders();
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de confirmer le paiement');
                        }
                    },
                },
            ]
        );
    };

    const handleCancelOrder = (orderId: string) => {
        Alert.alert(
            'Annuler la commande',
            'Êtes-vous sûr de vouloir annuler cette commande ?',
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, annuler',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await marketplaceApi.updateOrderStatus(orderId, { status: 'cancelled' });
                            await loadOrders();
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible d\'annuler la commande');
                        }
                    },
                },
            ]
        );
    };

    const renderOrder = ({ item }: { item: any }) => {
        const statusInfo = STATUS_LABELS[item.status] || { label: item.status, color: '#666' };
        const isPaid = item.payment_status === 'paid';

        return (
            <View style={[styles.orderCard, { padding: spacing(2), marginBottom: spacing(2) }]}>
                <View style={styles.orderHeader}>
                    <Text style={[styles.productName, { fontSize: normalizeFontSize(16) }]}>
                        {item.marketplace_products?.name || 'Produit'}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                        <Text style={[styles.statusText, { fontSize: normalizeFontSize(11) }]}>
                            {statusInfo.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.orderDetails}>
                    <Text style={[styles.detailText, { fontSize: normalizeFontSize(14) }]}>
                        Client: {item.users?.first_name} {item.users?.last_name}
                    </Text>
                    <Text style={[styles.detailText, { fontSize: normalizeFontSize(14) }]}>
                        Quantité: {item.quantity}
                    </Text>
                    <Text style={[styles.priceText, { fontSize: normalizeFontSize(16) }]}>
                        Total: {item.total_price} XAF
                    </Text>
                    <Text style={[styles.detailText, { fontSize: normalizeFontSize(12) }]}>
                        Paiement: {isPaid ? '✅ Payé' : '⏳ En attente'}
                    </Text>
                </View>

                <View style={styles.orderActions}>
                    {!isPaid && item.status !== 'cancelled' && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.payButton, { padding: spacing(1) }]}
                            onPress={() => handleMarkPaid(item.id)}
                        >
                            <Text style={[styles.actionButtonText, { fontSize: normalizeFontSize(13) }]}>
                                Marquer payé
                            </Text>
                        </TouchableOpacity>
                    )}
                    {item.status !== 'delivered' && item.status !== 'cancelled' && (
                        <>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.updateButton, { padding: spacing(1) }]}
                                onPress={() => handleUpdateStatus(item.id, item.status)}
                            >
                                <Text style={[styles.actionButtonText, { fontSize: normalizeFontSize(13) }]}>
                                    Mettre à jour
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.cancelButton, { padding: spacing(1) }]}
                                onPress={() => handleCancelOrder(item.id)}
                            >
                                <Text style={[styles.actionButtonText, { fontSize: normalizeFontSize(13) }]}>
                                    Annuler
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#2D2D2D" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#2D2D2D" />
                </TouchableOpacity>
                <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>Mes Ventes</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={orders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: spacing(2) }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={[styles.emptyState, { padding: spacing(4) }]}>
                        <Text style={{ fontSize: normalizeFontSize(48), marginBottom: spacing(2) }}>📦</Text>
                        <Text style={[styles.emptyTitle, { fontSize: normalizeFontSize(18) }]}>
                            Aucune commande
                        </Text>
                        <Text style={[styles.emptyText, { fontSize: normalizeFontSize(14) }]}>
                            Vos commandes apparaîtront ici
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontWeight: 'bold',
        color: '#2D2D2D',
    },
    orderCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    productName: {
        flex: 1,
        fontWeight: '600',
        color: '#2D2D2D',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        color: '#FFF',
        fontWeight: '600',
    },
    orderDetails: {
        marginBottom: 12,
    },
    detailText: {
        color: '#666',
        marginBottom: 4,
    },
    priceText: {
        fontWeight: 'bold',
        color: '#4CAF50',
        marginTop: 4,
    },
    orderActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        borderRadius: 8,
        alignItems: 'center',
    },
    payButton: {
        backgroundColor: '#4CAF50',
    },
    updateButton: {
        backgroundColor: '#2196F3',
    },
    cancelButton: {
        backgroundColor: '#F44336',
    },
    actionButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyTitle: {
        fontWeight: 'bold',
        color: '#2D2D2D',
        marginBottom: 8,
    },
    emptyText: {
        color: '#666',
        textAlign: 'center',
    },
});

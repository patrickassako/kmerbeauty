import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { marketplaceApi } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const STATUS_LABELS: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    ready_for_pickup: 'Prêt au retrait',
    in_delivery: 'En livraison',
    completed: 'Terminée',
    cancelled: 'Annulée',
};

const STATUS_COLORS: Record<string, string> = {
    pending: '#FFB700',
    confirmed: '#2196F3',
    ready_for_pickup: '#9C27B0',
    in_delivery: '#FF9800',
    completed: '#4CAF50',
    cancelled: '#F44336',
};

export const ClientOrdersScreen = () => {
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
            const data = await marketplaceApi.getOrders('buyer');
            setOrders(data);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadOrders();
        setRefreshing(false);
    };

    const renderOrder = ({ item }: { item: any }) => {
        const statusColor = STATUS_COLORS[item.status] || '#666';
        const statusLabel = STATUS_LABELS[item.status] || item.status;

        return (
            <TouchableOpacity
                style={[styles.orderCard, { padding: spacing(2), marginBottom: spacing(2) }]}
                onPress={() => {
                    // TODO: Navigate to order details
                    console.log('Order clicked:', item.id);
                }}
            >
                <View style={styles.orderHeader}>
                    <Text style={[styles.productName, { fontSize: normalizeFontSize(16) }]}>
                        {item.marketplace_products?.name || 'Produit'}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor, padding: spacing(0.5) }]}>
                        <Text style={[styles.statusText, { fontSize: normalizeFontSize(11) }]}>
                            {statusLabel}
                        </Text>
                    </View>
                </View>

                <View style={styles.orderDetails}>
                    <Text style={[styles.detailText, { fontSize: normalizeFontSize(13) }]}>
                        Quantité: {item.quantity}
                    </Text>
                    <Text style={[styles.detailText, { fontSize: normalizeFontSize(13) }]}>
                        Total: {item.total_price.toLocaleString()} XAF
                    </Text>
                </View>

                <View style={styles.orderMeta}>
                    <Text style={[styles.metaText, { fontSize: normalizeFontSize(12) }]}>
                        {item.payment_method === 'cash_on_delivery' ? '💵 Paiement à la livraison' : '🏪 Paiement au retrait'}
                    </Text>
                    <Text style={[styles.metaText, { fontSize: normalizeFontSize(12) }]}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>

                {item.status === 'completed' && !item.has_review && (
                    <TouchableOpacity
                        style={[styles.reviewButton, { padding: spacing(1), marginTop: spacing(1) }]}
                        onPress={() => {
                            // TODO: Navigate to review screen
                            console.log('Review product:', item.product_id);
                        }}
                    >
                        <Text style={[styles.reviewButtonText, { fontSize: normalizeFontSize(13) }]}>
                            ⭐ Laisser un avis
                        </Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#2D2D2D" />
                </TouchableOpacity>
                <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>Mes Commandes</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={[styles.centered, { flex: 1 }]}>
                    <ActivityIndicator size="large" color="#2D2D2D" />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrder}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: spacing(2.5) }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={[styles.emptyState, { padding: spacing(4) }]}>
                            <Text style={{ fontSize: normalizeFontSize(48), marginBottom: spacing(2) }}>📦</Text>
                            <Text style={[styles.emptyTitle, { fontSize: normalizeFontSize(18) }]}>
                                Aucune commande
                            </Text>
                            <Text style={[styles.emptyText, { fontSize: normalizeFontSize(14) }]}>
                                Vous n'avez pas encore passé de commande
                            </Text>
                        </View>
                    }
                />
            )}
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
        fontWeight: '600',
        color: '#2D2D2D',
        flex: 1,
    },
    statusBadge: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    statusText: {
        color: '#FFF',
        fontWeight: '600',
    },
    orderDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailText: {
        color: '#666',
    },
    orderMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metaText: {
        color: '#999',
    },
    reviewButton: {
        backgroundColor: '#FFB700',
        borderRadius: 8,
        alignItems: 'center',
    },
    reviewButtonText: {
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

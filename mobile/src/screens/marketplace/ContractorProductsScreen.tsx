import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';
import { marketplaceApi } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export const ContractorProductsScreen = () => {
    const { normalizeFontSize, spacing } = useResponsive();
    const { user } = useAuth();
    const navigation = useNavigation<any>();

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await marketplaceApi.getMyProducts();
            setProducts(data);
        } catch (error) {
            console.error('Error loading products:', error);
            Alert.alert('Erreur', 'Impossible de charger les produits');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProducts();
        setRefreshing(false);
    };

    const handleAddProduct = () => {
        navigation.navigate('ProductForm');
    };

    const handleEditProduct = (product: any) => {
        navigation.navigate('ProductForm', { productId: product.id });
    };

    const handleDeleteProduct = (productId: string) => {
        Alert.alert(
            'Supprimer le produit',
            'Êtes-vous sûr de vouloir supprimer ce produit ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await marketplaceApi.deleteProduct(productId);
                            await loadProducts();
                            Alert.alert('Succès', 'Produit supprimé');
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de supprimer le produit');
                        }
                    },
                },
            ]
        );
    };

    const renderProduct = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.productCard, { padding: spacing(2), marginBottom: spacing(2) }]}
            onPress={() => handleEditProduct(item)}
        >
            <Image
                source={{ uri: item.images?.[0] || 'https://via.placeholder.com/100' }}
                style={[styles.productImage, { width: spacing(10), height: spacing(10) }]}
            />
            <View style={styles.productInfo}>
                <Text style={[styles.productName, { fontSize: normalizeFontSize(16) }]}>{item.name}</Text>
                <Text style={[styles.productPrice, { fontSize: normalizeFontSize(14) }]}>
                    {item.price} {item.currency}
                </Text>
                <View style={styles.productMeta}>
                    <Text style={[styles.metaText, { fontSize: normalizeFontSize(12) }]}>
                        Stock: {item.stock_quantity}
                    </Text>
                    <Text style={[styles.metaText, { fontSize: normalizeFontSize(12) }]}>
                        Vues: {item.views_count || 0}
                    </Text>
                    <Text style={[styles.metaText, { fontSize: normalizeFontSize(12) }]}>
                        Ventes: {item.sales_count || 0}
                    </Text>
                </View>
                {!item.is_approved && (
                    <View style={[styles.statusBadge, styles.pendingBadge]}>
                        <Text style={[styles.statusText, { fontSize: normalizeFontSize(11) }]}>
                            ⏳ En attente d'approbation
                        </Text>
                    </View>
                )}
                {!item.is_active && (
                    <View style={[styles.statusBadge, styles.inactiveBadge]}>
                        <Text style={[styles.statusText, { fontSize: normalizeFontSize(11) }]}>
                            ❌ Inactif
                        </Text>
                    </View>
                )}
            </View>
            <TouchableOpacity
                style={[styles.deleteButton, { padding: spacing(1) }]}
                onPress={() => handleDeleteProduct(item.id)}
            >
                <Ionicons name="trash-outline" size={20} color="#FF4444" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

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
                <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>Mes Produits</Text>
                <TouchableOpacity onPress={handleAddProduct}>
                    <Ionicons name="add-circle" size={28} color="#2D2D2D" />
                </TouchableOpacity>
            </View>

            {/* Products List */}
            <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: spacing(2) }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={[styles.emptyState, { padding: spacing(4) }]}>
                        <Text style={{ fontSize: normalizeFontSize(48), marginBottom: spacing(2) }}>📦</Text>
                        <Text style={[styles.emptyTitle, { fontSize: normalizeFontSize(18) }]}>
                            Aucun produit
                        </Text>
                        <Text style={[styles.emptyText, { fontSize: normalizeFontSize(14) }]}>
                            Commencez à vendre en ajoutant votre premier produit
                        </Text>
                        <TouchableOpacity
                            style={[styles.addButton, { marginTop: spacing(3), padding: spacing(2) }]}
                            onPress={handleAddProduct}
                        >
                            <Text style={[styles.addButtonText, { fontSize: normalizeFontSize(16) }]}>
                                + Ajouter un produit
                            </Text>
                        </TouchableOpacity>
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
    productCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    productImage: {
        borderRadius: 8,
        backgroundColor: '#E0E0E0',
    },
    productInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    productName: {
        fontWeight: '600',
        color: '#2D2D2D',
        marginBottom: 4,
    },
    productPrice: {
        color: '#4CAF50',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    productMeta: {
        flexDirection: 'row',
        gap: 12,
    },
    metaText: {
        color: '#666',
    },
    statusBadge: {
        marginTop: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    pendingBadge: {
        backgroundColor: '#FFF3CD',
    },
    inactiveBadge: {
        backgroundColor: '#F8D7DA',
    },
    statusText: {
        fontWeight: '500',
    },
    deleteButton: {
        justifyContent: 'center',
        alignItems: 'center',
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
    addButton: {
        backgroundColor: '#2D2D2D',
        borderRadius: 8,
        paddingHorizontal: 24,
    },
    addButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
});

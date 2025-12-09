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
    TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { marketplaceApi } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
    { label: 'Tous', value: '' },
    { label: 'Équipement', value: 'equipment' },
    { label: 'Beauté', value: 'beauty_product' },
    { label: 'Accessoire', value: 'accessory' },
    { label: 'Autre', value: 'other' },
];

export const MarketplaceBrowseScreen = () => {
    const { normalizeFontSize, spacing } = useResponsive();
    const navigation = useNavigation<any>();

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        loadProducts();
    }, [selectedCategory]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const filters: any = { limit: 50 };
            if (selectedCategory) filters.category = selectedCategory;
            if (search) filters.search = search;

            const response = await marketplaceApi.getProducts(filters);
            setProducts(response.data || []);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProducts();
        setRefreshing(false);
    };

    const handleSearch = () => {
        loadProducts();
    };

    const renderProduct = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.productCard, { width: '48%', marginBottom: spacing(2) }]}
            onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
        >
            <Image
                source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
                style={styles.productImage}
            />
            <View style={[styles.productInfo, { padding: spacing(1.5) }]}>
                <Text style={[styles.productName, { fontSize: normalizeFontSize(14) }]} numberOfLines={2}>
                    {item.name}
                </Text>
                <Text style={[styles.productPrice, { fontSize: normalizeFontSize(16) }]}>
                    {item.price} XAF
                </Text>
                <View style={styles.productMeta}>
                    <Text style={[styles.metaText, { fontSize: normalizeFontSize(11) }]}>
                        👁️ {item.views_count || 0}
                    </Text>
                    <Text style={[styles.metaText, { fontSize: normalizeFontSize(11) }]}>
                        📦 {item.stock_quantity}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#2D2D2D" />
                </TouchableOpacity>
                <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>Marketplace</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { padding: spacing(2) }]}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#666" />
                    <TextInput
                        style={[styles.searchInput, { fontSize: normalizeFontSize(14), marginLeft: spacing(1) }]}
                        placeholder="Rechercher un produit..."
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={handleSearch}
                    />
                </View>
            </View>

            {/* Category Filter */}
            <View style={{ paddingHorizontal: spacing(2) }}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={CATEGORIES}
                    keyExtractor={(item) => item.value}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.categoryChip,
                                { padding: spacing(1), marginRight: spacing(1) },
                                selectedCategory === item.value && styles.categoryChipActive,
                            ]}
                            onPress={() => setSelectedCategory(item.value)}
                        >
                            <Text
                                style={[
                                    styles.categoryText,
                                    { fontSize: normalizeFontSize(13) },
                                    selectedCategory === item.value && styles.categoryTextActive,
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Products Grid */}
            {loading ? (
                <View style={[styles.centered, { flex: 1 }]}>
                    <ActivityIndicator size="large" color="#2D2D2D" />
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderProduct}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: spacing(2) }}
                    contentContainerStyle={{ paddingTop: spacing(2), paddingBottom: spacing(4) }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={[styles.emptyState, { padding: spacing(4) }]}>
                            <Text style={{ fontSize: normalizeFontSize(48), marginBottom: spacing(2) }}>🛍️</Text>
                            <Text style={[styles.emptyTitle, { fontSize: normalizeFontSize(18) }]}>
                                Aucun produit
                            </Text>
                            <Text style={[styles.emptyText, { fontSize: normalizeFontSize(14) }]}>
                                Aucun produit disponible pour le moment
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
    searchContainer: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    searchInput: {
        flex: 1,
    },
    categoryChip: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginVertical: 8,
    },
    categoryChipActive: {
        backgroundColor: '#2D2D2D',
        borderColor: '#2D2D2D',
    },
    categoryText: {
        color: '#666',
    },
    categoryTextActive: {
        color: '#FFF',
        fontWeight: '600',
    },
    productCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    productImage: {
        width: '100%',
        height: 150,
        backgroundColor: '#E0E0E0',
    },
    productInfo: {
        backgroundColor: '#FFF',
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
        justifyContent: 'space-between',
    },
    metaText: {
        color: '#999',
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

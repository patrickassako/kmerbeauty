import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../i18n/I18nContext';
import api from '../../services/api';

type Props = NativeStackScreenProps<HomeStackParamList, 'PackageProviders'>;

interface ProviderWithPackage {
    id: string;
    nameFr: string;
    nameEn: string;
    quarter: string;
    street?: string;
    landmark: string;
    city: string;
    region: string;
    latitude: number;
    longitude: number;
    rating: number;
    reviewCount: number;
    images: string[];
    packagePrice: number;
    packageDuration: number;
}

export const PackageProvidersScreen: React.FC<Props> = ({ navigation, route }) => {
    const { package: pkg, sortBy = 'distance' } = route.params;
    const { language } = useI18n();
    const [providers, setProviders] = useState<ProviderWithPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const packageName = language === 'fr' ? pkg.nameFr : pkg.nameEn;

    useEffect(() => {
        fetchProviders();
    }, [pkg.id]);

    const fetchProviders = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await api.get(`/service-packages/${pkg.id}/providers`);
            setProviders(data);
        } catch (err: any) {
            console.error('Error fetching providers:', err);
            setError(err.message || 'Failed to fetch providers');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
    };

    const formatDuration = (minutes: number): string => {
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
        }
        return `${minutes} min`;
    };

    const handleProviderPress = (provider: ProviderWithPackage) => {
        // Navigate to booking with package and provider info
        navigation.navigate('Booking', {
            service: pkg as any,
            providerId: provider.id,
            providerType: 'salon',
            providerName: language === 'fr' ? provider.nameFr : provider.nameEn,
            providerPrice: provider.packagePrice,
        });
    };

    const renderProvider = ({ item }: { item: ProviderWithPackage }) => {
        const name = language === 'fr' ? item.nameFr : item.nameEn;
        const image = item.images?.[0];

        return (
            <TouchableOpacity
                style={styles.providerCard}
                onPress={() => handleProviderPress(item)}
                activeOpacity={0.8}
            >
                <View style={styles.providerImageContainer}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.providerImage} />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Ionicons name="business" size={40} color="#ccc" />
                        </View>
                    )}
                </View>

                <View style={styles.providerInfo}>
                    <Text style={styles.providerName} numberOfLines={1}>
                        {name}
                    </Text>

                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={14} color="#666" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {item.quarter}, {item.city}
                        </Text>
                    </View>

                    {item.rating > 0 && (
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={14} color="#FFB800" />
                            <Text style={styles.ratingText}>
                                {item.rating.toFixed(1)} ({item.reviewCount})
                            </Text>
                        </View>
                    )}

                    <View style={styles.priceRow}>
                        <View style={styles.priceInfo}>
                            <Text style={styles.priceLabel}>
                                {language === 'fr' ? 'Prix' : 'Price'}
                            </Text>
                            <Text style={styles.priceValue}>
                                {formatPrice(item.packagePrice)}
                            </Text>
                        </View>
                        <View style={styles.durationInfo}>
                            <Ionicons name="time-outline" size={16} color="#666" />
                            <Text style={styles.durationText}>
                                {formatDuration(item.packageDuration)}
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => handleProviderPress(item)}
                >
                    <Text style={styles.bookButtonText}>
                        {language === 'fr' ? 'Réserver' : 'Book'}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {packageName}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {language === 'fr' ? 'Choisir un prestataire' : 'Choose a provider'}
                    </Text>
                </View>
                <View style={styles.headerRight} />
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#FF6B6B" />
                    <Text style={styles.loadingText}>
                        {language === 'fr' ? 'Chargement...' : 'Loading...'}
                    </Text>
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={60} color="#ccc" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchProviders}>
                        <Text style={styles.retryButtonText}>
                            {language === 'fr' ? 'Réessayer' : 'Retry'}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : providers.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="business-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>
                        {language === 'fr'
                            ? 'Aucun prestataire ne propose ce pack pour le moment'
                            : 'No providers offer this package at the moment'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={providers}
                    renderItem={renderProvider}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextContainer: {
        flex: 1,
        marginHorizontal: 12,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    headerRight: {
        width: 40,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#666',
    },
    errorText: {
        marginTop: 12,
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
    },
    listContent: {
        padding: 16,
    },
    providerCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    providerImageContainer: {
        width: 80,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
    },
    providerImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    providerInfo: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    providerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    locationText: {
        fontSize: 13,
        color: '#666',
        flex: 1,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    ratingText: {
        fontSize: 13,
        color: '#666',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceInfo: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 11,
        color: '#999',
    },
    priceValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FF6B6B',
    },
    durationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    durationText: {
        fontSize: 13,
        color: '#666',
    },
    bookButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'center',
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

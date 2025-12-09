import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Image,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useServices } from '../../hooks/useServices';
import { formatCurrency, type CountryCode } from '../../utils/currency';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';

type CategoryServicesRouteProp = RouteProp<HomeStackParamList, 'CategoryServices'>;
type CategoryServicesNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'CategoryServices'>;

export const CategoryServicesScreen: React.FC = () => {
    const route = useRoute<CategoryServicesRouteProp>();
    const navigation = useNavigation<CategoryServicesNavigationProp>();
    const { category, categoryName } = route.params;

    const { normalizeFontSize, spacing, isTablet, containerPaddingHorizontal } = useResponsive();
    const { language } = useI18n();
    const [countryCode] = useState<CountryCode>('CM');
    const [refreshing, setRefreshing] = useState(false);

    // Load services
    const { services, loading, error, refetch } = useServices();

    // Filter services by category
    const categoryServices = useMemo(() => {
        return services.filter(service => service.category === category);
    }, [services, category]);

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const handleServicePress = (service: any) => {
        navigation.navigate('ServiceDetails', { service });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingHorizontal: spacing(2.5), paddingTop: spacing(6), paddingBottom: spacing(2) }]}>
                <TouchableOpacity
                    style={[styles.backButton, { width: spacing(5), height: spacing(5), borderRadius: spacing(2.5) }]}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={[styles.backIcon, { fontSize: normalizeFontSize(24) }]}>←</Text>
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { fontSize: normalizeFontSize(18) }]} numberOfLines={1}>
                        {categoryName}
                    </Text>
                    <Text style={[styles.headerSubtitle, { fontSize: normalizeFontSize(12) }]}>
                        {loading
                            ? (language === 'fr' ? 'Chargement...' : 'Loading...')
                            : `${categoryServices.length} ${language === 'fr' ? 'service' : 'service'}${categoryServices.length > 1 ? 's' : ''}`
                        }
                    </Text>
                </View>

                <View style={{ width: spacing(5) }} />
            </View>

            {/* Services List */}
            <ScrollView
                style={styles.servicesList}
                contentContainerStyle={{
                    paddingHorizontal: isTablet ? containerPaddingHorizontal + spacing(2.5) : spacing(2.5),
                    paddingBottom: spacing(10),
                    paddingTop: spacing(2),
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Loading State */}
                {loading && !refreshing && (
                    <View style={{ padding: spacing(4), alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#000" />
                        <Text style={{ marginTop: spacing(2), fontSize: normalizeFontSize(14), color: '#666' }}>
                            {language === 'fr' ? 'Chargement des services...' : 'Loading services...'}
                        </Text>
                    </View>
                )}

                {/* Error State */}
                {error && !loading && (
                    <View style={{ padding: spacing(4), alignItems: 'center' }}>
                        <Text style={{ fontSize: normalizeFontSize(14), color: '#ff0000', textAlign: 'center' }}>
                            {language === 'fr'
                                ? 'Erreur lors du chargement. Tirez pour actualiser.'
                                : 'Error loading data. Pull to refresh.'}
                        </Text>
                    </View>
                )}

                {/* Empty State */}
                {!loading && !error && categoryServices.length === 0 && (
                    <View style={{ padding: spacing(4), alignItems: 'center' }}>
                        <Text style={{ fontSize: normalizeFontSize(48), marginBottom: spacing(2) }}>🔍</Text>
                        <Text style={{ fontSize: normalizeFontSize(16), marginBottom: spacing(1), fontWeight: '600' }}>
                            {language === 'fr' ? 'Aucun service' : 'No services'}
                        </Text>
                        <Text style={{ fontSize: normalizeFontSize(14), color: '#666', textAlign: 'center' }}>
                            {language === 'fr'
                                ? 'Aucun service trouvé dans cette catégorie.'
                                : 'No services found in this category.'}
                        </Text>
                    </View>
                )}

                {/* Service Cards */}
                {!loading && categoryServices.length > 0 &&
                    categoryServices.map((service) => (
                        <TouchableOpacity
                            key={service.id}
                            style={[styles.serviceCard, { borderRadius: spacing(2), padding: spacing(2), marginBottom: spacing(2) }]}
                            onPress={() => handleServicePress(service)}
                        >
                            <View style={{ flexDirection: 'row' }}>
                                {/* Image */}
                                <View style={[styles.serviceImage, { width: spacing(10), height: spacing(10), borderRadius: spacing(1.5), marginRight: spacing(1.5) }]}>
                                    {service.images && service.images.length > 0 && service.images[0] ? (
                                        <Image
                                            source={{ uri: service.images[0] }}
                                            style={styles.serviceImageActual}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={styles.serviceImagePlaceholder}>
                                            <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>Service</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Info */}
                                <View style={{ flex: 1, justifyContent: 'space-between' }}>
                                    <View>
                                        <Text style={[styles.serviceName, { fontSize: normalizeFontSize(16), marginBottom: spacing(0.5) }]} numberOfLines={2}>
                                            {language === 'fr' ? service.name_fr : service.name_en}
                                        </Text>
                                        <Text style={[styles.serviceDescription, { fontSize: normalizeFontSize(12), color: '#666' }]} numberOfLines={2}>
                                            {language === 'fr' ? service.description_fr : service.description_en}
                                        </Text>
                                    </View>

                                    <View style={styles.serviceFooter}>
                                        <Text style={[styles.servicePrice, { fontSize: normalizeFontSize(16) }]}>
                                            {formatCurrency(service.base_price, countryCode)}
                                        </Text>
                                        <Text style={[styles.serviceDuration, { fontSize: normalizeFontSize(12) }]}>
                                            ⏰ {service.duration}min
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Providers count badge */}
                            <View style={[styles.providersBadge, { marginTop: spacing(1.5), alignSelf: 'flex-start', paddingHorizontal: spacing(1), paddingVertical: spacing(0.5), borderRadius: spacing(1) }]}>
                                <Text style={[styles.providersBadgeText, { fontSize: normalizeFontSize(10) }]}>
                                    {service.provider_count || 0} {language === 'fr' ? 'prestataires disponibles' : 'providers available'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        color: '#2D2D2D',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 16,
    },
    headerTitle: {
        fontWeight: '700',
        color: '#2D2D2D',
        textAlign: 'center',
    },
    headerSubtitle: {
        color: '#999',
        marginTop: 2,
    },
    servicesList: {
        flex: 1,
    },
    serviceCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    serviceImage: {
        backgroundColor: '#F5F5F5',
        overflow: 'hidden',
    },
    serviceImageActual: {
        width: '100%',
        height: '100%',
    },
    serviceImagePlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
    },
    placeholderText: {
        color: '#999',
    },
    serviceName: {
        fontWeight: '600',
        color: '#2D2D2D',
    },
    serviceDescription: {
        marginBottom: 8,
    },
    serviceFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    servicePrice: {
        color: '#FF6B6B',
        fontWeight: '700',
    },
    serviceDuration: {
        color: '#666',
    },
    providersBadge: {
        backgroundColor: '#E3F2FD',
    },
    providersBadgeText: {
        color: '#1976D2',
        fontWeight: '600',
    },
});

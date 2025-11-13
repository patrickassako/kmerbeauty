import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useTherapists } from '../../hooks/useTherapists';
import { useSalons } from '../../hooks/useSalons';
import { formatCurrency, type CountryCode } from '../../utils/currency';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';

type ServiceProvidersRouteProp = RouteProp<HomeStackParamList, 'ServiceProviders'>;
type ServiceProvidersNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'ServiceProviders'>;

export const ServiceProvidersScreen: React.FC = () => {
  const route = useRoute<ServiceProvidersRouteProp>();
  const navigation = useNavigation<ServiceProvidersNavigationProp>();
  const { service, sortBy: initialSortBy } = route.params;

  const { normalizeFontSize, spacing, isTablet, containerPaddingHorizontal } = useResponsive();
  const { language } = useI18n();
  const [countryCode] = useState<CountryCode>('CM');
  const [sortBy, setSortBy] = useState<'distance' | 'price'>(initialSortBy || 'distance');
  const [refreshing, setRefreshing] = useState(false);

  // Charger les thérapeutes et salons qui offrent ce service
  const {
    therapists,
    loading: loadingTherapists,
    error: errorTherapists,
    refetch: refetchTherapists,
  } = useTherapists({ serviceId: service.id });

  const {
    salons,
    loading: loadingSalons,
    error: errorSalons,
    refetch: refetchSalons,
  } = useSalons({ serviceId: service.id });

  const loading = loadingTherapists || loadingSalons;
  const error = errorTherapists || errorSalons;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchTherapists(), refetchSalons()]);
    setRefreshing(false);
  };

  // Convertir therapists et salons en format provider unifié
  const providers = useMemo(() => {
    const therapistProviders = therapists.map((therapist) => ({
      type: 'therapist' as const,
      id: therapist.id,
      name: `${therapist.user?.first_name || ''} ${therapist.user?.last_name || ''}`.trim() || 'Thérapeute',
      rating: therapist.rating,
      review_count: therapist.review_count,
      price: service.base_price, // TODO: Get actual price from therapist_services
      duration: service.duration,
      distance: 0, // TODO: Calculate distance based on user location
      city: therapist.city,
      region: therapist.region,
    }));

    const salonProviders = salons.map((salon) => ({
      type: 'salon' as const,
      id: salon.id,
      name: (language === 'fr' ? salon.name_fr : salon.name_en) || salon.name_fr || salon.name_en || 'Institut',
      rating: salon.rating,
      review_count: salon.review_count,
      price: service.base_price, // TODO: Get actual price from salon_services
      duration: service.duration,
      distance: 0, // TODO: Calculate distance based on user location
      city: salon.city,
      region: salon.region,
    }));

    return [...therapistProviders, ...salonProviders];
  }, [therapists, salons, service, language]);

  // Trier les prestataires selon le critère sélectionné
  const sortedProviders = useMemo(() => {
    const providersCopy = [...providers];

    if (sortBy === 'distance') {
      return providersCopy.sort((a, b) => {
        const distA = a.distance || 999;
        const distB = b.distance || 999;
        return distA - distB;
      });
    } else {
      return providersCopy.sort((a, b) => a.price - b.price);
    }
  }, [providers, sortBy]);

  const handleProviderPress = (provider: typeof providers[0]) => {
    navigation.navigate('ProviderDetails', {
      providerId: provider.id,
      providerType: provider.type,
    });
  };

  const handleContactPress = (provider: typeof providers[0]) => {
    navigation.navigate('Chat', {
      providerId: provider.id,
      providerType: provider.type,
    });
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
            {(language === 'fr' ? service.name_fr : service.name_en) || 'Service'}
          </Text>
          <Text style={[styles.headerSubtitle, { fontSize: normalizeFontSize(12) }]}>
            {loading
              ? 'Chargement...'
              : `${providers.length} prestataire${providers.length > 1 ? 's' : ''} disponible${providers.length > 1 ? 's' : ''}`
            }
          </Text>
        </View>

        <View style={{ width: spacing(5) }} />
      </View>

      {/* Service Info Card */}
      <View style={[styles.serviceInfoCard, { marginHorizontal: spacing(2.5), marginBottom: spacing(2), padding: spacing(2), borderRadius: spacing(2) }]}>
        {(service.description_fr || service.description_en) && (
          <Text style={[styles.serviceDescription, { fontSize: normalizeFontSize(14), marginBottom: spacing(1.5), lineHeight: normalizeFontSize(20) }]}>
            {language === 'fr' ? service.description_fr : service.description_en}
          </Text>
        )}
        <View style={styles.serviceInfoRow}>
          <View style={styles.serviceInfoItem}>
            <Text style={[styles.serviceInfoLabel, { fontSize: normalizeFontSize(12) }]}>Durée</Text>
            <Text style={[styles.serviceInfoValue, { fontSize: normalizeFontSize(14) }]}>
              ⏰ {service.duration ? `${service.duration}min` : 'N/A'}
            </Text>
          </View>
          <View style={styles.serviceInfoItem}>
            <Text style={[styles.serviceInfoLabel, { fontSize: normalizeFontSize(12) }]}>Prix à partir de</Text>
            <Text style={[styles.serviceInfoValue, { fontSize: normalizeFontSize(14) }]}>
              {service.base_price ? formatCurrency(service.base_price, countryCode) : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Sort Filters */}
      <View style={[styles.sortContainer, { paddingHorizontal: spacing(2.5), marginBottom: spacing(2) }]}>
        <Text style={[styles.sortLabel, { fontSize: normalizeFontSize(14), marginRight: spacing(2) }]}>Trier par:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === 'distance' && styles.sortButtonActive,
              { paddingHorizontal: spacing(2), paddingVertical: spacing(1), borderRadius: spacing(2) }
            ]}
            onPress={() => setSortBy('distance')}
          >
            <Text style={[
              styles.sortButtonText,
              sortBy === 'distance' && styles.sortButtonTextActive,
              { fontSize: normalizeFontSize(12) }
            ]}>
              📍 Proximité
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === 'price' && styles.sortButtonActive,
              { paddingHorizontal: spacing(2), paddingVertical: spacing(1), borderRadius: spacing(2), marginLeft: spacing(1.5) }
            ]}
            onPress={() => setSortBy('price')}
          >
            <Text style={[
              styles.sortButtonText,
              sortBy === 'price' && styles.sortButtonTextActive,
              { fontSize: normalizeFontSize(12) }
            ]}>
              💰 Prix
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Providers List */}
      <ScrollView
        style={styles.providersList}
        contentContainerStyle={{
          paddingHorizontal: isTablet ? containerPaddingHorizontal + spacing(2.5) : spacing(2.5),
          paddingBottom: spacing(10),
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
              {language === 'fr' ? 'Chargement des prestataires...' : 'Loading providers...'}
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
        {!loading && !error && sortedProviders.length === 0 && (
          <View style={{ padding: spacing(4), alignItems: 'center' }}>
            <Text style={{ fontSize: normalizeFontSize(16), marginBottom: spacing(1), fontWeight: '600' }}>
              {language === 'fr' ? 'Aucun prestataire trouvé' : 'No providers found'}
            </Text>
            <Text style={{ fontSize: normalizeFontSize(14), color: '#666', textAlign: 'center' }}>
              {language === 'fr'
                ? 'Aucun prestataire n\'offre ce service pour le moment.'
                : 'No provider offers this service at the moment.'}
            </Text>
          </View>
        )}

        {/* Providers Cards */}
        {!loading && sortedProviders.length > 0 &&
        sortedProviders.map((provider) => (
          <TouchableOpacity
            key={provider.id}
            style={[styles.providerCard, { borderRadius: spacing(2), padding: spacing(2), marginBottom: spacing(2) }]}
            onPress={() => handleProviderPress(provider)}
          >
            {/* Provider Header */}
            <View style={styles.providerHeader}>
              <View style={[styles.providerAvatar, { width: spacing(8), height: spacing(8), borderRadius: spacing(4) }]}>
                <Text style={[styles.providerAvatarText, { fontSize: normalizeFontSize(20) }]}>
                  {provider.type === 'salon' ? '🏪' : '👤'}
                </Text>
              </View>

              <View style={styles.providerInfo}>
                <View style={styles.providerNameRow}>
                  <Text style={[styles.providerName, { fontSize: normalizeFontSize(16) }]} numberOfLines={1}>
                    {provider.name}
                  </Text>
                  {provider.type === 'salon' && (
                    <View style={[styles.salonBadge, { paddingHorizontal: spacing(1), paddingVertical: spacing(0.3), borderRadius: spacing(1) }]}>
                      <Text style={[styles.salonBadgeText, { fontSize: normalizeFontSize(10) }]}>Institut</Text>
                    </View>
                  )}
                </View>

                <View style={styles.providerMeta}>
                  <Text style={[styles.providerRating, { fontSize: normalizeFontSize(12) }]}>
                    ⭐ {provider.rating != null ? provider.rating.toFixed(1) : '5.0'}
                  </Text>
                  <Text style={[styles.providerReviews, { fontSize: normalizeFontSize(12) }]}>
                    ({provider.review_count != null ? provider.review_count : 0} avis)
                  </Text>
                  {provider.distance != null && provider.distance > 0 && (
                    <>
                      <Text style={[styles.metaSeparator, { fontSize: normalizeFontSize(12) }]}>•</Text>
                      <Text style={[styles.providerDistance, { fontSize: normalizeFontSize(12) }]}>
                        📍 {provider.distance.toFixed(1)} km
                      </Text>
                    </>
                  )}
                </View>

                <Text style={[styles.providerLocation, { fontSize: normalizeFontSize(12) }]}>
                  {provider.city || 'Ville inconnue'}, {provider.region || 'Région inconnue'}
                </Text>
              </View>
            </View>

            {/* Provider Details */}
            <View style={[styles.providerDetails, { marginTop: spacing(2), paddingTop: spacing(2), borderTopWidth: 1, borderTopColor: '#F0F0F0' }]}>
              <View style={styles.providerDetailsRow}>
                <View style={styles.providerDetailsItem}>
                  <Text style={[styles.providerDetailsLabel, { fontSize: normalizeFontSize(11) }]}>Prix</Text>
                  <Text style={[styles.providerPrice, { fontSize: normalizeFontSize(16) }]}>
                    {provider.price ? formatCurrency(provider.price, countryCode) : 'N/A'}
                  </Text>
                </View>

                <View style={styles.providerDetailsItem}>
                  <Text style={[styles.providerDetailsLabel, { fontSize: normalizeFontSize(11) }]}>Durée</Text>
                  <Text style={[styles.providerDuration, { fontSize: normalizeFontSize(14) }]}>
                    ⏰ {provider.duration ? `${provider.duration}min` : 'N/A'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.contactButton, { paddingHorizontal: spacing(2), paddingVertical: spacing(1), borderRadius: spacing(1.5) }]}
                  onPress={() => handleContactPress(provider)}
                >
                  <Text style={[styles.contactButtonText, { fontSize: normalizeFontSize(12) }]}>💬 Contacter</Text>
                </TouchableOpacity>
              </View>
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
  serviceInfoCard: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  serviceDescription: {
    color: '#666',
  },
  serviceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  serviceInfoItem: {
    alignItems: 'center',
  },
  serviceInfoLabel: {
    color: '#999',
    marginBottom: 4,
  },
  serviceInfoValue: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sortButtonActive: {
    backgroundColor: '#2D2D2D',
    borderColor: '#2D2D2D',
  },
  sortButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  providersList: {
    flex: 1,
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  providerHeader: {
    flexDirection: 'row',
  },
  providerAvatar: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  providerAvatarText: {},
  providerInfo: {
    flex: 1,
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerName: {
    fontWeight: '700',
    color: '#2D2D2D',
    marginRight: 8,
  },
  salonBadge: {
    backgroundColor: '#E3F2FD',
  },
  salonBadgeText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  providerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerRating: {
    fontWeight: '600',
    color: '#2D2D2D',
    marginRight: 4,
  },
  providerReviews: {
    color: '#999',
    marginRight: 8,
  },
  metaSeparator: {
    color: '#CCC',
    marginRight: 8,
  },
  providerDistance: {
    color: '#666',
  },
  providerLocation: {
    color: '#666',
  },
  providerDetails: {},
  providerDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  providerDetailsItem: {
    alignItems: 'center',
  },
  providerDetailsLabel: {
    color: '#999',
    marginBottom: 4,
  },
  providerPrice: {
    fontWeight: '700',
    color: '#FF6B6B',
  },
  providerDuration: {
    fontWeight: '600',
    color: '#666',
  },
  contactButton: {
    backgroundColor: '#2D2D2D',
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

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
  Modal,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useServiceProviders } from '../../hooks/useServiceProviders';
import { formatCurrency, type CountryCode } from '../../utils/currency';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';

type ServiceProvidersRouteProp = RouteProp<HomeStackParamList, 'ServiceProviders'>;
type ServiceProvidersNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'ServiceProviders'>;

type SortBy = 'distance' | 'rating' | 'price' | 'experience';
type FilterState = {
  minRating: number | null;
  city: string | null;
  district: string | null;
  minExperience: number | null;
};

export const ServiceProvidersScreen: React.FC = () => {
  const route = useRoute<ServiceProvidersRouteProp>();
  const navigation = useNavigation<ServiceProvidersNavigationProp>();
  const { service, sortBy: initialSortBy } = route.params;

  const { normalizeFontSize, spacing, isTablet, containerPaddingHorizontal } = useResponsive();
  const { language } = useI18n();
  const { location, city: userCity, district: userDistrict } = useGeolocation();
  const [countryCode] = useState<CountryCode>('CM');
  const [sortBy, setSortBy] = useState<SortBy>((initialSortBy as SortBy) || 'distance');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    minRating: null,
    city: null,
    district: null,
    minExperience: null,
  });

  // Use the unified service providers hook
  const { providers: rawProviders, loading, refetch } = useServiceProviders({
    serviceId: service.id,
    lat: location?.latitude,
    lng: location?.longitude,
    city: userCity,
    district: userDistrict,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Get unique cities and districts for filter options
  const filterOptions = useMemo(() => {
    const cities = new Set<string>();
    const districts = new Set<string>();
    rawProviders.forEach(p => {
      if (p.city) cities.add(p.city);
      if (p.district) districts.add(p.district);
    });
    return {
      cities: Array.from(cities).sort(),
      districts: Array.from(districts).sort(),
    };
  }, [rawProviders]);

  // Apply filters
  const filteredProviders = useMemo(() => {
    return rawProviders.filter(provider => {
      // Rating filter
      if (filters.minRating !== null && (provider.rating || 0) < filters.minRating) {
        return false;
      }
      // City filter
      if (filters.city && provider.city !== filters.city) {
        return false;
      }
      // District filter
      if (filters.district && provider.district !== filters.district) {
        return false;
      }
      // Experience filter
      if (filters.minExperience !== null && (provider.years_experience || 0) < filters.minExperience) {
        return false;
      }
      return true;
    });
  }, [rawProviders, filters]);

  // Sort providers
  const sortedProviders = useMemo(() => {
    const providersCopy = [...filteredProviders];

    switch (sortBy) {
      case 'distance':
        return providersCopy.sort((a, b) => (a.distance_meters || 99999999) - (b.distance_meters || 99999999));
      case 'rating':
        return providersCopy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'price':
        return providersCopy.sort((a, b) => (a.service_price || 0) - (b.service_price || 0));
      case 'experience':
        return providersCopy.sort((a, b) => (b.years_experience || 0) - (a.years_experience || 0));
      default:
        return providersCopy;
    }
  }, [filteredProviders, sortBy]);

  const activeFiltersCount = [
    filters.minRating,
    filters.city,
    filters.district,
    filters.minExperience,
  ].filter(v => v !== null).length;

  const clearFilters = () => {
    setFilters({
      minRating: null,
      city: null,
      district: null,
      minExperience: null,
    });
  };

  const handleProviderPress = (provider: typeof rawProviders[0]) => {
    navigation.navigate('ProviderDetails', {
      providerId: provider.id,
      providerType: provider.type === 'salon' ? 'salon' : 'therapist',
    });
  };

  const handleBookPress = (provider: typeof rawProviders[0]) => {
    navigation.navigate('Booking', {
      service: service as any,
      providerId: provider.id,
      providerType: provider.type === 'salon' ? 'salon' : 'therapist',
      providerName: provider.name,
      providerPrice: provider.service_price || service.base_price,
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
              : `${sortedProviders.length} prestataire${sortedProviders.length > 1 ? 's' : ''}`
            }
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.filterButton, { width: spacing(5), height: spacing(5), borderRadius: spacing(2.5) }]}
          onPress={() => setShowFilters(true)}
        >
          <Text style={{ fontSize: normalizeFontSize(20) }}>🎛️</Text>
          {activeFiltersCount > 0 && (
            <View style={[styles.filterBadge, { width: spacing(2.5), height: spacing(2.5), borderRadius: spacing(1.25) }]}>
              <Text style={[styles.filterBadgeText, { fontSize: normalizeFontSize(10) }]}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Sort Tabs - Compact */}
      <View style={styles.sortWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing(2.5), gap: spacing(1), alignItems: 'center' }}
        >
          {[
            { key: 'distance' as SortBy, label: '📍 Proximité', icon: '📍' },
            { key: 'rating' as SortBy, label: '⭐ Note', icon: '⭐' },
            { key: 'price' as SortBy, label: '💰 Prix', icon: '💰' },
            { key: 'experience' as SortBy, label: '🎯 Expérience', icon: '🎯' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.sortButton,
                sortBy === item.key && styles.sortButtonActive,
                { paddingHorizontal: spacing(2), paddingVertical: spacing(1), borderRadius: spacing(2) }
              ]}
              onPress={() => setSortBy(item.key)}
            >
              <Text style={[
                styles.sortButtonText,
                sortBy === item.key && styles.sortButtonTextActive,
                { fontSize: normalizeFontSize(12) }
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <View style={[styles.activeFiltersContainer, { paddingHorizontal: spacing(2.5), paddingBottom: spacing(1) }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing(1) }}>
            {filters.minRating && (
              <View style={[styles.activeFilterChip, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(2) }]}>
                <Text style={[styles.activeFilterText, { fontSize: normalizeFontSize(11) }]}>
                  ⭐ {filters.minRating}+
                </Text>
                <TouchableOpacity onPress={() => setFilters(f => ({ ...f, minRating: null }))}>
                  <Text style={[styles.activeFilterClose, { fontSize: normalizeFontSize(14) }]}>×</Text>
                </TouchableOpacity>
              </View>
            )}
            {filters.city && (
              <View style={[styles.activeFilterChip, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(2) }]}>
                <Text style={[styles.activeFilterText, { fontSize: normalizeFontSize(11) }]}>
                  🏙️ {filters.city}
                </Text>
                <TouchableOpacity onPress={() => setFilters(f => ({ ...f, city: null }))}>
                  <Text style={[styles.activeFilterClose, { fontSize: normalizeFontSize(14) }]}>×</Text>
                </TouchableOpacity>
              </View>
            )}
            {filters.district && (
              <View style={[styles.activeFilterChip, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(2) }]}>
                <Text style={[styles.activeFilterText, { fontSize: normalizeFontSize(11) }]}>
                  📍 {filters.district}
                </Text>
                <TouchableOpacity onPress={() => setFilters(f => ({ ...f, district: null }))}>
                  <Text style={[styles.activeFilterClose, { fontSize: normalizeFontSize(14) }]}>×</Text>
                </TouchableOpacity>
              </View>
            )}
            {filters.minExperience && (
              <View style={[styles.activeFilterChip, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(2) }]}>
                <Text style={[styles.activeFilterText, { fontSize: normalizeFontSize(11) }]}>
                  🎯 {filters.minExperience}+ ans
                </Text>
                <TouchableOpacity onPress={() => setFilters(f => ({ ...f, minExperience: null }))}>
                  <Text style={[styles.activeFilterClose, { fontSize: normalizeFontSize(14) }]}>×</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={clearFilters}>
              <Text style={[styles.clearFiltersText, { fontSize: normalizeFontSize(11) }]}>Effacer tout</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Providers List */}
      <ScrollView
        style={styles.providersList}
        contentContainerStyle={{
          paddingHorizontal: isTablet ? containerPaddingHorizontal + spacing(2.5) : spacing(2.5),
          paddingBottom: spacing(12),
          flexGrow: 1,
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

        {/* Empty State */}
        {!loading && sortedProviders.length === 0 && (
          <View style={{ padding: spacing(4), alignItems: 'center' }}>
            <Text style={{ fontSize: normalizeFontSize(40), marginBottom: spacing(2) }}>🔍</Text>
            <Text style={{ fontSize: normalizeFontSize(16), marginBottom: spacing(1), fontWeight: '600', textAlign: 'center' }}>
              {activeFiltersCount > 0
                ? 'Aucun résultat avec ces filtres'
                : 'Aucun prestataire trouvé'
              }
            </Text>
            <Text style={{ fontSize: normalizeFontSize(14), color: '#666', textAlign: 'center' }}>
              {activeFiltersCount > 0
                ? 'Essayez de modifier vos critères de recherche'
                : 'Aucun prestataire n\'offre ce service pour le moment.'
              }
            </Text>
            {activeFiltersCount > 0 && (
              <TouchableOpacity
                style={[styles.clearFiltersButton, { marginTop: spacing(2), paddingHorizontal: spacing(3), paddingVertical: spacing(1.5), borderRadius: spacing(2) }]}
                onPress={clearFilters}
              >
                <Text style={[styles.clearFiltersButtonText, { fontSize: normalizeFontSize(14) }]}>
                  Effacer les filtres
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Providers Cards */}
        {!loading && sortedProviders.map((provider) => {
          const price = provider.service_price || service.base_price;
          const isSalon = provider.type === 'salon';

          // Match badge
          let matchBadge = null;
          if (provider.match_type === 'district_match') {
            matchBadge = { text: 'Même quartier', color: '#4CAF50', bg: '#E8F5E9' };
          } else if (provider.match_type === 'city_match') {
            matchBadge = { text: 'Même ville', color: '#2196F3', bg: '#E3F2FD' };
          }

          return (
            <TouchableOpacity
              key={provider.id}
              style={[styles.providerCard, { borderRadius: spacing(2), padding: spacing(2), marginBottom: spacing(2) }]}
              onPress={() => handleProviderPress(provider)}
            >
              {/* Provider Header */}
              <View style={styles.providerHeader}>
                <View style={[styles.providerAvatar, { width: spacing(10), height: spacing(10), borderRadius: spacing(5) }]}>
                  {provider.image ? (
                    <Image
                      source={{ uri: provider.image }}
                      style={[styles.providerAvatarImage, { width: spacing(10), height: spacing(10), borderRadius: spacing(5) }]}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={[styles.providerAvatarText, { fontSize: normalizeFontSize(24) }]}>
                      {isSalon ? '🏪' : '👤'}
                    </Text>
                  )}
                </View>

                <View style={styles.providerInfo}>
                  <View style={styles.providerNameRow}>
                    <Text style={[styles.providerName, { fontSize: normalizeFontSize(16) }]} numberOfLines={1}>
                      {provider.name}
                    </Text>
                    {isSalon && (
                      <View style={[styles.salonBadge, { paddingHorizontal: spacing(1), paddingVertical: spacing(0.3), borderRadius: spacing(1), marginLeft: spacing(1) }]}>
                        <Text style={[styles.salonBadgeText, { fontSize: normalizeFontSize(10) }]}>Institut</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.providerMeta}>
                    <Text style={[styles.providerRating, { fontSize: normalizeFontSize(13) }]}>
                      ⭐ {provider.rating != null ? Number(provider.rating).toFixed(1) : '5.0'}
                    </Text>
                    <Text style={[styles.providerReviews, { fontSize: normalizeFontSize(12) }]}>
                      ({provider.review_count || 0})
                    </Text>
                    {provider.years_experience ? (
                      <>
                        <Text style={[styles.metaSeparator, { fontSize: normalizeFontSize(12) }]}>•</Text>
                        <Text style={[styles.providerExperience, { fontSize: normalizeFontSize(12) }]}>
                          {provider.years_experience} ans
                        </Text>
                      </>
                    ) : null}
                  </View>

                  <View style={styles.providerLocationRow}>
                    <Text style={[styles.providerLocation, { fontSize: normalizeFontSize(12) }]}>
                      📍 {provider.city || 'Ville inconnue'}
                      {provider.district ? `, ${provider.district}` : ''}
                    </Text>
                    {provider.distance_meters < 999999 && (
                      <Text style={[styles.providerDistance, { fontSize: normalizeFontSize(11) }]}>
                        ({(provider.distance_meters / 1000).toFixed(1)} km)
                      </Text>
                    )}
                  </View>

                  {/* Match Badge */}
                  {matchBadge && (
                    <View style={[styles.matchBadge, { backgroundColor: matchBadge.bg, paddingHorizontal: spacing(1), paddingVertical: spacing(0.3), borderRadius: spacing(1), marginTop: spacing(0.5) }]}>
                      <Text style={{ color: matchBadge.color, fontSize: normalizeFontSize(10), fontWeight: '600' }}>
                        ✓ {matchBadge.text}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Provider Footer */}
              <View style={[styles.providerFooter, { marginTop: spacing(2), paddingTop: spacing(2), borderTopWidth: 1, borderTopColor: '#F0F0F0' }]}>
                <View>
                  <Text style={[styles.priceLabel, { fontSize: normalizeFontSize(11) }]}>Prix</Text>
                  <Text style={[styles.providerPrice, { fontSize: normalizeFontSize(18) }]}>
                    {formatCurrency(price, countryCode)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.bookButton, { paddingHorizontal: spacing(3), paddingVertical: spacing(1.5), borderRadius: spacing(2) }]}
                  onPress={() => handleBookPress(provider)}
                >
                  <Text style={[styles.bookButtonText, { fontSize: normalizeFontSize(14) }]}>
                    Réserver
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.filterModalContainer}>
          {/* Modal Header */}
          <View style={[styles.filterModalHeader, { paddingHorizontal: spacing(2.5), paddingVertical: spacing(2), borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }]}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={[styles.filterModalClose, { fontSize: normalizeFontSize(24) }]}>×</Text>
            </TouchableOpacity>
            <Text style={[styles.filterModalTitle, { fontSize: normalizeFontSize(18) }]}>Filtres</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={[styles.filterModalReset, { fontSize: normalizeFontSize(14) }]}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing(2.5) }}>
            {/* Rating Filter */}
            <View style={[styles.filterSection, { marginBottom: spacing(4) }]}>
              <Text style={[styles.filterSectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(2) }]}>
                ⭐ Note minimum
              </Text>
              <View style={styles.filterOptions}>
                {[null, 3, 4, 4.5].map((rating) => (
                  <TouchableOpacity
                    key={rating ?? 'all'}
                    style={[
                      styles.filterOption,
                      filters.minRating === rating && styles.filterOptionActive,
                      { paddingHorizontal: spacing(2), paddingVertical: spacing(1.5), borderRadius: spacing(2), marginRight: spacing(1), marginBottom: spacing(1) }
                    ]}
                    onPress={() => setFilters(f => ({ ...f, minRating: rating }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.minRating === rating && styles.filterOptionTextActive,
                      { fontSize: normalizeFontSize(14) }
                    ]}>
                      {rating === null ? 'Tous' : `${rating}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* City Filter */}
            <View style={[styles.filterSection, { marginBottom: spacing(4) }]}>
              <Text style={[styles.filterSectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(2) }]}>
                🏙️ Ville
              </Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.city === null && styles.filterOptionActive,
                    { paddingHorizontal: spacing(2), paddingVertical: spacing(1.5), borderRadius: spacing(2), marginRight: spacing(1), marginBottom: spacing(1) }
                  ]}
                  onPress={() => setFilters(f => ({ ...f, city: null }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.city === null && styles.filterOptionTextActive,
                    { fontSize: normalizeFontSize(14) }
                  ]}>
                    Toutes
                  </Text>
                </TouchableOpacity>
                {filterOptions.cities.map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={[
                      styles.filterOption,
                      filters.city === city && styles.filterOptionActive,
                      { paddingHorizontal: spacing(2), paddingVertical: spacing(1.5), borderRadius: spacing(2), marginRight: spacing(1), marginBottom: spacing(1) }
                    ]}
                    onPress={() => setFilters(f => ({ ...f, city }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.city === city && styles.filterOptionTextActive,
                      { fontSize: normalizeFontSize(14) }
                    ]}>
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* District Filter */}
            <View style={[styles.filterSection, { marginBottom: spacing(4) }]}>
              <Text style={[styles.filterSectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(2) }]}>
                📍 Quartier
              </Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.district === null && styles.filterOptionActive,
                    { paddingHorizontal: spacing(2), paddingVertical: spacing(1.5), borderRadius: spacing(2), marginRight: spacing(1), marginBottom: spacing(1) }
                  ]}
                  onPress={() => setFilters(f => ({ ...f, district: null }))}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.district === null && styles.filterOptionTextActive,
                    { fontSize: normalizeFontSize(14) }
                  ]}>
                    Tous
                  </Text>
                </TouchableOpacity>
                {filterOptions.districts.slice(0, 10).map((district) => (
                  <TouchableOpacity
                    key={district}
                    style={[
                      styles.filterOption,
                      filters.district === district && styles.filterOptionActive,
                      { paddingHorizontal: spacing(2), paddingVertical: spacing(1.5), borderRadius: spacing(2), marginRight: spacing(1), marginBottom: spacing(1) }
                    ]}
                    onPress={() => setFilters(f => ({ ...f, district }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.district === district && styles.filterOptionTextActive,
                      { fontSize: normalizeFontSize(14) }
                    ]}>
                      {district}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Experience Filter */}
            <View style={[styles.filterSection, { marginBottom: spacing(4) }]}>
              <Text style={[styles.filterSectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(2) }]}>
                🎯 Années d'expérience
              </Text>
              <View style={styles.filterOptions}>
                {[null, 1, 3, 5, 10].map((exp) => (
                  <TouchableOpacity
                    key={exp ?? 'all'}
                    style={[
                      styles.filterOption,
                      filters.minExperience === exp && styles.filterOptionActive,
                      { paddingHorizontal: spacing(2), paddingVertical: spacing(1.5), borderRadius: spacing(2), marginRight: spacing(1), marginBottom: spacing(1) }
                    ]}
                    onPress={() => setFilters(f => ({ ...f, minExperience: exp }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.minExperience === exp && styles.filterOptionTextActive,
                      { fontSize: normalizeFontSize(14) }
                    ]}>
                      {exp === null ? 'Tous' : `${exp}+ ans`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View style={[styles.filterModalFooter, { padding: spacing(2.5), borderTopWidth: 1, borderTopColor: '#F0F0F0' }]}>
            <TouchableOpacity
              style={[styles.applyButton, { paddingVertical: spacing(2), borderRadius: spacing(2) }]}
              onPress={() => setShowFilters(false)}
            >
              <Text style={[styles.applyButtonText, { fontSize: normalizeFontSize(16) }]}>
                Voir {sortedProviders.length} résultat{sortedProviders.length > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  filterButton: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sortWrapper: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  activeFiltersContainer: {},
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    gap: 4,
  },
  activeFilterText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  activeFilterClose: {
    color: '#1976D2',
    fontWeight: '700',
    marginLeft: 4,
  },
  clearFiltersText: {
    color: '#FF6B6B',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  clearFiltersButton: {
    backgroundColor: '#FF6B6B',
  },
  clearFiltersButtonText: {
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
    overflow: 'hidden',
  },
  providerAvatarImage: {},
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
    flex: 1,
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
  providerExperience: {
    color: '#666',
  },
  providerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerLocation: {
    color: '#666',
  },
  providerDistance: {
    color: '#999',
    marginLeft: 8,
  },
  matchBadge: {
    alignSelf: 'flex-start',
  },
  providerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    color: '#999',
    marginBottom: 2,
  },
  providerPrice: {
    fontWeight: '700',
    color: '#FF6B6B',
  },
  bookButton: {
    backgroundColor: '#2D2D2D',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Filter Modal Styles
  filterModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterModalClose: {
    color: '#2D2D2D',
    fontWeight: '700',
  },
  filterModalTitle: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  filterModalReset: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  filterSection: {},
  filterSectionTitle: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterOptionActive: {
    backgroundColor: '#2D2D2D',
    borderColor: '#2D2D2D',
  },
  filterOptionText: {
    color: '#666',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterModalFooter: {
    backgroundColor: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

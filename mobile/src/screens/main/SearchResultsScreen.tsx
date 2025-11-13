import React, { useState, useEffect, useMemo } from 'react';
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
import { useTherapists } from '../../hooks/useTherapists';
import { useSalons } from '../../hooks/useSalons';
import { useCategories } from '../../hooks/useCategories';
import { formatCurrency, type CountryCode } from '../../utils/currency';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { SearchFilters } from '../../components/AdvancedSearchModal';

type SearchResultsRouteProp = RouteProp<HomeStackParamList, 'SearchResults'>;
type SearchResultsNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'SearchResults'>;

export const SearchResultsScreen: React.FC = () => {
  const route = useRoute<SearchResultsRouteProp>();
  const navigation = useNavigation<SearchResultsNavigationProp>();
  const { filters } = route.params;

  const { normalizeFontSize, spacing, isTablet, containerPaddingHorizontal } = useResponsive();
  const { language } = useI18n();
  const { categories } = useCategories();
  const [countryCode] = useState<CountryCode>('CM');
  const [refreshing, setRefreshing] = useState(false);

  // Trouver le nom de la catégorie sélectionnée
  const selectedCategory = categories.find(cat => cat.category === filters.category);
  const categoryDisplayName = selectedCategory
    ? (language === 'fr' ? selectedCategory.name_fr : selectedCategory.name_en)
    : filters.category;

  // Charger les thérapeutes et salons selon les filtres
  const {
    therapists,
    loading: loadingTherapists,
    error: errorTherapists,
    refetch: refetchTherapists,
  } = useTherapists({ city: filters.city });

  const {
    salons,
    loading: loadingSalons,
    error: errorSalons,
    refetch: refetchSalons,
  } = useSalons({ city: filters.city });

  const loading = loadingTherapists || loadingSalons;
  const error = errorTherapists || errorSalons;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchTherapists(), refetchSalons()]);
    setRefreshing(false);
  };

  // Convertir therapists et salons en format provider unifié
  const providers = useMemo(() => {
    let allProviders: any[] = [];

    // Ajouter les thérapeutes si le filtre le permet
    if (filters.providerType === 'all' || filters.providerType === 'therapist') {
      const therapistProviders = therapists
        .filter((therapist) => {
          // Filtrer par texte de recherche si spécifié
          if (filters.searchText) {
            const searchLower = filters.searchText.toLowerCase();
            const fullName = `${therapist.user?.first_name || ''} ${therapist.user?.last_name || ''}`.toLowerCase();
            if (!fullName.includes(searchLower)) {
              return false;
            }
          }
          // Filtrer par quartier si spécifié
          if (filters.quarter && therapist.region !== filters.quarter) {
            return false;
          }
          return true;
        })
        .map((therapist) => ({
          type: 'therapist' as const,
          id: therapist.id,
          name: `${therapist.user?.first_name || ''} ${therapist.user?.last_name || ''}`.trim() || 'Thérapeute',
          avatar: therapist.profile_image || (therapist.portfolio_images && therapist.portfolio_images.length > 0 ? therapist.portfolio_images[0] : null),
          rating: therapist.rating,
          review_count: therapist.review_count,
          price: 0, // Prix moyen à calculer
          distance: 0, // TODO: Calculate distance based on user location
          city: therapist.city,
          region: therapist.region,
        }));

      allProviders = [...allProviders, ...therapistProviders];
    }

    // Ajouter les salons si le filtre le permet
    if (filters.providerType === 'all' || filters.providerType === 'salon') {
      const salonProviders = salons
        .filter((salon) => {
          // Filtrer par texte de recherche si spécifié
          if (filters.searchText) {
            const searchLower = filters.searchText.toLowerCase();
            const salonName = (language === 'fr' ? salon.name_fr : salon.name_en || salon.name_fr || salon.name_en || '').toLowerCase();
            if (!salonName.includes(searchLower)) {
              return false;
            }
          }
          // Filtrer par quartier si spécifié
          if (filters.quarter && salon.quarter !== filters.quarter) {
            return false;
          }
          return true;
        })
        .map((salon) => ({
          type: 'salon' as const,
          id: salon.id,
          name: (language === 'fr' ? salon.name_fr : salon.name_en) || salon.name_fr || salon.name_en || 'Institut',
          avatar: salon.logo || salon.cover_image || (salon.ambiance_images && salon.ambiance_images.length > 0 ? salon.ambiance_images[0] : null),
          rating: salon.rating,
          review_count: salon.review_count,
          price: 0, // Prix moyen à calculer
          distance: 0, // TODO: Calculate distance based on user location
          city: salon.city,
          region: salon.quarter,
        }));

      allProviders = [...allProviders, ...salonProviders];
    }

    // Filtrer par distance si spécifié
    if (filters.maxDistance) {
      allProviders = allProviders.filter((p) => p.distance <= (filters.maxDistance || 999));
    }

    // Trier selon le critère sélectionné
    if (filters.sortBy === 'rating') {
      allProviders.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filters.sortBy === 'price_asc') {
      allProviders.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'price_desc') {
      allProviders.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === 'distance') {
      allProviders.sort((a, b) => a.distance - b.distance);
    }

    return allProviders;
  }, [therapists, salons, filters, language]);

  const handleProviderPress = (provider: typeof providers[0]) => {
    navigation.navigate('ProviderDetails', {
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
            {language === 'fr' ? 'Résultats de recherche' : 'Search Results'}
          </Text>
          <Text style={[styles.headerSubtitle, { fontSize: normalizeFontSize(12) }]}>
            {loading
              ? 'Chargement...'
              : `${providers.length} ${language === 'fr' ? 'résultat' : 'result'}${providers.length > 1 ? 's' : ''}`
            }
          </Text>
        </View>

        <View style={{ width: spacing(5) }} />
      </View>

      {/* Applied Filters */}
      <ScrollView
        horizontal
        style={[styles.filterChips, { paddingHorizontal: spacing(2.5), marginBottom: spacing(2) }]}
        showsHorizontalScrollIndicator={false}
      >
        {filters.searchText && (
          <View style={[styles.filterChip, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(1.5), marginRight: spacing(1) }]}>
            <Text style={[styles.filterChipText, { fontSize: normalizeFontSize(11) }]}>
              🔍 {filters.searchText}
            </Text>
          </View>
        )}
        {filters.category && (
          <View style={[styles.filterChip, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(1.5), marginRight: spacing(1) }]}>
            <Text style={[styles.filterChipText, { fontSize: normalizeFontSize(11) }]}>
              📂 {categoryDisplayName}
            </Text>
          </View>
        )}
        {filters.city && (
          <View style={[styles.filterChip, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(1.5), marginRight: spacing(1) }]}>
            <Text style={[styles.filterChipText, { fontSize: normalizeFontSize(11) }]}>
              📍 {filters.city}
            </Text>
          </View>
        )}
        {filters.quarter && (
          <View style={[styles.filterChip, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(1.5), marginRight: spacing(1) }]}>
            <Text style={[styles.filterChipText, { fontSize: normalizeFontSize(11) }]}>
              🏘️ {filters.quarter}
            </Text>
          </View>
        )}
        {filters.maxDistance && (
          <View style={[styles.filterChip, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(1.5), marginRight: spacing(1) }]}>
            <Text style={[styles.filterChipText, { fontSize: normalizeFontSize(11) }]}>
              📏 ≤{filters.maxDistance}km
            </Text>
          </View>
        )}
        {filters.providerType && filters.providerType !== 'all' && (
          <View style={[styles.filterChip, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(1.5), marginRight: spacing(1) }]}>
            <Text style={[styles.filterChipText, { fontSize: normalizeFontSize(11) }]}>
              {filters.providerType === 'therapist' ? '👤 Thérapeutes' : '🏪 Instituts'}
            </Text>
          </View>
        )}
      </ScrollView>

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
              {language === 'fr' ? 'Recherche en cours...' : 'Searching...'}
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
        {!loading && !error && providers.length === 0 && (
          <View style={{ padding: spacing(4), alignItems: 'center' }}>
            <Text style={{ fontSize: normalizeFontSize(48), marginBottom: spacing(2) }}>🔍</Text>
            <Text style={{ fontSize: normalizeFontSize(16), marginBottom: spacing(1), fontWeight: '600' }}>
              {language === 'fr' ? 'Aucun résultat' : 'No results'}
            </Text>
            <Text style={{ fontSize: normalizeFontSize(14), color: '#666', textAlign: 'center' }}>
              {language === 'fr'
                ? 'Essayez d\'ajuster vos filtres de recherche.'
                : 'Try adjusting your search filters.'}
            </Text>
          </View>
        )}

        {/* Providers Cards */}
        {!loading && providers.length > 0 &&
        providers.map((provider) => (
          <TouchableOpacity
            key={`${provider.type}-${provider.id}`}
            style={[styles.providerCard, { borderRadius: spacing(2), padding: spacing(2), marginBottom: spacing(2) }]}
            onPress={() => handleProviderPress(provider)}
          >
            {/* Provider Header */}
            <View style={styles.providerHeader}>
              <View style={[styles.providerAvatar, { width: spacing(8), height: spacing(8), borderRadius: spacing(4) }]}>
                {provider.avatar ? (
                  <Image
                    source={{ uri: provider.avatar }}
                    style={[styles.providerAvatarImage, { width: spacing(8), height: spacing(8), borderRadius: spacing(4) }]}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={[styles.providerAvatarText, { fontSize: normalizeFontSize(20) }]}>
                    {provider.type === 'salon' ? '🏪' : '👤'}
                  </Text>
                )}
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
  filterChips: {
    maxHeight: 50,
  },
  filterChip: {
    backgroundColor: '#E3F2FD',
  },
  filterChipText: {
    color: '#1976D2',
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
  providerAvatarImage: {
    width: '100%',
    height: '100%',
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
});

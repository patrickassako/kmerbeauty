import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useService } from '../../hooks/useServices';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useServiceProviders } from '../../hooks/useServiceProviders';
import { formatCurrency, type CountryCode } from '../../utils/currency';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ServiceDetailsRouteProp = RouteProp<HomeStackParamList, 'ServiceDetails'>;
type ServiceDetailsNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'ServiceDetails'>;

export const ServiceDetailsScreen: React.FC = () => {
  const route = useRoute<ServiceDetailsRouteProp>();
  const navigation = useNavigation<ServiceDetailsNavigationProp>();
  const { service: serviceParam } = route.params;

  const { normalizeFontSize, spacing, isTablet, containerPaddingHorizontal } = useResponsive();
  const { language } = useI18n();
  const [expandedSection, setExpandedSection] = useState<string | null>('whatsIncluded');
  const [countryCode] = useState<CountryCode>('CM');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<{
    id: string;
    type: 'therapist' | 'salon';
    name: string;
    price: number;
  } | null>(null);

  // Charger les détails du service
  const { service: serviceData, loading: loadingService } = useService(serviceParam.id);

  // Géolocalisation pour le tri intelligent
  const { location, city, district } = useGeolocation();

  // Charger les prestataires unifiés et triés
  const { providers, loading: loadingProviders, refetch: refetchProviders } = useServiceProviders({
    serviceId: serviceParam.id,
    lat: location?.latitude,
    lng: location?.longitude,
    city,
    district
  });

  const loading = loadingService || loadingProviders;
  const service = serviceData || serviceParam;
  const totalProviders = providers.length;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchProviders();
    setRefreshing(false);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleSelectProvider = (providerId: string, providerType: 'therapist' | 'salon', providerName: string, price: number) => {
    if (selectedProvider?.id === providerId) {
      setSelectedProvider(null);
    } else {
      setSelectedProvider({
        id: providerId,
        type: providerType,
        name: providerName,
        price,
      });
    }
  };

  const handleViewProviderDetails = (providerId: string, providerType: 'therapist' | 'salon') => {
    navigation.navigate('ProviderDetails', { providerId, providerType });
  };

  const handleViewProviders = () => {
    navigation.navigate('ServiceProviders', { service: service as any });
  };

  const handleBookNow = () => {
    if (!selectedProvider) {
      return;
    }

    navigation.navigate('Booking', {
      service: service as any,
      providerId: selectedProvider.id,
      providerType: selectedProvider.type,
      providerName: selectedProvider.name,
      providerPrice: selectedProvider.price,
    });
  };

  const components = service.components || [
    'Consultation et analyse des besoins',
    'Préparation et nettoyage',
    'Application des produits professionnels',
    'Techniques avancées de traitement',
    'Massage relaxant',
    'Finition et conseils personnalisés',
  ];

  return (
    <View style={styles.container}>
      {/* Header Image Gallery - Responsive height */}
      <View style={[styles.headerImageContainer, { height: isTablet ? spacing(50) : spacing(28) }]}>
        {service.images && service.images.length > 0 && service.images[0] ? (
          <Image
            source={{ uri: service.images[0] }}
            style={styles.headerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.headerImagePlaceholder}>
            <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(16) }]}>
              Service Photos
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.backButton, { top: spacing(6), left: spacing(2), width: spacing(5), height: spacing(5) }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { fontSize: normalizeFontSize(24) }]}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.closeButton, { top: spacing(6), right: spacing(2), width: spacing(5), height: spacing(5) }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.closeIcon, { fontSize: normalizeFontSize(20) }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Content - Full scroll */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingBottom: spacing(14),
          paddingHorizontal: isTablet ? containerPaddingHorizontal : 0,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={[styles.contentInner, { paddingHorizontal: spacing(2.5), paddingTop: spacing(3) }]}>
          {loading ? (
            <View style={[styles.loadingContainer, { paddingVertical: spacing(10) }]}>
              <ActivityIndicator size="large" color="#2D2D2D" />
              <Text style={[styles.loadingText, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
                Chargement...
              </Text>
            </View>
          ) : (
            <>
              {/* Name */}
              <Text style={[styles.name, { fontSize: normalizeFontSize(28), marginBottom: spacing(1) }]}>
                {language === 'fr' ? service.name_fr : service.name_en}
              </Text>

              {/* Category */}
              <View style={[styles.categoryRow, { marginBottom: spacing(1) }]}>
                <View style={[styles.categoryBadge, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(2) }]}>
                  <Text style={[styles.categoryText, { fontSize: normalizeFontSize(12) }]}>
                    {service.category}
                  </Text>
                </View>
              </View>

              {/* Price & Duration */}
              <View style={[styles.priceRow, { marginBottom: spacing(2) }]}>
                <Text style={[styles.price, { fontSize: normalizeFontSize(24) }]}>
                  À partir de {formatCurrency(service.base_price, countryCode)}
                </Text>
                <Text style={[styles.duration, { fontSize: normalizeFontSize(14) }]}>
                  ⏰ {service.duration} min
                </Text>
              </View>

              {/* Description */}
              {(service.description_fr || service.description_en) && (
                <Text style={[styles.description, { fontSize: normalizeFontSize(14), marginBottom: spacing(3), lineHeight: normalizeFontSize(20) }]}>
                  {language === 'fr' ? service.description_fr : service.description_en}
                </Text>
              )}

              {/* Providers List Section */}
              {totalProviders > 0 && (
                <View style={[{ marginBottom: spacing(3) }]}>
                  <View style={[styles.sectionHeaderRow, { marginBottom: spacing(2) }]}>
                    <View>
                      <Text style={[styles.providerLabel, { fontSize: normalizeFontSize(12) }]}>
                        DISPONIBLE CHEZ
                      </Text>
                      <Text style={[styles.providerCount, { fontSize: normalizeFontSize(16), marginTop: spacing(0.5) }]}>
                        {totalProviders} prestataire{totalProviders > 1 ? 's' : ''} à proximité
                      </Text>
                    </View>
                    {totalProviders > 5 && (
                      <TouchableOpacity onPress={handleViewProviders}>
                        <Text style={[styles.viewAllButton, { fontSize: normalizeFontSize(14) }]}>
                          Voir tous →
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Unified Providers List */}
                  {providers.slice(0, 5).map((provider) => {
                    const isSelected = selectedProvider?.id === provider.id;
                    const price = provider.service_price || service.base_price;
                    const isSalon = provider.type === 'salon';

                    // Badges de matching
                    let matchBadge = null;
                    if (provider.match_type === 'district_match') {
                      matchBadge = { text: 'Quartier', color: '#4CAF50', bg: '#E8F5E9' };
                    } else if (provider.match_type === 'city_match') {
                      matchBadge = { text: 'Ville', color: '#2196F3', bg: '#E3F2FD' };
                    }

                    return (
                      <View key={provider.id} style={[{ marginBottom: spacing(2) }]}>
                        <TouchableOpacity
                          style={[
                            styles.providerCard,
                            { padding: spacing(2), borderRadius: spacing(2) },
                            isSelected && styles.providerCardSelected,
                          ]}
                          onPress={() => handleSelectProvider(provider.id, isSalon ? 'salon' : 'therapist', provider.name, price)}
                        >
                          <View style={styles.providerCardContent}>
                            <View style={[styles.providerAvatar, { width: spacing(8), height: spacing(8), borderRadius: spacing(4) }]}>
                              {provider.image ? (
                                <Image
                                  source={{ uri: provider.image }}
                                  style={[styles.providerAvatarImage, { width: spacing(8), height: spacing(8), borderRadius: spacing(4) }]}
                                  resizeMode="cover"
                                />
                              ) : (
                                <Text style={[styles.providerAvatarText, { fontSize: normalizeFontSize(20) }]}>
                                  {isSalon ? '🏪' : '👤'}
                                </Text>
                              )}
                              {isSelected && (
                                <View style={[styles.selectedBadge, { position: 'absolute', top: 0, right: 0, width: spacing(3), height: spacing(3), borderRadius: spacing(1.5) }]}>
                                  <Text style={[styles.selectedBadgeText, { fontSize: normalizeFontSize(12) }]}>✓</Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.providerCardInfo}>
                              <View style={styles.providerCardNameRow}>
                                <Text style={[styles.providerCardName, { fontSize: normalizeFontSize(16), flex: 1 }]} numberOfLines={1}>
                                  {provider.name}
                                </Text>

                                {matchBadge && (
                                  <View style={{
                                    backgroundColor: matchBadge.bg,
                                    paddingHorizontal: spacing(1),
                                    paddingVertical: spacing(0.3),
                                    borderRadius: spacing(1),
                                    marginLeft: spacing(1)
                                  }}>
                                    <Text style={{ color: matchBadge.color, fontSize: normalizeFontSize(10), fontWeight: '600' }}>
                                      {matchBadge.text}
                                    </Text>
                                  </View>
                                )}

                                {isSalon && (
                                  <View style={[styles.salonBadge, { paddingHorizontal: spacing(1), paddingVertical: spacing(0.3), borderRadius: spacing(1), marginLeft: spacing(1) }]}>
                                    <Text style={[styles.salonBadgeText, { fontSize: normalizeFontSize(10) }]}>Institut</Text>
                                  </View>
                                )}
                              </View>

                              <View style={styles.providerCardMeta}>
                                <Text style={[styles.providerCardRating, { fontSize: normalizeFontSize(12) }]}>
                                  ⭐ {provider.rating != null ? Number(provider.rating).toFixed(1) : '5.0'} ({provider.review_count || 0})
                                </Text>
                                <Text style={[styles.metaSeparator, { fontSize: normalizeFontSize(12) }]}>•</Text>
                                <Text style={[styles.providerCardLocation, { fontSize: normalizeFontSize(12) }]}>
                                  {provider.city || 'Ville inconnue'}
                                  {provider.distance_meters < 999999 ? ` (${(provider.distance_meters / 1000).toFixed(1)} km)` : ''}
                                </Text>
                              </View>

                              <Text style={[styles.providerCardPrice, { fontSize: normalizeFontSize(14) }]}>
                                {formatCurrency(price, countryCode)}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.viewDetailsLink, { paddingVertical: spacing(0.5), paddingLeft: spacing(2), marginTop: spacing(0.5) }]}
                          onPress={() => handleViewProviderDetails(provider.id, isSalon ? 'salon' : 'therapist')}
                        >
                          <Text style={[styles.viewDetailsLinkText, { fontSize: normalizeFontSize(12) }]}>
                            Voir les détails →
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  {/* Always show button to access filter page */}
                  {totalProviders > 0 && (
                    <TouchableOpacity
                      style={[styles.viewAllProvidersButton, { padding: spacing(2), borderRadius: spacing(2), borderWidth: 1, marginTop: spacing(1) }]}
                      onPress={handleViewProviders}
                    >
                      <Text style={[styles.viewAllProvidersText, { fontSize: normalizeFontSize(14) }]}>
                        🎛️ Voir tous les prestataires avec filtres →
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Purpose Section */}
              {(service.purpose_fr || service.purpose_en) && (
                <View style={[styles.section, { paddingVertical: spacing(2), borderTopWidth: 1 }]}>
                  <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18), marginBottom: spacing(2) }]}>
                    Objectif
                  </Text>
                  <Text style={[styles.purposeText, { fontSize: normalizeFontSize(14), lineHeight: normalizeFontSize(20) }]}>
                    {language === 'fr' ? service.purpose_fr : service.purpose_en}
                  </Text>
                </View>
              )}

              {/* What's Included Section */}
              <TouchableOpacity
                style={[styles.section, { paddingVertical: spacing(2), borderTopWidth: 1 }]}
                onPress={() => toggleSection('whatsIncluded')}
              >
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18) }]}>
                    Ce qui est inclus
                  </Text>
                  <Text style={[styles.expandIcon, { fontSize: normalizeFontSize(20) }]}>
                    {expandedSection === 'whatsIncluded' ? '▲' : '▼'}
                  </Text>
                </View>

                {expandedSection === 'whatsIncluded' && (
                  <View style={[styles.sectionContent, { marginTop: spacing(2) }]}>
                    {components.map((item: string, index: number) => (
                      <View key={index} style={[styles.listItem, { marginBottom: spacing(1.5) }]}>
                        <Text style={[styles.checkmark, { fontSize: normalizeFontSize(14) }]}>✓</Text>
                        <Text style={[styles.listItemText, { fontSize: normalizeFontSize(14), lineHeight: normalizeFontSize(20) }]}>
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>

              {/* Ideal For Section */}
              {(service.ideal_for_fr || service.ideal_for_en) && (
                <View style={[styles.section, { paddingVertical: spacing(2), borderTopWidth: 1 }]}>
                  <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18), marginBottom: spacing(2) }]}>
                    Idéal pour
                  </Text>
                  <Text style={[styles.idealForText, { fontSize: normalizeFontSize(14), lineHeight: normalizeFontSize(20) }]}>
                    {language === 'fr' ? service.ideal_for_fr : service.ideal_for_en}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      {!loading && totalProviders > 0 && (
        <View style={[styles.bottomButtons, { padding: spacing(2.5), paddingHorizontal: isTablet ? containerPaddingHorizontal + spacing(2.5) : spacing(2.5) }]}>
          {!selectedProvider && (
            <Text style={[styles.selectProviderHint, { fontSize: normalizeFontSize(12), textAlign: 'center', marginBottom: spacing(1) }]}>
              Sélectionnez un prestataire pour réserver
            </Text>
          )}
          <TouchableOpacity
            style={[
              styles.bookButton,
              { paddingVertical: spacing(2), borderRadius: spacing(2) },
              !selectedProvider && styles.bookButtonDisabled,
            ]}
            onPress={handleBookNow}
            disabled={!selectedProvider}
          >
            <Text style={[
              styles.bookButtonText,
              { fontSize: normalizeFontSize(14) },
              !selectedProvider && styles.bookButtonTextDisabled,
            ]}>
              {selectedProvider
                ? `Réserver chez ${selectedProvider.name}`
                : 'Sélectionnez un prestataire'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerImageContainer: {
    position: 'relative',
    backgroundColor: '#F5F5F5',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
  },
  backButton: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#2D2D2D',
  },
  closeButton: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: '#2D2D2D',
  },
  content: {
    flex: 1,
  },
  contentInner: {},
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#666',
  },
  name: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  categoryRow: {
    flexDirection: 'row',
  },
  categoryBadge: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryText: {
    color: '#2D2D2D',
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontWeight: '700',
    color: '#FF6B6B',
  },
  duration: {
    color: '#666',
    fontWeight: '600',
  },
  description: {
    color: '#666',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  providerLabel: {
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  providerCount: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  viewAllButton: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  providerCardSelected: {
    borderColor: '#2D2D2D',
    borderWidth: 2,
    backgroundColor: '#F8F8F8',
  },
  providerCardContent: {
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
  providerAvatarText: {
    color: '#666',
  },
  providerCardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  providerCardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerCardName: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  providerCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerCardRating: {
    fontWeight: '600',
    color: '#2D2D2D',
    marginRight: 4,
  },
  metaSeparator: {
    color: '#CCC',
    marginRight: 4,
  },
  providerCardLocation: {
    color: '#666',
  },
  providerCardPrice: {
    fontWeight: '700',
    color: '#FF6B6B',
  },
  salonBadge: {
    backgroundColor: '#E3F2FD',
  },
  salonBadgeText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  selectedBadge: {
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  selectedLabel: {
    backgroundColor: '#2D2D2D',
  },
  selectedLabelText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  viewDetailsLink: {
    alignSelf: 'flex-start',
  },
  viewDetailsLinkText: {
    color: '#666',
    textDecorationLine: 'underline',
  },
  viewAllProvidersButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllProvidersText: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  section: {
    borderColor: '#F0F0F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  expandIcon: {
    color: '#999',
  },
  sectionContent: {},
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkmark: {
    color: '#4CAF50',
    marginRight: 8,
    marginTop: 2,
    fontWeight: '700',
  },
  listItemText: {
    flex: 1,
    color: '#666',
  },
  purposeText: {
    color: '#666',
  },
  idealForText: {
    color: '#666',
  },
  reviewCard: {
    backgroundColor: '#F5F5F5',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewAuthor: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  reviewDate: {
    color: '#999',
    marginTop: 2,
  },
  reviewRating: {
    color: '#FFB800',
  },
  reviewComment: {
    color: '#666',
  },
  bottomButtons: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  bookButton: {
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#E0E0E0',
    opacity: 0.6,
  },
  bookButtonText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bookButtonTextDisabled: {
    color: '#999',
  },
  selectProviderHint: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  placeholderText: {
    color: '#999',
  },
});

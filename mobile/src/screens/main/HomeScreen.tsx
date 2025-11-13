import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { useResponsive } from '../../hooks/useResponsive';
import { useServices } from '../../hooks/useServices';
import { useSalons } from '../../hooks/useSalons';
import { formatCurrency, type CountryCode } from '../../utils/currency';
import { HomeStackParamList, ServiceWithProviders, PackageWithProviders } from '../../navigation/HomeStackNavigator';
import type { Service, ServicePackage, GiftCard, Booking } from '../../types/database.types';
import { AdvancedSearchModal, SearchFilters } from '../../components/AdvancedSearchModal';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const { normalizeFontSize, spacing, isTablet, containerPaddingHorizontal } = useResponsive();

  // Charger les services depuis l'API
  const { services, loading: servicesLoading, error: servicesError, refetch } = useServices();

  // Charger les salons depuis l'API
  const { salons, loading: salonsLoading, error: salonsError, refetch: refetchSalons } = useSalons();

  const [countryCode] = useState<CountryCode>('CM');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'home' | 'institute'>('home');
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchSalons()]);
    setRefreshing(false);
  };

  const handleSalonPress = (salon: any) => {
    // Navigate to salon details (ProviderDetailsScreen avec type salon)
    navigation.navigate('ProviderDetails', {
      provider: {
        type: 'salon',
        id: salon.id,
        name: language === 'fr' ? salon.name_fr : salon.name_en,
        rating: salon.rating,
        reviewCount: salon.review_count,
      },
    });
  };

  // Convertir les services API en format ServiceWithProviders pour la compatibilité
  const nearbyServices: ServiceWithProviders[] = services.slice(0, 5).map(service => ({
    ...service,
    priority: 10,
    providers: [], // Les providers seront chargés quand on clique sur un service
    provider_count: service.provider_count || 0,
  }));

  // Grouper les services par catégorie
  const servicesByCategory = services.reduce((acc, service) => {
    const category = service.category || 'OTHER';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({
      ...service,
      priority: 10,
      providers: [],
      provider_count: service.provider_count || 0,
    });
    return acc;
  }, {} as Record<string, ServiceWithProviders[]>);

  // Noms des catégories en français
  const categoryNames: Record<string, { fr: string; en: string }> = {
    WELLNESS_MASSAGE: { fr: 'Massage & Bien-être', en: 'Massage & Wellness' },
    FACIAL_CARE: { fr: 'Soins du visage', en: 'Facial Care' },
    HAIR_CARE: { fr: 'Coiffure', en: 'Hair Care' },
    NAIL_CARE: { fr: 'Soins des ongles', en: 'Nail Care' },
    BODY_CARE: { fr: 'Soins du corps', en: 'Body Care' },
    MAKEUP: { fr: 'Maquillage', en: 'Makeup' },
    AESTHETIC: { fr: 'Esthétique', en: 'Aesthetic' },
    OTHER: { fr: 'Autres services', en: 'Other Services' },
  };

  // Mock data pour les bookings et packages (à implémenter plus tard)
  const upcomingBookings: Booking[] = [];
  const servicePackages: PackageWithProviders[] = [];
  const giftCards: GiftCard[] = [];

  const handleServicePress = (service: ServiceWithProviders) => {
    navigation.navigate('ServiceProviders', { service });
  };

  const handlePackagePress = (pkg: PackageWithProviders) => {
    navigation.navigate('PackageProviders', { package: pkg });
  };

  const handleSearch = (filters: SearchFilters) => {
    navigation.navigate('SearchResults', { filters });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing(2.5), paddingTop: spacing(6), paddingBottom: spacing(2) }]}>
        <View>
          <Text style={[styles.logo, { fontSize: normalizeFontSize(20) }]}>KMR-Beauty</Text>
          <Text style={[styles.tagline, { fontSize: normalizeFontSize(10) }]}>{t.home.tagline}</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Language Toggle */}
          <TouchableOpacity
            style={[styles.languageToggle, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(2), marginRight: spacing(1.5) }]}
            onPress={toggleLanguage}
          >
            <Text style={[styles.languageText, { fontSize: normalizeFontSize(12) }]}>
              {language.toUpperCase()}
            </Text>
          </TouchableOpacity>

          {/* Profile Button */}
          <TouchableOpacity style={[styles.profileButton, { width: spacing(6), height: spacing(6) }]}>
            <View style={styles.profilePlaceholder}>
              <Text style={[styles.profileInitial, { fontSize: normalizeFontSize(16) }]}>
                {user?.firstName?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.profileName, { fontSize: normalizeFontSize(10) }]} numberOfLines={1}>
              {user?.firstName}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { paddingHorizontal: spacing(2.5), marginBottom: spacing(2) }]}>
        <TouchableOpacity
          style={[styles.searchBar, { height: spacing(6), borderRadius: spacing(1.5), paddingHorizontal: spacing(2) }]}
          onPress={() => setSearchModalVisible(true)}
        >
          <Text style={[styles.searchPlaceholder, { fontSize: normalizeFontSize(14) }]}>{t.home.searchServices}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.searchButton, { width: spacing(6), height: spacing(6), borderRadius: spacing(3) }]}
          onPress={() => setSearchModalVisible(true)}
        >
          <Text style={[styles.searchIcon, { fontSize: normalizeFontSize(20) }]}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onApply={handleSearch}
      />

      {/* Toggle Home/Institute */}
      <View style={[styles.toggleContainer, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'home' && styles.toggleButtonActive,
            { flex: 1, paddingVertical: spacing(1.5), borderRadius: spacing(3) }
          ]}
          onPress={() => setViewMode('home')}
        >
          <Text style={[
            styles.toggleText,
            viewMode === 'home' && styles.toggleTextActive,
            { fontSize: normalizeFontSize(14) }
          ]}>
            {t.home.home || 'Services'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'institute' && styles.toggleButtonActive,
            { flex: 1, paddingVertical: spacing(1.5), borderRadius: spacing(3), marginLeft: spacing(1) }
          ]}
          onPress={() => setViewMode('institute')}
        >
          <Text style={[
            styles.toggleText,
            viewMode === 'institute' && styles.toggleTextActive,
            { fontSize: normalizeFontSize(14) }
          ]}>
            {t.home.institute || 'Instituts'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingBottom: spacing(10),
          paddingHorizontal: containerPaddingHorizontal,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Loading State */}
        {servicesLoading && !refreshing && (
          <View style={{ padding: spacing(4), alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={{ marginTop: spacing(2), fontSize: normalizeFontSize(14), color: '#666' }}>
              {language === 'fr' ? 'Chargement des services...' : 'Loading services...'}
            </Text>
          </View>
        )}

        {/* Error State */}
        {servicesError && (
          <View style={{ padding: spacing(4), alignItems: 'center' }}>
            <Text style={{ fontSize: normalizeFontSize(14), color: '#ff0000', textAlign: 'center' }}>
              {language === 'fr'
                ? 'Erreur lors du chargement des services. Tirez pour actualiser.'
                : 'Error loading services. Pull to refresh.'}
            </Text>
          </View>
        )}

        {/* Upcoming Bookings */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>{t.home.upcomingBookings}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BookingManagement')}>
              <Text style={[styles.seeAll, { fontSize: normalizeFontSize(14) }]}>{t.home.seeAll}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.bookingCard, { borderRadius: spacing(2), padding: spacing(2) }]}>
            <View style={styles.bookingContent}>
              <View style={[styles.bookingLogo, { width: spacing(7), height: spacing(7), borderRadius: spacing(1) }]}>
                <Text style={[styles.bookingLogoText, { fontSize: normalizeFontSize(12) }]}>Logo</Text>
              </View>
              <View style={styles.bookingInfo}>
                <Text style={[styles.bookingName, { fontSize: normalizeFontSize(16) }]}>Luxembourg Gardens Salon</Text>
                <View style={styles.bookingDetails}>
                  <Text style={[styles.bookingTime, { fontSize: normalizeFontSize(12) }]}>⏰ 10am</Text>
                  <Text style={[styles.bookingDate, { fontSize: normalizeFontSize(12) }]}>📅 23 August, 2024</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Near Me (Services) - Mode Home */}
        {viewMode === 'home' && (
          <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>{t.home.nearbyProviders || 'Services Proches'}</Text>
              <TouchableOpacity>
                <Text style={[styles.seeAll, { fontSize: normalizeFontSize(14) }]}>{t.home.seeAll}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing(2.5) }} contentContainerStyle={{ paddingHorizontal: spacing(2.5), gap: spacing(2) }}>
              {nearbyServices.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[styles.serviceCard, { width: spacing(22), borderRadius: spacing(2), padding: spacing(2) }]}
                  onPress={() => handleServicePress(service)}
                >
                  <View style={[styles.serviceImage, { height: spacing(12), borderRadius: spacing(1.5), marginBottom: spacing(1.5) }]}>
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
                    <View style={[styles.serviceProvidersCount, { position: 'absolute', top: spacing(1), right: spacing(1), paddingHorizontal: spacing(1), paddingVertical: spacing(0.5), borderRadius: spacing(1) }]}>
                      <Text style={[styles.serviceProvidersCountText, { fontSize: normalizeFontSize(10) }]}>
                        {service.provider_count || 0} prestataires
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.serviceName, { fontSize: normalizeFontSize(16), marginBottom: spacing(0.5) }]} numberOfLines={1}>
                    {language === 'fr' ? service.name_fr : service.name_en}
                  </Text>
                  <Text style={[styles.servicePrice, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]}>
                    À partir de {formatCurrency(service.base_price, countryCode)}
                  </Text>
                  <View style={styles.serviceFooter}>
                    <Text style={[styles.serviceDuration, { fontSize: normalizeFontSize(12) }]}>⏰ {service.duration}min</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Nearby Institutes - Mode Institute */}
        {viewMode === 'institute' && (
          <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>Instituts Proches</Text>
              <TouchableOpacity>
                <Text style={[styles.seeAll, { fontSize: normalizeFontSize(14) }]}>{t.home.seeAll}</Text>
              </TouchableOpacity>
            </View>

            {salonsLoading && !refreshing ? (
              <View style={{ paddingVertical: spacing(4), alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#000" />
              </View>
            ) : salons.length === 0 ? (
              <View style={{ paddingVertical: spacing(4), alignItems: 'center' }}>
                <Text style={{ fontSize: normalizeFontSize(14), color: '#999' }}>
                  Aucun institut disponible
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing(2.5) }} contentContainerStyle={{ paddingHorizontal: spacing(2.5), gap: spacing(2) }}>
                {salons.slice(0, 5).map((salon) => (
                  <TouchableOpacity
                    key={salon.id}
                    style={[styles.instituteCard, { width: spacing(30), borderRadius: spacing(2), padding: spacing(2) }]}
                    onPress={() => handleSalonPress(salon)}
                  >
                    <View style={[styles.instituteImage, { height: spacing(15), borderRadius: spacing(1.5), marginBottom: spacing(1.5) }]}>
                      {salon.cover_image || (salon.ambiance_images && salon.ambiance_images.length > 0) ? (
                        <Image
                          source={{ uri: salon.cover_image || salon.ambiance_images[0] }}
                          style={styles.instituteImageActual}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.instituteImagePlaceholder}>
                          <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>Institut</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.instituteName, { fontSize: normalizeFontSize(16), marginBottom: spacing(0.5) }]} numberOfLines={1}>
                      {language === 'fr' ? salon.name_fr : salon.name_en}
                    </Text>
                    <Text style={[styles.instituteLocation, { fontSize: normalizeFontSize(12), marginBottom: spacing(0.5), color: '#666' }]} numberOfLines={1}>
                      📍 {salon.city}, {salon.quarter}
                    </Text>
                    <View style={styles.instituteFooter}>
                      <Text style={[styles.instituteRating, { fontSize: normalizeFontSize(12) }]}>
                        ⭐ {salon.rating} ({salon.review_count})
                      </Text>
                      <Text style={[styles.instituteServices, { fontSize: normalizeFontSize(12), color: '#FF6B6B' }]}>
                        {salon.service_count} services
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Recommended Service */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20), marginBottom: spacing(2) }]}>{t.home.recommended}</Text>

          {nearbyServices.length > 0 && (
            <TouchableOpacity
              style={[styles.recommendedCard, { borderRadius: spacing(2) }]}
              onPress={() => handleServicePress(nearbyServices[0])}
            >
              <View style={[styles.recommendedImage, { height: spacing(25), borderRadius: spacing(2) }]}>
                {nearbyServices[0].images && nearbyServices[0].images.length > 0 && nearbyServices[0].images[0] ? (
                  <Image
                    source={{ uri: nearbyServices[0].images[0] }}
                    style={styles.recommendedImageActual}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.recommendedImagePlaceholder, { height: spacing(25) }]}>
                    <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>Service Image</Text>
                  </View>
                )}
                <View style={[styles.recommendedLocation, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(2) }]}>
                  <Text style={[styles.recommendedLocationText, { fontSize: normalizeFontSize(10) }]}>
                    📍 {nearbyServices[0].provider_count || 0} prestataires disponibles
                  </Text>
                </View>
              </View>

              <View style={[styles.recommendedInfo, { padding: spacing(1.5) }]}>
                <View style={styles.recommendedHeader}>
                  <Text style={[styles.recommendedTitle, { fontSize: normalizeFontSize(16) }]} numberOfLines={1}>
                    {language === 'fr' ? nearbyServices[0].name_fr : nearbyServices[0].name_en}
                  </Text>
                  <View style={styles.recommendedPrice}>
                    <Text style={[styles.recommendedPriceText, { fontSize: normalizeFontSize(16) }]}>
                      {formatCurrency(nearbyServices[0].base_price, countryCode)}
                    </Text>
                    <Text style={[styles.recommendedDuration, { fontSize: normalizeFontSize(12) }]}>⏰ {nearbyServices[0].duration}min</Text>
                  </View>
                </View>
                <View style={styles.recommendedFooter}>
                  <Text style={[styles.recommendedDescription, { fontSize: normalizeFontSize(12) }]}>
                    {language === 'fr' ? nearbyServices[0].description_fr : nearbyServices[0].description_en}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Services par Catégorie */}
        {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
          categoryServices.length > 0 && (
            <View key={category} style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>
                  {categoryNames[category]?.[language] || category}
                </Text>
                <TouchableOpacity>
                  <Text style={[styles.seeAll, { fontSize: normalizeFontSize(14) }]}>{t.home.seeAll || 'Voir tout'}</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing(2.5) }} contentContainerStyle={{ paddingHorizontal: spacing(2.5), gap: spacing(2) }}>
                {categoryServices.slice(0, 10).map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[styles.serviceCard, { width: spacing(22), borderRadius: spacing(2), padding: spacing(2) }]}
                    onPress={() => handleServicePress(service)}
                  >
                    <View style={[styles.serviceImage, { height: spacing(12), borderRadius: spacing(1.5), marginBottom: spacing(1.5) }]}>
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
                      <View style={[styles.serviceProvidersCount, { position: 'absolute', top: spacing(1), right: spacing(1), paddingHorizontal: spacing(1), paddingVertical: spacing(0.5), borderRadius: spacing(1) }]}>
                        <Text style={[styles.serviceProvidersCountText, { fontSize: normalizeFontSize(10) }]}>
                          {service.provider_count || 0} prestataires
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.serviceName, { fontSize: normalizeFontSize(16), marginBottom: spacing(0.5) }]} numberOfLines={1}>
                      {language === 'fr' ? service.name_fr : service.name_en}
                    </Text>
                    <Text style={[styles.servicePrice, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]}>
                      À partir de {formatCurrency(service.base_price, countryCode)}
                    </Text>
                    <View style={styles.serviceFooter}>
                      <Text style={[styles.serviceDuration, { fontSize: normalizeFontSize(12) }]}>⏰ {service.duration}min</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )
        ))}

        {/* Service Packages */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>{t.home.servicePackages}</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { fontSize: normalizeFontSize(14) }]}>{t.home.seeAll}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing(2.5) }} contentContainerStyle={{ paddingHorizontal: spacing(2.5), gap: spacing(2) }}>
            {servicePackages.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={[styles.packageCard, { width: spacing(22), borderRadius: spacing(2) }]}
                onPress={() => handlePackagePress(pkg)}
              >
                <View style={[styles.packageImage, { height: spacing(15), borderRadius: spacing(2) }]}>
                  <View style={[styles.packageImagePlaceholder, { height: spacing(15) }]}>
                    <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>Package Image</Text>
                  </View>
                </View>
                <View style={[styles.packageInfo, { padding: spacing(1.5) }]}>
                  <Text style={[styles.packageTitle, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]} numberOfLines={2}>
                    {language === 'fr' ? pkg.name_fr : pkg.name_en}
                  </Text>
                  <View style={styles.packageFooter}>
                    <Text style={[styles.packagePrice, { fontSize: normalizeFontSize(16) }]}>
                      {formatCurrency(pkg.base_price, countryCode)}
                    </Text>
                    <Text style={[styles.packageDuration, { fontSize: normalizeFontSize(12) }]}>⏰ {pkg.base_duration}min</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Gift Cards */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20), marginBottom: spacing(2) }]}>{t.home.giftCards}</Text>

          {giftCards.map((card) => (
            <TouchableOpacity key={card.id} style={[styles.giftCard, { borderRadius: spacing(2), padding: spacing(2.5), marginBottom: spacing(2) }]}>
              <View style={[styles.giftCardIcon, { width: spacing(6), height: spacing(6), borderRadius: spacing(3), marginBottom: spacing(2) }]}>
                <Text style={[styles.giftCardIconText, { fontSize: normalizeFontSize(24) }]}>🎁</Text>
              </View>
              <View style={[styles.giftCardPrice, { marginBottom: spacing(3) }]}>
                <Text style={[styles.giftCardPriceText, { fontSize: normalizeFontSize(40) }]}>
                  {formatCurrency(card.value, countryCode)}
                </Text>
              </View>
              <View>
                <Text style={[styles.giftCardTitle, { fontSize: normalizeFontSize(14), marginBottom: spacing(0.5) }]}>
                  {language === 'fr' ? card.title_fr : card.title_en}
                </Text>
                <Text style={[styles.giftCardSubtitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(0.5) }]}>
                  {language === 'fr' ? card.description_fr : card.description_en}
                </Text>
                <Text style={[styles.giftCardExpiry, { fontSize: normalizeFontSize(12) }]}>
                  Valide jusqu'au {new Date(card.valid_until).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logo: {
    fontWeight: '700',
    color: '#2D2D2D',
    letterSpacing: 1,
  },
  tagline: {
    color: '#999',
    fontWeight: '400',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageToggle: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageText: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  profileButton: {
    alignItems: 'center',
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  profileInitial: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  profileName: {
    color: '#666',
    fontWeight: '400',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
  },
  searchPlaceholder: {
    color: '#999',
  },
  searchButton: {
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {},
  content: {
    flex: 1,
  },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  seeAll: {
    color: '#FF6B6B',
    fontWeight: '500',
  },
  bookingCard: {
    backgroundColor: '#2D2D2D',
  },
  bookingContent: {
    flexDirection: 'row',
    gap: 12,
  },
  bookingLogo: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingLogoText: {
    color: '#666',
    fontWeight: '600',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  bookingDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  bookingTime: {
    color: '#FFFFFF',
  },
  bookingDate: {
    color: '#FFFFFF',
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  serviceImage: {
    position: 'relative',
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
  serviceProvidersCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  serviceProvidersCountText: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  serviceName: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  servicePrice: {
    color: '#FF6B6B',
    fontWeight: '700',
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDuration: {
    color: '#666',
  },
  recommendedCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  recommendedImage: {
    position: 'relative',
    overflow: 'hidden',
  },
  recommendedImageActual: {
    width: '100%',
    height: '100%',
  },
  recommendedImagePlaceholder: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendedLocation: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(45, 45, 45, 0.8)',
  },
  recommendedLocationText: {
    color: '#FFFFFF',
  },
  recommendedInfo: {},
  recommendedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendedTitle: {
    fontWeight: '600',
    color: '#2D2D2D',
    flex: 1,
  },
  recommendedPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendedPriceText: {
    fontWeight: '700',
    color: '#FF6B6B',
  },
  recommendedDuration: {
    color: '#666',
  },
  recommendedFooter: {},
  recommendedDescription: {
    color: '#666',
  },
  categoriesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  categoryIcon: {},
  categoryName: {
    color: '#2D2D2D',
    fontWeight: '500',
    textAlign: 'center',
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  packageImage: {},
  packageImagePlaceholder: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageInfo: {},
  packageTitle: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  packageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packagePrice: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  packageDuration: {
    color: '#666',
  },
  giftCard: {
    backgroundColor: '#2D2D2D',
  },
  giftCardIcon: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftCardIconText: {},
  giftCardPrice: {
    alignSelf: 'flex-end',
  },
  giftCardPriceText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  giftCardTitle: {
    color: '#999',
    fontWeight: '500',
  },
  giftCardSubtitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  giftCardExpiry: {
    color: '#999',
  },
  placeholderText: {
    color: '#999',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    padding: 4,
  },
  toggleButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#2D2D2D',
  },
  toggleText: {
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  instituteCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  instituteImage: {
    position: 'relative',
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  instituteImageActual: {
    width: '100%',
    height: '100%',
  },
  instituteImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  instituteName: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  instituteLocation: {
    color: '#666',
  },
  instituteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  instituteRating: {
    color: '#666',
    fontWeight: '500',
  },
  instituteServices: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
});

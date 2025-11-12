import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCurrency, type CountryCode } from '../../utils/currency';
import { HomeStackParamList, Provider, Salon, Service } from '../../navigation/HomeStackNavigator';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const { normalizeFontSize, spacing, isTablet, containerPaddingHorizontal } = useResponsive();
  const [viewMode, setViewMode] = useState<'home' | 'institute'>('home');

  // Country code based on selected country (from CountryPicker context or user profile)
  // For now, defaulting to CM (Cameroun)
  const [countryCode] = useState<CountryCode>('CM');

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  const handleProviderPress = (provider: Provider) => {
    navigation.navigate('ProviderDetails', { provider });
  };

  const handleSalonPress = (salon: Salon) => {
    navigation.navigate('SalonDetails', { salon });
  };

  const handleServicePress = (service: Service) => {
    navigation.navigate('ServiceDetails', { service });
  };

  // Mock data for providers (when viewMode === 'home')
  const nearbyProviders: Provider[] = [
    { id: '1', name: 'Marie Coiffure', category: 'Hairdressing', distance: '0.5 km', rating: '4.8', reviews: '120', salon: 'Marie Coiffure Salon', licensed: true, experience: '8 Years', bio: 'Expert hairdresser specializing in African hairstyles' },
    { id: '2', name: 'Bella Beauty', category: 'Makeup', distance: '0.8 km', rating: '4.9', reviews: '230', salon: 'Bella Beauty Studio', licensed: true, experience: '12 Years', bio: 'Professional makeup artist for all occasions' },
    { id: '3', name: 'Zen Spa', category: 'Massage', distance: '1.2 km', rating: '4.7', reviews: '89', salon: 'Zen Wellness Center', licensed: true, experience: '5 Years', bio: 'Certified massage therapist specializing in relaxation' },
  ];

  // Mock data for salons (when viewMode === 'institute')
  const nearbySalons: Salon[] = [
    {
      id: 's1',
      name: 'Beau Monde Esthétique',
      description: 'Un salon de beauté moderne offrant une gamme complète de services de coiffure, maquillage et soins du corps.',
      address: '123 Avenue de la Liberté',
      city: 'Douala',
      region: 'Littoral',
      latitude: 4.0511,
      longitude: 9.7679,
      rating: '4.8',
      reviews: '340',
      openingHours: 'Lun-Sam: 9h00 - 19h00, Dim: Fermé',
      features: ['Wifi gratuit', 'Climatisation', 'Parking', 'Accessible'],
    },
    {
      id: 's2',
      name: 'Luxembourg Gardens Salon',
      description: 'Salon haut de gamme spécialisé dans les soins capillaires et les traitements de beauté.',
      address: '45 Rue du Commerce',
      city: 'Yaoundé',
      region: 'Centre',
      latitude: 3.8480,
      longitude: 11.5021,
      rating: '4.9',
      reviews: '520',
      openingHours: 'Lun-Sam: 8h00 - 20h00, Dim: 10h00 - 17h00',
      features: ['Service VIP', 'Produits bio', 'Massage', 'Spa'],
    },
    {
      id: 's3',
      name: 'Élégance Beauty Center',
      description: 'Centre de beauté offrant des services professionnels dans une ambiance relaxante.',
      address: '78 Boulevard du Renouveau',
      city: 'Douala',
      region: 'Littoral',
      latitude: 4.0614,
      longitude: 9.7085,
      rating: '4.7',
      reviews: '210',
      openingHours: 'Mar-Dim: 9h00 - 18h00, Lun: Fermé',
      features: ['Réservation en ligne', 'Parking gratuit', 'Wifi'],
    },
  ];

  // Mock data for services (when viewMode === 'institute')
  const featuredServices: Service[] = [
    {
      id: 'sv1',
      name: 'Coiffure Complète Femme',
      description: 'Service complet de coiffure incluant shampooing, coupe, brushing et coiffage professionnel.',
      category: 'Coiffure',
      duration: 90,
      price: 15000,
      idealFor: 'Parfait pour toutes occasions : quotidien, événements professionnels ou cérémonies.',
      components: ['Consultation personnalisée', 'Shampooing premium', 'Coupe sur mesure', 'Brushing professionnel', 'Coiffage et finition'],
      salon: { id: 's1', name: 'Beau Monde Esthétique', rating: '4.8' },
    },
    {
      id: 'sv2',
      name: 'Maquillage Professionnel',
      description: 'Maquillage complet réalisé par des experts pour un look impeccable.',
      category: 'Maquillage',
      duration: 120,
      price: 25000,
      idealFor: 'Idéal pour mariages, séances photo, soirées de gala et événements spéciaux.',
      components: ['Analyse du teint', 'Préparation de la peau', 'Application maquillage', 'Faux cils (optionnel)', 'Retouches et conseils'],
      salon: { id: 's2', name: 'Luxembourg Gardens Salon', rating: '4.9' },
    },
    {
      id: 'sv3',
      name: 'Manucure & Pédicure Spa',
      description: 'Soin complet des mains et des pieds avec massage relaxant inclus.',
      category: 'Soins des ongles',
      duration: 75,
      price: 12000,
      idealFor: 'Pour celles qui souhaitent des mains et pieds impeccables avec un moment de détente.',
      components: ['Bain relaxant', 'Exfoliation', 'Coupe et limage', 'Massage hydratant', 'Vernis au choix'],
      salon: { id: 's3', name: 'Élégance Beauty Center', rating: '4.7' },
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing(2.5), paddingTop: spacing(6), paddingBottom: spacing(2) }]}>
        <View>
          <Text style={[styles.logo, { fontSize: normalizeFontSize(20) }]}>SIMONE</Text>
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

      {/* Toggle Home/Institute */}
      <View style={[styles.toggleContainer, { paddingHorizontal: spacing(2.5), marginBottom: spacing(2) }]}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'home' && styles.toggleButtonActive,
            { paddingVertical: spacing(1), paddingHorizontal: spacing(3), borderRadius: spacing(3) }
          ]}
          onPress={() => setViewMode('home')}
        >
          <Text style={[
            viewMode === 'home' ? styles.toggleTextActive : styles.toggleText,
            { fontSize: normalizeFontSize(14) }
          ]}>
            {t.home.home}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'institute' && styles.toggleButtonActive,
            { paddingVertical: spacing(1), paddingHorizontal: spacing(3), borderRadius: spacing(3) }
          ]}
          onPress={() => setViewMode('institute')}
        >
          <Text style={[
            viewMode === 'institute' ? styles.toggleTextActive : styles.toggleText,
            { fontSize: normalizeFontSize(14) }
          ]}>
            {t.home.institute}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
        <View style={[styles.searchBar, { height: spacing(6), borderRadius: spacing(1.5), paddingHorizontal: spacing(2) }]}>
          <Text style={[styles.searchPlaceholder, { fontSize: normalizeFontSize(14) }]}>{t.home.searchServices}</Text>
        </View>
        <TouchableOpacity style={[styles.searchButton, { width: spacing(6), height: spacing(6), borderRadius: spacing(3) }]}>
          <Text style={[styles.searchIcon, { fontSize: normalizeFontSize(20) }]}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingBottom: spacing(10),
          paddingHorizontal: containerPaddingHorizontal,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming Bookings */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>{t.home.upcomingBookings}</Text>
            <TouchableOpacity>
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

        {/* Nearby Providers or Salons (Proche de moi) */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>{t.home.nearbyProviders}</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { fontSize: normalizeFontSize(14) }]}>{t.home.seeAll}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing(2.5) }} contentContainerStyle={{ paddingHorizontal: spacing(2.5), gap: spacing(2) }}>
            {viewMode === 'home' ? (
              // Show providers when in home mode
              nearbyProviders.map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  style={[styles.nearbyCard, { width: spacing(22), borderRadius: spacing(2), padding: spacing(2) }]}
                  onPress={() => handleProviderPress(provider)}
                >
                  <View style={[styles.nearbyImage, { height: spacing(12), borderRadius: spacing(1.5), marginBottom: spacing(1.5) }]}>
                    <View style={styles.nearbyImagePlaceholder}>
                      <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>Provider</Text>
                    </View>
                    <View style={[styles.nearbyDistance, { position: 'absolute', top: spacing(1), right: spacing(1), paddingHorizontal: spacing(1), paddingVertical: spacing(0.5), borderRadius: spacing(1) }]}>
                      <Text style={[styles.nearbyDistanceText, { fontSize: normalizeFontSize(10) }]}>📍 {provider.distance}</Text>
                    </View>
                  </View>
                  <Text style={[styles.nearbyName, { fontSize: normalizeFontSize(16), marginBottom: spacing(0.5) }]} numberOfLines={1}>
                    {provider.name}
                  </Text>
                  <Text style={[styles.nearbyCategory, { fontSize: normalizeFontSize(12), marginBottom: spacing(1) }]}>
                    {provider.category}
                  </Text>
                  <View style={styles.nearbyFooter}>
                    <Text style={[styles.nearbyRating, { fontSize: normalizeFontSize(12) }]}>⭐ {provider.rating}</Text>
                    <Text style={[styles.nearbyReviews, { fontSize: normalizeFontSize(12) }]}>({provider.reviews})</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              // Show salons when in institute mode
              nearbySalons.map((salon) => (
                <TouchableOpacity
                  key={salon.id}
                  style={[styles.nearbyCard, { width: spacing(22), borderRadius: spacing(2), padding: spacing(2) }]}
                  onPress={() => handleSalonPress(salon)}
                >
                  <View style={[styles.nearbyImage, { height: spacing(12), borderRadius: spacing(1.5), marginBottom: spacing(1.5) }]}>
                    <View style={styles.nearbyImagePlaceholder}>
                      <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>Salon</Text>
                    </View>
                    <View style={[styles.nearbyDistance, { position: 'absolute', top: spacing(1), right: spacing(1), paddingHorizontal: spacing(1), paddingVertical: spacing(0.5), borderRadius: spacing(1) }]}>
                      <Text style={[styles.nearbyDistanceText, { fontSize: normalizeFontSize(10) }]}>📍 {salon.city}</Text>
                    </View>
                  </View>
                  <Text style={[styles.nearbyName, { fontSize: normalizeFontSize(16), marginBottom: spacing(0.5) }]} numberOfLines={1}>
                    {salon.name}
                  </Text>
                  <Text style={[styles.nearbyCategory, { fontSize: normalizeFontSize(12), marginBottom: spacing(1) }]} numberOfLines={1}>
                    {salon.address}
                  </Text>
                  <View style={styles.nearbyFooter}>
                    <Text style={[styles.nearbyRating, { fontSize: normalizeFontSize(12) }]}>⭐ {salon.rating}</Text>
                    <Text style={[styles.nearbyReviews, { fontSize: normalizeFontSize(12) }]}>({salon.reviews})</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* Recommended */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20), marginBottom: spacing(2) }]}>{t.home.recommended}</Text>

          {viewMode === 'home' ? (
            // Show provider when in home mode
            <TouchableOpacity
              style={[styles.recommendedCard, { borderRadius: spacing(2) }]}
              onPress={() => handleProviderPress({
                id: '4',
                name: 'Clarie Smith',
                category: 'Hair & Beauty',
                rating: '4.9',
                reviews: '2.3k',
                salon: 'Beau Monde Esthétique',
                distance: '1km',
                licensed: true,
                experience: '10 Years',
                bio: 'Clarie Smith is a highly skilled and compassionate beautician therapist with over 10 years of experience in the beauty and wellness industry.'
              })}
            >
              <View style={[styles.recommendedImage, { height: spacing(25), borderRadius: spacing(2) }]}>
                <View style={[styles.recommendedImagePlaceholder, { height: spacing(25) }]}>
                  <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>Service Image</Text>
                </View>
                <View style={[styles.recommendedLocation, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(2) }]}>
                  <Text style={[styles.recommendedLocationText, { fontSize: normalizeFontSize(10) }]}>👤 Montmartre & Sacré-Cœur Basilica (1km away)</Text>
                </View>
              </View>

              <View style={[styles.recommendedInfo, { padding: spacing(1.5) }]}>
                <View style={styles.recommendedHeader}>
                  <Text style={[styles.recommendedTitle, { fontSize: normalizeFontSize(16) }]} numberOfLines={1}>Ombre Color Treatm...</Text>
                  <View style={styles.recommendedPrice}>
                    <Text style={[styles.recommendedPriceText, { fontSize: normalizeFontSize(16) }]}>
                      {formatCurrency(45000, countryCode)}
                    </Text>
                    <Text style={[styles.recommendedDuration, { fontSize: normalizeFontSize(12) }]}>⏰ 2h</Text>
                  </View>
                </View>
                <View style={styles.recommendedFooter}>
                  <Text style={[styles.recommendedSalon, { fontSize: normalizeFontSize(12) }]}>Beau Monde Esthétique</Text>
                  <Text style={[styles.recommendedRating, { fontSize: normalizeFontSize(12) }]}>⭐ (2.3k)</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            // Show service when in institute mode
            <TouchableOpacity
              style={[styles.recommendedCard, { borderRadius: spacing(2) }]}
              onPress={() => handleServicePress(featuredServices[0])}
            >
              <View style={[styles.recommendedImage, { height: spacing(25), borderRadius: spacing(2) }]}>
                <View style={[styles.recommendedImagePlaceholder, { height: spacing(25) }]}>
                  <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>Service Image</Text>
                </View>
                <View style={[styles.recommendedLocation, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(2) }]}>
                  <Text style={[styles.recommendedLocationText, { fontSize: normalizeFontSize(10) }]}>🏪 {featuredServices[0].salon?.name}</Text>
                </View>
              </View>

              <View style={[styles.recommendedInfo, { padding: spacing(1.5) }]}>
                <View style={styles.recommendedHeader}>
                  <Text style={[styles.recommendedTitle, { fontSize: normalizeFontSize(16) }]} numberOfLines={1}>{featuredServices[0].name}</Text>
                  <View style={styles.recommendedPrice}>
                    <Text style={[styles.recommendedPriceText, { fontSize: normalizeFontSize(16) }]}>
                      {formatCurrency(featuredServices[0].price, countryCode)}
                    </Text>
                    <Text style={[styles.recommendedDuration, { fontSize: normalizeFontSize(12) }]}>⏰ {featuredServices[0].duration}min</Text>
                  </View>
                </View>
                <View style={styles.recommendedFooter}>
                  <Text style={[styles.recommendedSalon, { fontSize: normalizeFontSize(12) }]}>{featuredServices[0].category}</Text>
                  <Text style={[styles.recommendedRating, { fontSize: normalizeFontSize(12) }]}>⭐ {featuredServices[0].salon?.rating}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>{t.home.categories}</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { fontSize: normalizeFontSize(14) }]}>{t.home.seeAll}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesGrid}>
            {['Hairdressing', 'Eye care', 'Wellness M'].map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.categoryCard, { paddingVertical: spacing(2), paddingHorizontal: spacing(2), borderRadius: spacing(1.5) }]}
              >
                <Text style={[styles.categoryIcon, { fontSize: normalizeFontSize(20), marginBottom: spacing(0.5) }]}>✂️</Text>
                <Text style={[styles.categoryName, { fontSize: normalizeFontSize(12) }]}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Service Packages */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>{t.home.servicePackages}</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { fontSize: normalizeFontSize(14) }]}>{t.home.seeAll}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing(2.5) }} contentContainerStyle={{ paddingHorizontal: spacing(2.5), gap: spacing(2) }}>
            {[1, 2].map((item) => (
              <View key={item} style={[styles.packageCard, { width: spacing(22), borderRadius: spacing(2) }]}>
                <View style={[styles.packageImage, { height: spacing(15), borderRadius: spacing(2) }]}>
                  <View style={[styles.packageImagePlaceholder, { height: spacing(15) }]}>
                    <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>Package Image</Text>
                  </View>
                </View>
                <View style={[styles.packageInfo, { padding: spacing(1.5) }]}>
                  <Text style={[styles.packageServices, { fontSize: normalizeFontSize(11), marginBottom: spacing(0.5) }]}>Includes 3 services</Text>
                  <Text style={[styles.packageTitle, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]} numberOfLines={2}>
                    Bridal makeover - with nail care
                  </Text>
                  <View style={styles.packageFooter}>
                    <Text style={[styles.packagePrice, { fontSize: normalizeFontSize(16) }]}>
                      {formatCurrency(65000, countryCode)}
                    </Text>
                    <Text style={[styles.packageDuration, { fontSize: normalizeFontSize(12) }]}>⏰ 2h</Text>
                    <Text style={[styles.packageRating, { fontSize: normalizeFontSize(12) }]}>⭐ (360)</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Available deals */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20), marginBottom: spacing(2) }]}>{t.home.availableDeals}</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing(2.5) }} contentContainerStyle={{ paddingHorizontal: spacing(2.5), gap: spacing(2) }}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={[styles.dealCard, { width: spacing(18), padding: spacing(2), borderRadius: spacing(2) }]}>
                <View style={[styles.dealIcon, { width: spacing(5), height: spacing(5), borderRadius: spacing(2.5), marginBottom: spacing(1) }]}>
                  <Text style={[styles.dealIconText, { fontSize: normalizeFontSize(20) }]}>%</Text>
                </View>
                <Text style={[styles.dealTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(0.5) }]}>12% off</Text>
                <Text style={[styles.dealSubtitle, { fontSize: normalizeFontSize(10) }]}>
                  Min. order {formatCurrency(30000, countryCode, false)} Valid
                </Text>
                <Text style={[styles.dealSubtitle, { fontSize: normalizeFontSize(10) }]}>for all services</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Gift Cards */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20), marginBottom: spacing(2) }]}>{t.home.giftCards}</Text>

          <View style={[styles.giftCard, { borderRadius: spacing(2), padding: spacing(2.5) }]}>
            <View style={[styles.giftCardIcon, { width: spacing(6), height: spacing(6), borderRadius: spacing(3), marginBottom: spacing(2) }]}>
              <Text style={[styles.giftCardIconText, { fontSize: normalizeFontSize(24) }]}>🎁</Text>
            </View>
            <View style={[styles.giftCardPrice, { marginBottom: spacing(3) }]}>
              <Text style={[styles.giftCardPriceText, { fontSize: normalizeFontSize(40) }]}>
                {formatCurrency(35000, countryCode)}
              </Text>
            </View>
            <View>
              <Text style={[styles.giftCardTitle, { fontSize: normalizeFontSize(14), marginBottom: spacing(0.5) }]}>CARD 1</Text>
              <Text style={[styles.giftCardSubtitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(0.5) }]}>On all Bridal Make Over</Text>
              <Text style={[styles.giftCardExpiry, { fontSize: normalizeFontSize(12) }]}>Valid till Oct 24</Text>
            </View>
          </View>
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
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    backgroundColor: 'transparent',
  },
  toggleButtonActive: {
    backgroundColor: '#2D2D2D',
  },
  toggleText: {
    color: '#666',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  nearbyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  nearbyImage: {
    position: 'relative',
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  nearbyImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  nearbyDistance: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  nearbyDistanceText: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  nearbyName: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  nearbyCategory: {
    color: '#666',
  },
  nearbyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nearbyRating: {
    color: '#666',
    fontWeight: '600',
  },
  nearbyReviews: {
    color: '#999',
  },
  recommendedCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  recommendedImage: {
    position: 'relative',
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
  recommendedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendedSalon: {
    color: '#666',
  },
  recommendedRating: {
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
  packageServices: {
    color: '#999',
  },
  packageTitle: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  packageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  packagePrice: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  packageDuration: {
    color: '#666',
  },
  packageRating: {
    color: '#666',
  },
  dealCard: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dealIcon: {
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealIconText: {
    color: '#FFFFFF',
  },
  dealTitle: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  dealSubtitle: {
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
});

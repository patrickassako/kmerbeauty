import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCurrency, type CountryCode } from '../../utils/currency';
import { HomeStackParamList, ServiceWithProviders, PackageWithProviders } from '../../navigation/HomeStackNavigator';
import type { Service, ServicePackage, GiftCard, Booking } from '../../types/database.types';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const { normalizeFontSize, spacing, isTablet, containerPaddingHorizontal } = useResponsive();

  const [countryCode] = useState<CountryCode>('CM');

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  // Mock data - À remplacer par des appels API
  const upcomingBookings: Booking[] = [
    // Mock booking
  ];

  const nearbyServices: ServiceWithProviders[] = [
    {
      id: 'svc1',
      name_fr: 'Coiffure Complète',
      name_en: 'Full Hair Styling',
      description_fr: 'Service complet de coiffure professionnelle',
      description_en: 'Complete professional hairstyling service',
      category: 'HAIRDRESSING',
      duration: 90,
      base_price: 15000,
      priority: 10,
      created_at: '',
      updated_at: '',
      providers: [
        {
          type: 'therapist',
          id: 'th1',
          name: 'Marie Coiffure',
          rating: 4.8,
          review_count: 120,
          price: 15000,
          duration: 90,
          distance: 0.5,
          city: 'Douala',
          region: 'Littoral',
        },
        {
          type: 'salon',
          id: 's1',
          name: 'Beau Monde Salon',
          rating: 4.9,
          review_count: 340,
          price: 18000,
          duration: 90,
          distance: 0.8,
          city: 'Douala',
          region: 'Littoral',
        },
      ],
    },
    {
      id: 'svc2',
      name_fr: 'Maquillage Professionnel',
      name_en: 'Professional Makeup',
      description_fr: 'Maquillage complet par des experts',
      description_en: 'Complete makeup by experts',
      category: 'MAKEUP',
      duration: 120,
      base_price: 25000,
      priority: 9,
      created_at: '',
      updated_at: '',
      providers: [
        {
          type: 'therapist',
          id: 'th2',
          name: 'Bella Beauty',
          rating: 4.9,
          review_count: 230,
          price: 25000,
          duration: 120,
          distance: 1.2,
          city: 'Douala',
          region: 'Littoral',
        },
      ],
    },
  ];

  const servicePackages: PackageWithProviders[] = [
    {
      id: 'pkg1',
      name_fr: 'Package Mariée Complète',
      name_en: 'Complete Bridal Package',
      description_fr: 'Coiffure, maquillage et manucure pour votre jour spécial',
      description_en: 'Hair, makeup and manicure for your special day',
      category: 'MAKEUP',
      base_price: 65000,
      base_duration: 240,
      priority: 10,
      is_active: true,
      created_at: '',
      updated_at: '',
      services: [],
      providers: [
        {
          type: 'salon',
          id: 's1',
          name: 'Beau Monde Salon',
          rating: 4.9,
          review_count: 340,
          price: 65000,
          duration: 240,
          city: 'Douala',
          region: 'Littoral',
        },
      ],
    },
  ];

  const giftCards: GiftCard[] = [
    {
      id: 'gc1',
      code: 'GIFT2025',
      value: 35000,
      title_fr: 'CARTE CADEAU 1',
      title_en: 'GIFT CARD 1',
      description_fr: 'Valable pour tous les services',
      description_en: 'Valid for all services',
      valid_from: '',
      valid_until: '2025-12-31',
      status: 'ACTIVE',
      created_at: '',
      updated_at: '',
    },
  ];

  const handleServicePress = (service: ServiceWithProviders) => {
    navigation.navigate('ServiceProviders', { service });
  };

  const handlePackagePress = (pkg: PackageWithProviders) => {
    navigation.navigate('PackageProviders', { package: pkg });
  };

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

        {/* Near Me (Services) */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>{t.home.nearbyProviders}</Text>
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
                  <View style={styles.serviceImagePlaceholder}>
                    <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>Service</Text>
                  </View>
                  <View style={[styles.serviceProvidersCount, { position: 'absolute', top: spacing(1), right: spacing(1), paddingHorizontal: spacing(1), paddingVertical: spacing(0.5), borderRadius: spacing(1) }]}>
                    <Text style={[styles.serviceProvidersCountText, { fontSize: normalizeFontSize(10) }]}>
                      {service.providers.length} prestataires
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

        {/* Recommended Service */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20), marginBottom: spacing(2) }]}>{t.home.recommended}</Text>

          {nearbyServices.length > 0 && (
            <TouchableOpacity
              style={[styles.recommendedCard, { borderRadius: spacing(2) }]}
              onPress={() => handleServicePress(nearbyServices[0])}
            >
              <View style={[styles.recommendedImage, { height: spacing(25), borderRadius: spacing(2) }]}>
                <View style={[styles.recommendedImagePlaceholder, { height: spacing(25) }]}>
                  <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>Service Image</Text>
                </View>
                <View style={[styles.recommendedLocation, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(2) }]}>
                  <Text style={[styles.recommendedLocationText, { fontSize: normalizeFontSize(10) }]}>
                    📍 {nearbyServices[0].providers.length} prestataires disponibles
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

        {/* Categories */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>{t.home.categories}</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { fontSize: normalizeFontSize(14) }]}>{t.home.seeAll}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesGrid}>
            {['Coiffure', 'Soins yeux', 'Massage'].map((category, index) => (
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
});

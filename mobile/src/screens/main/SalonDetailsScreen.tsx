import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useSalon, useSalonServices, useSalonTherapists } from '../../hooks/useSalons';
import { formatCurrency, type CountryCode } from '../../utils/currency';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SalonDetailsRouteProp = RouteProp<HomeStackParamList, 'SalonDetails'>;
type SalonDetailsNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'SalonDetails'>;

export const SalonDetailsScreen: React.FC = () => {
  const route = useRoute<SalonDetailsRouteProp>();
  const navigation = useNavigation<SalonDetailsNavigationProp>();
  const { salon: salonParam } = route.params;

  const { normalizeFontSize, spacing, isTablet, containerPaddingHorizontal } = useResponsive();
  const { language } = useI18n();
  const [expandedSection, setExpandedSection] = useState<string | null>('services');
  const [countryCode] = useState<CountryCode>('CM');
  const [refreshing, setRefreshing] = useState(false);

  // Charger les détails du salon
  const { salon: salonData, loading: loadingSalon } = useSalon(salonParam.id);

  // Charger les services du salon
  const { services: salonServicesData, loading: loadingServices } = useSalonServices(salonParam.id);

  // Charger les thérapeutes du salon
  const { therapists: salonTherapists, loading: loadingTherapists } = useSalonTherapists(salonParam.id);

  const loading = loadingSalon || loadingServices || loadingTherapists;
  const salon = salonData || salonParam;

  const onRefresh = async () => {
    setRefreshing(true);
    // Les hooks se rafraîchiront automatiquement
    setTimeout(() => setRefreshing(false), 1000);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const openMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${salon.latitude},${salon.longitude}`;
    Linking.openURL(url);
  };

  // Mock reviews data (à remplacer par de vraies reviews plus tard)
  const reviews = [
    {
      id: 1,
      author: 'Marie D.',
      rating: 5,
      date: '1 semaine',
      comment: 'Excellent salon ! Personnel très professionnel et accueillant.',
    },
    {
      id: 2,
      author: 'Sophie K.',
      rating: 5,
      date: '2 semaines',
      comment: 'Toujours un plaisir de venir ici. Services impeccables!',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header Image Gallery */}
      <View style={[styles.headerImageContainer, { height: spacing(40) }]}>
        {(salon.cover_image || (salon.ambiance_images && salon.ambiance_images.length > 0)) ? (
          <Image
            source={{ uri: salon.cover_image || salon.ambiance_images[0] }}
            style={styles.headerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.headerImagePlaceholder}>
            <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(16) }]}>
              Salon Photos Gallery
            </Text>
          </View>
        )}

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { top: spacing(6), left: spacing(2), width: spacing(5), height: spacing(5) }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { fontSize: normalizeFontSize(24) }]}>←</Text>
        </TouchableOpacity>

        {/* Close Button */}
        <TouchableOpacity
          style={[styles.closeButton, { top: spacing(6), right: spacing(2), width: spacing(5), height: spacing(5) }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.closeIcon, { fontSize: normalizeFontSize(20) }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingBottom: spacing(12),
          paddingHorizontal: isTablet ? containerPaddingHorizontal : 0,
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
                {language === 'fr' ? salon.name_fr : salon.name_en}
              </Text>

              {/* Rating */}
              <View style={[styles.infoRow, { marginBottom: spacing(2) }]}>
                <Text style={[styles.rating, { fontSize: normalizeFontSize(14) }]}>
                  ⭐ {salon.rating ? salon.rating.toFixed(1) : '5.0'} ({salon.review_count || 0} avis)
                </Text>
              </View>

              {/* Description */}
              {(salon.description_fr || salon.description_en) && (
                <Text style={[styles.description, { fontSize: normalizeFontSize(14), marginBottom: spacing(3), lineHeight: normalizeFontSize(20) }]}>
                  {language === 'fr' ? salon.description_fr : salon.description_en}
                </Text>
              )}

              {/* Address & Map */}
              <View style={[styles.section, { paddingVertical: spacing(2), borderTopWidth: 1, borderBottomWidth: 1 }]}>
                <View style={styles.addressHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18), marginBottom: spacing(1) }]}>
                      Adresse
                    </Text>
                    <Text style={[styles.addressText, { fontSize: normalizeFontSize(14), lineHeight: normalizeFontSize(20) }]}>
                      {salon.quarter}{salon.street ? `, ${salon.street}` : ''}
                    </Text>
                    {salon.landmark && (
                      <Text style={[styles.landmarkText, { fontSize: normalizeFontSize(13), color: '#666', marginTop: 2 }]}>
                        📍 {salon.landmark}
                      </Text>
                    )}
                    <Text style={[styles.cityText, { fontSize: normalizeFontSize(14) }]}>
                      {salon.city}, {salon.region}
                    </Text>
                  </View>
                </View>

                {/* Map */}
                <TouchableOpacity
                  style={[styles.mapContainer, { height: spacing(25), borderRadius: spacing(2), marginTop: spacing(2) }]}
                  onPress={openMaps}
                >
                  <View style={styles.mapPlaceholder}>
                    <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]}>
                      📍 Carte
                    </Text>
                    <Text style={[styles.mapHint, { fontSize: normalizeFontSize(12) }]}>
                      Appuyez pour ouvrir dans Maps
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Services Section */}
              {salonServicesData && salonServicesData.length > 0 && (
                <TouchableOpacity
                  style={[styles.section, { paddingVertical: spacing(2), borderBottomWidth: 1 }]}
                  onPress={() => toggleSection('services')}
                >
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18) }]}>
                      Services ({salonServicesData.length})
                    </Text>
                    <Text style={[styles.expandIcon, { fontSize: normalizeFontSize(20) }]}>
                      {expandedSection === 'services' ? '▲' : '▼'}
                    </Text>
                  </View>

                  {expandedSection === 'services' && (
                    <View style={[styles.sectionContent, { marginTop: spacing(2) }]}>
                      {salonServicesData.map((salonService) => (
                        <TouchableOpacity
                          key={salonService.service_id}
                          style={[styles.serviceCard, { marginBottom: spacing(1.5), padding: spacing(2), borderRadius: spacing(1.5) }]}
                          onPress={() => {
                            if (salonService.service) {
                              navigation.navigate('ServiceDetails', { service: salonService.service });
                            }
                          }}
                        >
                          <View style={styles.serviceHeader}>
                            <Text style={[styles.serviceName, { fontSize: normalizeFontSize(16) }]}>
                              {language === 'fr' ? salonService.service?.name_fr : salonService.service?.name_en}
                            </Text>
                            <Text style={[styles.servicePrice, { fontSize: normalizeFontSize(16) }]}>
                              {formatCurrency(salonService.price, countryCode)}
                            </Text>
                          </View>
                          <Text style={[styles.serviceDuration, { fontSize: normalizeFontSize(12) }]}>
                            ⏰ {salonService.duration} min
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {/* Therapists Section */}
              {salonTherapists && salonTherapists.length > 0 && (
                <TouchableOpacity
                  style={[styles.section, { paddingVertical: spacing(2), borderBottomWidth: 1 }]}
                  onPress={() => toggleSection('therapists')}
                >
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18) }]}>
                      Thérapeutes ({salonTherapists.length})
                    </Text>
                    <Text style={[styles.expandIcon, { fontSize: normalizeFontSize(20) }]}>
                      {expandedSection === 'therapists' ? '▲' : '▼'}
                    </Text>
                  </View>

                  {expandedSection === 'therapists' && (
                    <View style={[styles.sectionContent, { marginTop: spacing(2) }]}>
                      {salonTherapists.map((therapist) => (
                        <TouchableOpacity
                          key={therapist.id}
                          style={[styles.therapistCard, { marginBottom: spacing(1.5), padding: spacing(2), borderRadius: spacing(1.5) }]}
                          onPress={() => {
                            navigation.navigate('ProviderDetails', {
                              provider: {
                                type: 'therapist',
                                id: therapist.id,
                                name: `${therapist.user?.first_name || ''} ${therapist.user?.last_name || ''}`.trim(),
                                rating: therapist.rating,
                                reviewCount: therapist.review_count,
                              },
                            });
                          }}
                        >
                          <View style={styles.therapistHeader}>
                            <Text style={[styles.therapistName, { fontSize: normalizeFontSize(16) }]}>
                              {therapist.user?.first_name} {therapist.user?.last_name}
                            </Text>
                            <Text style={[styles.therapistRating, { fontSize: normalizeFontSize(14) }]}>
                              ⭐ {therapist.rating ? therapist.rating.toFixed(1) : '5.0'}
                            </Text>
                          </View>
                          {therapist.specializations && therapist.specializations.length > 0 && (
                            <Text style={[styles.therapistSpecialization, { fontSize: normalizeFontSize(12), color: '#666', marginTop: 4 }]}>
                              {therapist.specializations.join(', ')}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {/* Features */}
              {salon.features && salon.features.length > 0 && (
                <View style={[styles.section, { paddingVertical: spacing(2), borderBottomWidth: 1 }]}>
                  <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18), marginBottom: spacing(2) }]}>
                    Caractéristiques
                  </Text>
                  <View style={styles.featuresGrid}>
                    {salon.features.map((feature, index) => (
                      <View key={index} style={[styles.featureTag, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.75), borderRadius: spacing(2), marginRight: spacing(1), marginBottom: spacing(1) }]}>
                        <Text style={[styles.featureText, { fontSize: normalizeFontSize(12) }]}>
                          ✓ {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Opening Hours */}
              {salon.opening_hours && (
                <View style={[styles.section, { paddingVertical: spacing(2), borderBottomWidth: 1 }]}>
                  <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18), marginBottom: spacing(1) }]}>
                    Horaires d'ouverture
                  </Text>
                  <Text style={[styles.hoursText, { fontSize: normalizeFontSize(14) }]}>
                    {typeof salon.opening_hours === 'string' ? salon.opening_hours : JSON.stringify(salon.opening_hours, null, 2)}
                  </Text>
                </View>
              )}

              {/* Reviews Section */}
              <TouchableOpacity
                style={[styles.section, { paddingVertical: spacing(2), borderBottomWidth: 1 }]}
                onPress={() => toggleSection('reviews')}
              >
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18) }]}>Avis</Text>
                  <Text style={[styles.expandIcon, { fontSize: normalizeFontSize(20) }]}>
                    {expandedSection === 'reviews' ? '▲' : '▼'}
                  </Text>
                </View>

                {expandedSection === 'reviews' && (
                  <View style={[styles.sectionContent, { marginTop: spacing(2) }]}>
                    {reviews.map((review) => (
                      <View key={review.id} style={[styles.reviewCard, { marginBottom: spacing(2), padding: spacing(2), borderRadius: spacing(1.5) }]}>
                        <View style={[styles.reviewHeader, { marginBottom: spacing(1) }]}>
                          <View>
                            <Text style={[styles.reviewAuthor, { fontSize: normalizeFontSize(14) }]}>
                              {review.author}
                            </Text>
                            <Text style={[styles.reviewDate, { fontSize: normalizeFontSize(12) }]}>
                              il y a {review.date}
                            </Text>
                          </View>
                          <Text style={[styles.reviewRating, { fontSize: normalizeFontSize(14) }]}>
                            {'⭐'.repeat(review.rating)}
                          </Text>
                        </View>
                        <Text style={[styles.reviewComment, { fontSize: normalizeFontSize(14), lineHeight: normalizeFontSize(20) }]}>
                          {review.comment}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={[styles.bottomButtons, { padding: spacing(2.5), paddingHorizontal: isTablet ? containerPaddingHorizontal + spacing(2.5) : spacing(2.5) }]}>
        <TouchableOpacity
          style={[styles.bookButton, { paddingVertical: spacing(2), borderRadius: spacing(3) }]}
          onPress={() => { /* TODO: Navigate to booking */ }}
        >
          <Text style={[styles.bookButtonText, { fontSize: normalizeFontSize(16) }]}>Réserver</Text>
        </TouchableOpacity>
      </View>
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#666',
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
  name: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: '#666',
    fontWeight: '600',
  },
  description: {
    color: '#666',
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
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    color: '#2D2D2D',
    fontWeight: '500',
  },
  cityText: {
    color: '#666',
    marginTop: 4,
  },
  landmarkText: {
    color: '#666',
  },
  therapistCard: {
    backgroundColor: '#F5F5F5',
  },
  therapistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  therapistName: {
    fontWeight: '600',
    color: '#2D2D2D',
    flex: 1,
  },
  therapistRating: {
    color: '#FFB800',
    fontWeight: '600',
  },
  therapistSpecialization: {
    color: '#666',
  },
  mapContainer: {
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
  },
  mapHint: {
    color: '#666',
  },
  serviceCard: {
    backgroundColor: '#F5F5F5',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceName: {
    fontWeight: '600',
    color: '#2D2D2D',
    flex: 1,
  },
  servicePrice: {
    fontWeight: '700',
    color: '#FF6B6B',
  },
  serviceDuration: {
    color: '#666',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureTag: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  featureText: {
    color: '#2D2D2D',
    fontWeight: '500',
  },
  hoursText: {
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
  bookButtonText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholderText: {
    color: '#999',
  },
});

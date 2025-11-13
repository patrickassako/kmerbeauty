import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useTherapist, useTherapistServices } from '../../hooks/useTherapists';
import { useSalon, useSalonServices } from '../../hooks/useSalons';
import { useTherapistReviews, useSalonReviews } from '../../hooks/useReviews';
import { formatCurrency, type CountryCode } from '../../utils/currency';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ProviderDetailsRouteProp = RouteProp<HomeStackParamList, 'ProviderDetails'>;
type ProviderDetailsNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'ProviderDetails'>;

export const ProviderDetailsScreen: React.FC = () => {
  const route = useRoute<ProviderDetailsRouteProp>();
  const navigation = useNavigation<ProviderDetailsNavigationProp>();
  const { providerId, providerType } = route.params;

  const { normalizeFontSize, spacing, isTablet, containerPaddingHorizontal } = useResponsive();
  const { language } = useI18n();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [countryCode] = useState<CountryCode>('CM');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const isTherapist = providerType === 'therapist';

  // Charger les détails du thérapeute ou salon
  const { therapist, loading: loadingTherapist } = useTherapist(isTherapist ? providerId : undefined);
  const { salon, loading: loadingSalon } = useSalon(!isTherapist ? providerId : undefined);

  // Charger les services
  const { services: therapistServices, loading: loadingTherapistServices } = useTherapistServices(
    isTherapist ? providerId : undefined
  );
  const { services: salonServices, loading: loadingSalonServices } = useSalonServices(
    !isTherapist ? providerId : undefined
  );

  // Charger les reviews
  const { reviews: therapistReviews, loading: loadingTherapistReviews } = useTherapistReviews(
    isTherapist ? providerId : undefined
  );
  const { reviews: salonReviews, loading: loadingSalonReviews } = useSalonReviews(
    !isTherapist ? providerId : undefined
  );

  const loading = (isTherapist
    ? loadingTherapist || loadingTherapistServices || loadingTherapistReviews
    : loadingSalon || loadingSalonServices || loadingSalonReviews
  );

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Les hooks se rafraîchiront automatiquement
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Utiliser les données réelles du provider
  const providerData = isTherapist ? therapist : salon;
  const education = therapist?.education || [];
  const portfolio = isTherapist ? (therapist?.portfolio_images || []) : (salon?.ambiance_images || []);

  // Obtenir le nom du provider
  const providerName = isTherapist
    ? `${therapist?.user?.first_name || ''} ${therapist?.user?.last_name || ''}`.trim() || 'Thérapeute'
    : (language === 'fr' ? salon?.name_fr : salon?.name_en) || 'Institut';

  // Obtenir la bio/description
  const providerBio = isTherapist
    ? (language === 'fr' ? therapist?.bio_fr : therapist?.bio_en)
    : (language === 'fr' ? salon?.description_fr : salon?.description_en);

  // Obtenir le nom du salon pour un thérapeute
  const salonName = isTherapist
    ? (therapist?.salon ? (language === 'fr' ? therapist.salon.name_fr : therapist.salon.name_en) : 'Independent')
    : undefined;

  // Reviews réelles
  const reviews = (isTherapist ? therapistReviews : salonReviews).map((review) => {
    const authorName = `${review.user.first_name} ${review.user.last_name.charAt(0)}.`;
    const reviewDate = new Date(review.created_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));

    let dateText = '';
    if (diffDays === 0) {
      dateText = language === 'fr' ? "Aujourd'hui" : 'Today';
    } else if (diffDays === 1) {
      dateText = language === 'fr' ? 'Hier' : 'Yesterday';
    } else if (diffDays < 7) {
      dateText = language === 'fr' ? `Il y a ${diffDays} jours` : `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      dateText = language === 'fr'
        ? `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
        : `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      dateText = language === 'fr'
        ? `Il y a ${months} mois`
        : `${months} month${months > 1 ? 's' : ''} ago`;
    }

    return {
      id: review.id,
      author: authorName,
      rating: review.rating,
      date: dateText,
      comment: review.comment || '',
    };
  });

  // Services offerts par ce prestataire avec les bonnes données
  const services = (isTherapist ? therapistServices : salonServices).map((item) => ({
    id: item.service_id || item.service?.id || '',
    name: language === 'fr' ? item.service?.name_fr : item.service?.name_en,
    description: language === 'fr' ? item.service?.description_fr : item.service?.description_en,
    duration: item.service?.duration || item.duration,
    price: item.price || item.service?.base_price || 0,
    images: item.service?.images || [],
  }));

  return (
    <View style={styles.container}>
      {/* Back and Close Buttons - Fixed at top */}
      <View style={styles.fixedButtonsContainer}>
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

      {/* Content - Fully Scrollable */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingBottom: spacing(12),
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Image */}
        <View style={[styles.headerImageContainer, { height: spacing(40) }]}>
          {!loading && providerData && (
            isTherapist ? (
              // Thérapeute: profile_image ou première image du portfolio
              (therapist?.profile_image || (therapist?.portfolio_images && therapist.portfolio_images.length > 0)) ? (
                <Image
                  source={{ uri: therapist?.profile_image || therapist.portfolio_images[0] }}
                  style={styles.headerImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.headerImagePlaceholder}>
                  <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(16) }]}>
                    Provider Image
                  </Text>
                </View>
              )
            ) : (
              // Salon: cover_image ou première image d'ambiance
              (salon?.cover_image || (salon?.ambiance_images && salon.ambiance_images.length > 0)) ? (
                <Image
                  source={{ uri: salon?.cover_image || salon.ambiance_images[0] }}
                  style={styles.headerImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.headerImagePlaceholder}>
                  <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(16) }]}>
                    Provider Image
                  </Text>
                </View>
              )
            )
          ) || (
            <View style={styles.headerImagePlaceholder}>
              <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(16) }]}>
                Provider Image
              </Text>
            </View>
          )}
        </View>
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
                {providerName || 'Provider Name'}
              </Text>

              {/* Salon & Rating */}
              <View style={[styles.infoRow, { marginBottom: spacing(0.5) }]}>
                {isTherapist && salonName && (
                  <Text style={[styles.salon, { fontSize: normalizeFontSize(14) }]}>
                    ✦ {salonName}
                  </Text>
                )}
                <Text style={[styles.rating, { fontSize: normalizeFontSize(14) }]}>
                  ⭐ {providerData?.rating != null ? providerData.rating.toFixed(1) : '5.0'} ({providerData?.review_count || 0})
                </Text>
              </View>

              {/* Licensed & Experience */}
              <View style={[styles.badgesRow, { marginBottom: spacing(2) }]}>
                {isTherapist && therapist?.is_licensed && (
                  <View style={[styles.badge, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(2), marginRight: spacing(1) }]}>
                    <Text style={[styles.badgeText, { fontSize: normalizeFontSize(12) }]}>✓ Licensed</Text>
                  </View>
                )}
                {!isTherapist && salon?.years_experience && (
                  <View style={[styles.badge, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(2) }]}>
                    <Text style={[styles.badgeText, { fontSize: normalizeFontSize(12) }]}>
                      📅 {salon.years_experience} Years Experience
                    </Text>
                  </View>
                )}
              </View>

              {/* Bio */}
              {providerBio && (
                <Text style={[styles.bio, { fontSize: normalizeFontSize(14), marginBottom: spacing(3), lineHeight: normalizeFontSize(20) }]}>
                  {providerBio}
                </Text>
              )}
            </>
          )}

          {/* Education Section - only for therapists with education */}
          {!loading && isTherapist && education.length > 0 && (
            <TouchableOpacity
              style={[styles.section, { paddingVertical: spacing(2), borderTopWidth: 1 }]}
              onPress={() => toggleSection('education')}
            >
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18) }]}>Education</Text>
                <Text style={[styles.expandIcon, { fontSize: normalizeFontSize(20) }]}>
                  {expandedSection === 'education' ? '▲' : '▼'}
                </Text>
              </View>

              {expandedSection === 'education' && (
                <View style={[styles.sectionContent, { marginTop: spacing(2) }]}>
                  {education.map((item, index) => {
                    // item est un objet avec {id, title, institution, year}
                    const educationText = typeof item === 'string'
                      ? item
                      : `${item.title}${item.institution ? ` - ${item.institution}` : ''}${item.year ? ` (${item.year})` : ''}`;

                    return (
                      <View key={item.id || index} style={[styles.listItem, { marginBottom: spacing(1.5) }]}>
                        <Text style={[styles.bullet, { fontSize: normalizeFontSize(14) }]}>✦</Text>
                        <Text style={[styles.listItemText, { fontSize: normalizeFontSize(14), lineHeight: normalizeFontSize(20) }]}>
                          {educationText}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Services/Packages Section */}
          {!loading && (
            <TouchableOpacity
              style={[styles.section, { paddingVertical: spacing(2), borderTopWidth: 1 }]}
              onPress={() => toggleSection('services')}
            >
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18) }]}>
                  Services ({services.length})
                </Text>
                <Text style={[styles.expandIcon, { fontSize: normalizeFontSize(20) }]}>
                  {expandedSection === 'services' ? '▲' : '▼'}
                </Text>
              </View>

              {expandedSection === 'services' && (
                <View style={[styles.sectionContent, { marginTop: spacing(2) }]}>
                  {services.length === 0 ? (
                    <Text style={[styles.emptyText, { fontSize: normalizeFontSize(14), color: '#999', textAlign: 'center', paddingVertical: spacing(2) }]}>
                      Aucun service disponible
                    </Text>
                  ) : (
                    services.map((serviceItem, index) => {
                      // Récupérer le service complet depuis les données chargées
                      const fullService = isTherapist
                        ? therapistServices[index]?.service
                        : salonServices[index]?.service;

                      return (
                        <TouchableOpacity
                          key={serviceItem.id}
                          style={[styles.serviceCard, { marginBottom: spacing(2), borderRadius: spacing(1.5), overflow: 'hidden' }]}
                          onPress={() => {
                            if (fullService) {
                              navigation.navigate('ServiceDetails', {
                                service: fullService,
                                providerId: providerId,
                                providerType: providerType,
                              });
                            }
                          }}
                        >
                        {/* Service Image */}
                        {serviceItem.images && serviceItem.images.length > 0 && serviceItem.images[0] && (
                          <View style={[styles.serviceCardImageContainer, { height: spacing(20), marginBottom: spacing(1.5) }]}>
                            <Image
                              source={{ uri: serviceItem.images[0] }}
                              style={styles.serviceCardImage}
                              resizeMode="cover"
                            />
                          </View>
                        )}

                        <View style={{ padding: spacing(2) }}>
                          <View style={[styles.serviceCardHeader, { marginBottom: spacing(1) }]}>
                            <Text style={[styles.serviceCardName, { fontSize: normalizeFontSize(16) }]}>
                              {serviceItem.name}
                            </Text>
                            <Text style={[styles.serviceCardPrice, { fontSize: normalizeFontSize(16) }]}>
                              {formatCurrency(serviceItem.price, countryCode)}
                            </Text>
                          </View>
                          {serviceItem.description && (
                            <Text style={[styles.serviceCardDescription, { fontSize: normalizeFontSize(13), marginBottom: spacing(0.5) }]}>
                              {serviceItem.description}
                            </Text>
                          )}
                          <View style={styles.serviceCardFooter}>
                            <Text style={[styles.serviceCardDuration, { fontSize: normalizeFontSize(12) }]}>
                              ⏰ {serviceItem.duration} min
                            </Text>
                            <TouchableOpacity
                              style={[styles.bookButton, { paddingHorizontal: spacing(2), paddingVertical: spacing(0.75), borderRadius: spacing(2) }]}
                            >
                              <Text style={[styles.bookButtonText, { fontSize: normalizeFontSize(12) }]}>
                                Réserver
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Portfolio Section */}
          {!loading && portfolio.length > 0 && (
            <TouchableOpacity
              style={[styles.section, { paddingVertical: spacing(2), borderTopWidth: 1 }]}
              onPress={() => toggleSection('portfolio')}
            >
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18) }]}>Portfolio</Text>
                <Text style={[styles.expandIcon, { fontSize: normalizeFontSize(20) }]}>
                  {expandedSection === 'portfolio' ? '▲' : '▼'}
                </Text>
              </View>

              {expandedSection === 'portfolio' && (
                <View style={[styles.portfolioGrid, { marginTop: spacing(2), gap: spacing(1.5) }]}>
                  {portfolio.map((imageUrl: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.portfolioItem,
                        {
                          width: (SCREEN_WIDTH - spacing(5) - spacing(1.5)) / 2,
                          height: spacing(20),
                          borderRadius: spacing(1.5),
                        },
                      ]}
                      onPress={() => imageUrl && setSelectedImage(imageUrl)}
                    >
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.portfolioImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.portfolioPlaceholder}>
                          <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>
                            Image {index + 1}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Review Section */}
          {!loading && (
            <TouchableOpacity
              style={[styles.section, { paddingVertical: spacing(2), borderTopWidth: 1, borderBottomWidth: 1 }]}
              onPress={() => toggleSection('reviews')}
            >
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18) }]}>Review</Text>
                <Text style={[styles.expandIcon, { fontSize: normalizeFontSize(20) }]}>
                  {expandedSection === 'reviews' ? '▲' : '▼'}
                </Text>
              </View>

              {expandedSection === 'reviews' && (
                <View style={[styles.sectionContent, { marginTop: spacing(2) }]}>
                  {reviews.length === 0 ? (
                    <Text style={[styles.emptyText, { fontSize: normalizeFontSize(14), color: '#999', textAlign: 'center', paddingVertical: spacing(2) }]}>
                      Aucun avis disponible
                    </Text>
                  ) : (
                    reviews.map((review) => (
                      <View key={review.id} style={[styles.reviewCard, { marginBottom: spacing(2), padding: spacing(2), borderRadius: spacing(1.5) }]}>
                        <View style={[styles.reviewHeader, { marginBottom: spacing(1) }]}>
                          <View>
                            <Text style={[styles.reviewAuthor, { fontSize: normalizeFontSize(14) }]}>
                              {review.author}
                            </Text>
                            <Text style={[styles.reviewDate, { fontSize: normalizeFontSize(12) }]}>
                              {review.date}
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
                    ))
                  )}
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={[styles.bottomButtons, { padding: spacing(2.5), paddingHorizontal: isTablet ? containerPaddingHorizontal + spacing(2.5) : spacing(2.5) }]}>
        <TouchableOpacity
          style={[styles.favoriteButton, { flex: 1, paddingVertical: spacing(2), borderRadius: spacing(3), marginRight: spacing(1.5) }]}
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <Text style={[styles.favoriteButtonIcon, { fontSize: normalizeFontSize(18) }]}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
          <Text style={[styles.favoriteButtonText, { fontSize: normalizeFontSize(16) }]}>
            {isFavorite ? 'Favori' : 'Ajouter aux favoris'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.servicesButton, { flex: 1.5, paddingVertical: spacing(2), borderRadius: spacing(3) }]}
          onPress={() => {
            // Expand services section or navigate to full services view
            setExpandedSection('services');
          }}
        >
          <Text style={[styles.servicesButtonIcon, { fontSize: normalizeFontSize(18) }]}>✂️</Text>
          <Text style={[styles.servicesButtonText, { fontSize: normalizeFontSize(16) }]}>Services</Text>
        </TouchableOpacity>
      </View>

      {/* Image Zoom Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setSelectedImage(null)}
          >
            <View style={styles.modalContent}>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.zoomedImage}
                  resizeMode="contain"
                />
              )}
              <TouchableOpacity
                style={[styles.modalCloseButton, { top: spacing(6), right: spacing(2), width: spacing(5), height: spacing(5) }]}
                onPress={() => setSelectedImage(null)}
              >
                <Text style={[styles.closeIcon, { fontSize: normalizeFontSize(24) }]}>✕</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
  fixedButtonsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    pointerEvents: 'box-none',
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
  name: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salon: {
    color: '#666',
    flex: 1,
  },
  rating: {
    color: '#666',
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  badgeText: {
    color: '#2D2D2D',
    fontWeight: '500',
  },
  bio: {
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
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#2D2D2D',
    marginRight: 8,
    marginTop: 2,
  },
  listItemText: {
    flex: 1,
    color: '#666',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  portfolioItem: {
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  portfolioPlaceholder: {
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
  emptyText: {
    color: '#999',
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
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  favoriteButtonIcon: {
    marginRight: 8,
  },
  favoriteButtonText: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  servicesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D2D2D',
  },
  servicesButtonIcon: {
    marginRight: 8,
  },
  servicesButtonText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalBackground: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomedImage: {
    width: SCREEN_WIDTH,
    height: '80%',
  },
  modalCloseButton: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#999',
  },
  serviceCard: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  serviceCardImageContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  serviceCardImage: {
    width: '100%',
    height: '100%',
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceCardName: {
    fontWeight: '600',
    color: '#2D2D2D',
    flex: 1,
    marginRight: 8,
  },
  serviceCardPrice: {
    fontWeight: '700',
    color: '#FF6B6B',
  },
  serviceCardDescription: {
    color: '#666',
    lineHeight: 18,
  },
  serviceCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  serviceCardDuration: {
    color: '#999',
  },
  bookButton: {
    backgroundColor: '#2D2D2D',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

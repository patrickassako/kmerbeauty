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
import { useTherapists } from '../../hooks/useTherapists';
import { useSalons } from '../../hooks/useSalons';
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

  // Charger les détails du service
  const { service: serviceData, loading: loadingService } = useService(serviceParam.id);

  // Charger les prestataires pour ce service
  const { therapists, loading: loadingTherapists, refetch: refetchTherapists } = useTherapists({ serviceId: serviceParam.id });
  const { salons, loading: loadingSalons, refetch: refetchSalons } = useSalons({ serviceId: serviceParam.id });

  const loading = loadingService || loadingTherapists || loadingSalons;
  const service = serviceData || serviceParam;
  const totalProviders = therapists.length + salons.length;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchTherapists(), refetchSalons()]);
    setRefreshing(false);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleProviderPress = (provider: any) => {
    navigation.navigate('ProviderDetails', { provider });
  };

  const handleViewProviders = () => {
    navigation.navigate('ServiceProviders', { service });
  };

  // Mock data for components/steps (peut être enrichi depuis la BDD plus tard)
  const components = service.components || [
    'Consultation et analyse des besoins',
    'Préparation et nettoyage',
    'Application des produits professionnels',
    'Techniques avancées de traitement',
    'Massage relaxant',
    'Finition et conseils personnalisés',
  ];

  const reviews = [
    {
      id: 1,
      author: 'Sophie M.',
      rating: 5,
      date: '1 semaine',
      comment: 'Service excellent ! Très professionnel et résultats incroyables.',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header Image Gallery */}
      <View style={[styles.headerImageContainer, { height: spacing(40) }]}>
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

              {/* Provider Count Info */}
              <TouchableOpacity
                style={[styles.providerSection, { padding: spacing(2), borderRadius: spacing(2), marginBottom: spacing(3) }]}
                onPress={handleViewProviders}
              >
                <Text style={[styles.providerLabel, { fontSize: normalizeFontSize(12), marginBottom: spacing(0.5) }]}>
                  DISPONIBLE CHEZ
                </Text>
                <View style={styles.providerInfo}>
                  <Text style={[styles.providerName, { fontSize: normalizeFontSize(16) }]}>
                    {totalProviders} prestataire{totalProviders > 1 ? 's' : ''}
                  </Text>
                  <Text style={[styles.viewButton, { fontSize: normalizeFontSize(14) }]}>
                    Voir →
                  </Text>
                </View>
              </TouchableOpacity>

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
                    {components.map((item, index) => (
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

              {/* Reviews Section */}
              <TouchableOpacity
                style={[styles.section, { paddingVertical: spacing(2), borderTopWidth: 1, borderBottomWidth: 1 }]}
                onPress={() => toggleSection('reviews')}
              >
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18) }]}>
                    Avis ({reviews.length})
                  </Text>
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
          onPress={handleViewProviders}
        >
          <Text style={[styles.bookButtonText, { fontSize: normalizeFontSize(16) }]}>
            Voir les prestataires ({totalProviders})
          </Text>
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
  providerSection: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  providerLabel: {
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  providerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerName: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  viewButton: {
    color: '#FF6B6B',
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
  bookButtonText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholderText: {
    color: '#999',
  },
});

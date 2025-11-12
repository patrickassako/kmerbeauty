import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCurrency, type CountryCode } from '../../utils/currency';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SalonDetailsRouteProp = RouteProp<HomeStackParamList, 'SalonDetails'>;
type SalonDetailsNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'SalonDetails'>;

export const SalonDetailsScreen: React.FC = () => {
  const route = useRoute<SalonDetailsRouteProp>();
  const navigation = useNavigation<SalonDetailsNavigationProp>();
  const { salon } = route.params;

  const { normalizeFontSize, spacing, isTablet, containerPaddingHorizontal } = useResponsive();
  const [expandedSection, setExpandedSection] = useState<string | null>('services');
  const [countryCode] = useState<CountryCode>('CM');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const openMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${salon.latitude},${salon.longitude}`;
    Linking.openURL(url);
  };

  // Mock services data
  const services = [
    { id: '1', name: 'Coiffure Complète', price: 15000, duration: 60 },
    { id: '2', name: 'Maquillage Professionnel', price: 25000, duration: 90 },
    { id: '3', name: 'Manucure & Pédicure', price: 12000, duration: 45 },
    { id: '4', name: 'Massage Relaxant', price: 30000, duration: 120 },
  ];

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
        <View style={styles.headerImagePlaceholder}>
          <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(16) }]}>
            Salon Photos Gallery
          </Text>
        </View>

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
      >
        <View style={[styles.contentInner, { paddingHorizontal: spacing(2.5), paddingTop: spacing(3) }]}>
          {/* Name */}
          <Text style={[styles.name, { fontSize: normalizeFontSize(28), marginBottom: spacing(1) }]}>
            {salon.name}
          </Text>

          {/* Rating */}
          <View style={[styles.infoRow, { marginBottom: spacing(2) }]}>
            <Text style={[styles.rating, { fontSize: normalizeFontSize(14) }]}>
              ⭐ {salon.rating} ({salon.reviews} avis)
            </Text>
          </View>

          {/* Description */}
          <Text style={[styles.description, { fontSize: normalizeFontSize(14), marginBottom: spacing(3), lineHeight: normalizeFontSize(20) }]}>
            {salon.description}
          </Text>

          {/* Address & Map */}
          <View style={[styles.section, { paddingVertical: spacing(2), borderTopWidth: 1, borderBottomWidth: 1 }]}>
            <View style={styles.addressHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18), marginBottom: spacing(1) }]}>
                  Adresse
                </Text>
                <Text style={[styles.addressText, { fontSize: normalizeFontSize(14), lineHeight: normalizeFontSize(20) }]}>
                  {salon.address}
                </Text>
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
          <TouchableOpacity
            style={[styles.section, { paddingVertical: spacing(2), borderBottomWidth: 1 }]}
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
                {services.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[styles.serviceCard, { marginBottom: spacing(1.5), padding: spacing(2), borderRadius: spacing(1.5) }]}
                  >
                    <View style={styles.serviceHeader}>
                      <Text style={[styles.serviceName, { fontSize: normalizeFontSize(16) }]}>
                        {service.name}
                      </Text>
                      <Text style={[styles.servicePrice, { fontSize: normalizeFontSize(16) }]}>
                        {formatCurrency(service.price, countryCode)}
                      </Text>
                    </View>
                    <Text style={[styles.serviceDuration, { fontSize: normalizeFontSize(12) }]}>
                      ⏰ {service.duration} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </TouchableOpacity>

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
          {salon.openingHours && (
            <View style={[styles.section, { paddingVertical: spacing(2), borderBottomWidth: 1 }]}>
              <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18), marginBottom: spacing(1) }]}>
                Horaires d'ouverture
              </Text>
              <Text style={[styles.hoursText, { fontSize: normalizeFontSize(14) }]}>
                {salon.openingHours}
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

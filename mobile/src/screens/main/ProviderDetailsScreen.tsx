import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCurrency, type CountryCode } from '../../utils/currency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProviderDetailsScreenProps {
  onBack: () => void;
  onClose: () => void;
  onViewShop: () => void;
  onViewServices: () => void;
}

export const ProviderDetailsScreen: React.FC<ProviderDetailsScreenProps> = ({
  onBack,
  onClose,
  onViewShop,
  onViewServices,
}) => {
  const { normalizeFontSize, spacing, isTablet, containerPaddingHorizontal } = useResponsive();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [countryCode] = useState<CountryCode>('CM');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const education = [
    'Diploma in Esthetics from Paris Cosmetology School',
    'Certified in Advanced Facial Techniques',
    'Licensed Massage Therapist with specialization in Swedish and Deep Tissue Massage',
  ];

  const portfolio = [
    { id: 1, type: 'image' },
    { id: 2, type: 'image' },
    { id: 3, type: 'image' },
    { id: 4, type: 'image' },
  ];

  const reviews = [
    {
      id: 1,
      author: 'Marie D.',
      rating: 5,
      date: '2 weeks ago',
      comment: 'Excellent service! Very professional and the results were amazing.',
    },
    {
      id: 2,
      author: 'Sophie K.',
      rating: 5,
      date: '1 month ago',
      comment: 'Best massage I\'ve ever had. Will definitely come back!',
    },
    {
      id: 3,
      author: 'Jean P.',
      rating: 4,
      date: '2 months ago',
      comment: 'Great experience overall. Highly recommend.',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header Image */}
      <View style={[styles.headerImageContainer, { height: spacing(40) }]}>
        <View style={styles.headerImagePlaceholder}>
          <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(16) }]}>
            Provider Image
          </Text>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { top: spacing(6), left: spacing(2), width: spacing(5), height: spacing(5) }]}
          onPress={onBack}
        >
          <Text style={[styles.backIcon, { fontSize: normalizeFontSize(24) }]}>←</Text>
        </TouchableOpacity>

        {/* Close Button */}
        <TouchableOpacity
          style={[styles.closeButton, { top: spacing(6), right: spacing(2), width: spacing(5), height: spacing(5) }]}
          onPress={onClose}
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
            Clarie Smith
          </Text>

          {/* Salon & Rating */}
          <View style={[styles.infoRow, { marginBottom: spacing(0.5) }]}>
            <Text style={[styles.salon, { fontSize: normalizeFontSize(14) }]}>
              ✦ Luxembourg Gardens Salon
            </Text>
            <Text style={[styles.rating, { fontSize: normalizeFontSize(14) }]}>⭐ (36)</Text>
          </View>

          {/* Licensed & Experience */}
          <View style={[styles.badgesRow, { marginBottom: spacing(2) }]}>
            <View style={[styles.badge, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(2), marginRight: spacing(1) }]}>
              <Text style={[styles.badgeText, { fontSize: normalizeFontSize(12) }]}>✓ Licensed</Text>
            </View>
            <View style={[styles.badge, { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(2) }]}>
              <Text style={[styles.badgeText, { fontSize: normalizeFontSize(12) }]}>📅 10 Years Experience</Text>
            </View>
          </View>

          {/* Bio */}
          <Text style={[styles.bio, { fontSize: normalizeFontSize(14), marginBottom: spacing(3), lineHeight: normalizeFontSize(20) }]}>
            Clarie Smith is a highly skilled and compassionate beautician therapist with over 10 years of experience in the beauty and wellness industry.
          </Text>

          {/* Education Section */}
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
                {education.map((item, index) => (
                  <View key={index} style={[styles.listItem, { marginBottom: spacing(1.5) }]}>
                    <Text style={[styles.bullet, { fontSize: normalizeFontSize(14) }]}>✦</Text>
                    <Text style={[styles.listItemText, { fontSize: normalizeFontSize(14), lineHeight: normalizeFontSize(20) }]}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>

          {/* Portfolio Section */}
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
                {portfolio.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.portfolioItem,
                      {
                        width: (SCREEN_WIDTH - spacing(5) - spacing(1.5)) / 2,
                        height: spacing(20),
                        borderRadius: spacing(1.5),
                      },
                    ]}
                  >
                    <View style={styles.portfolioPlaceholder}>
                      <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(12) }]}>
                        Portfolio {item.id}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>

          {/* Review Section */}
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
                {reviews.map((review) => (
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
                ))}
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={[styles.bottomButtons, { padding: spacing(2.5), paddingHorizontal: isTablet ? containerPaddingHorizontal + spacing(2.5) : spacing(2.5) }]}>
        <TouchableOpacity
          style={[styles.shopButton, { flex: 1, paddingVertical: spacing(2), borderRadius: spacing(3), marginRight: spacing(1.5) }]}
          onPress={onViewShop}
        >
          <Text style={[styles.shopButtonIcon, { fontSize: normalizeFontSize(18) }]}>🏪</Text>
          <Text style={[styles.shopButtonText, { fontSize: normalizeFontSize(16) }]}>View Shop</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.servicesButton, { flex: 1.5, paddingVertical: spacing(2), borderRadius: spacing(3) }]}
          onPress={onViewServices}
        >
          <Text style={[styles.servicesButtonIcon, { fontSize: normalizeFontSize(18) }]}>✂️</Text>
          <Text style={[styles.servicesButtonText, { fontSize: normalizeFontSize(16) }]}>Services</Text>
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
  portfolioPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
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
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  shopButtonIcon: {
    marginRight: 8,
  },
  shopButtonText: {
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
  placeholderText: {
    color: '#999',
  },
});

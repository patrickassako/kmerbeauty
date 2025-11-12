import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const { normalizeFontSize, spacing } = useResponsive();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing(2.5), paddingTop: spacing(6), paddingBottom: spacing(2) }]}>
        <View>
          <Text style={[styles.logo, { fontSize: normalizeFontSize(20) }]}>SIMONE</Text>
          <Text style={[styles.tagline, { fontSize: normalizeFontSize(10) }]}>Beautiful you, Beautifully</Text>
        </View>
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

      {/* Toggle Home/Institute */}
      <View style={[styles.toggleContainer, { paddingHorizontal: spacing(2.5), marginBottom: spacing(2) }]}>
        <TouchableOpacity style={[styles.toggleButton, styles.toggleButtonActive, { paddingVertical: spacing(1), paddingHorizontal: spacing(3), borderRadius: spacing(3) }]}>
          <Text style={[styles.toggleTextActive, { fontSize: normalizeFontSize(14) }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleButton, { paddingVertical: spacing(1), paddingHorizontal: spacing(3) }]}>
          <Text style={[styles.toggleText, { fontSize: normalizeFontSize(14) }]}>Institute</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
        <View style={[styles.searchBar, { height: spacing(6), borderRadius: spacing(1.5), paddingHorizontal: spacing(2) }]}>
          <Text style={[styles.searchPlaceholder, { fontSize: normalizeFontSize(14) }]}>Search services</Text>
        </View>
        <TouchableOpacity style={[styles.searchButton, { width: spacing(6), height: spacing(6), borderRadius: spacing(3) }]}>
          <Text style={[styles.searchIcon, { fontSize: normalizeFontSize(20) }]}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: spacing(10) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming Bookings */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>Upcoming Bookings</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { fontSize: normalizeFontSize(14) }]}>See all</Text>
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

        {/* Recommended */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20), marginBottom: spacing(2) }]}>Recommended</Text>

          <View style={[styles.recommendedCard, { borderRadius: spacing(2) }]}>
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
                  <Text style={[styles.recommendedPriceText, { fontSize: normalizeFontSize(16) }]}>$1245</Text>
                  <Text style={[styles.recommendedDuration, { fontSize: normalizeFontSize(12) }]}>⏰ 2h</Text>
                </View>
              </View>
              <View style={styles.recommendedFooter}>
                <Text style={[styles.recommendedSalon, { fontSize: normalizeFontSize(12) }]}>Beau Monde Esthétique</Text>
                <Text style={[styles.recommendedRating, { fontSize: normalizeFontSize(12) }]}>⭐ (2.3k)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Categories */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>Categories</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { fontSize: normalizeFontSize(14) }]}>See all</Text>
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
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20) }]}>Service Packages</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { fontSize: normalizeFontSize(14) }]}>See all</Text>
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
                    <Text style={[styles.packagePrice, { fontSize: normalizeFontSize(16) }]}>$1850</Text>
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
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20), marginBottom: spacing(2) }]}>Available deals</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing(2.5) }} contentContainerStyle={{ paddingHorizontal: spacing(2.5), gap: spacing(2) }}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={[styles.dealCard, { width: spacing(18), padding: spacing(2), borderRadius: spacing(2) }]}>
                <View style={[styles.dealIcon, { width: spacing(5), height: spacing(5), borderRadius: spacing(2.5), marginBottom: spacing(1) }]}>
                  <Text style={[styles.dealIconText, { fontSize: normalizeFontSize(20) }]}>%</Text>
                </View>
                <Text style={[styles.dealTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(0.5) }]}>12% off</Text>
                <Text style={[styles.dealSubtitle, { fontSize: normalizeFontSize(10) }]}>Min. order $85 Valid</Text>
                <Text style={[styles.dealSubtitle, { fontSize: normalizeFontSize(10) }]}>for all services</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Gift Cards */}
        <View style={[styles.section, { paddingHorizontal: spacing(2.5) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20), marginBottom: spacing(2) }]}>Gift Cards</Text>

          <View style={[styles.giftCard, { borderRadius: spacing(2), padding: spacing(2.5) }]}>
            <View style={[styles.giftCardIcon, { width: spacing(6), height: spacing(6), borderRadius: spacing(3), marginBottom: spacing(2) }]}>
              <Text style={[styles.giftCardIconText, { fontSize: normalizeFontSize(24) }]}>🎁</Text>
            </View>
            <View style={[styles.giftCardPrice, { marginBottom: spacing(3) }]}>
              <Text style={[styles.giftCardPriceText, { fontSize: normalizeFontSize(40) }]}>$90</Text>
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

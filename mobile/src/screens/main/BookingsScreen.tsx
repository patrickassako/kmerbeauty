import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';

export const BookingsScreen: React.FC = () => {
  const { normalizeFontSize, spacing } = useResponsive();

  const bookings = [
    {
      id: 1,
      name: 'Deep Tissue French Massage',
      price: '$1245',
      date: '23 Aug, 2024',
      time: '10am',
      provider: 'Beau Monde Esthétiq...',
      rating: '(3.9k+)',
    },
    {
      id: 2,
      name: 'Bold Brow & Eye Bar',
      price: '$780',
      date: '23 Aug, 2024',
      time: '10am',
      provider: 'Montmartre & Sacré-...',
      rating: '(1.7k+)',
    },
    {
      id: 3,
      name: 'Hairdressing with Organic cleansi...',
      price: '$1200',
      date: '23 Aug, 2024',
      time: '10am',
      provider: 'Montmartre & Sacré-...',
      rating: '(1.7k+)',
    },
    {
      id: 4,
      name: 'Scalp Tissue cleansing damage re...',
      price: '$945',
      date: '23 Aug, 2024',
      time: '10am',
      provider: 'Montmartre & Sacré-...',
      rating: '(1.7k+)',
    },
    {
      id: 5,
      name: 'Rebounding Detox Hairdressing',
      price: '$1245',
      date: '23 Aug, 2024',
      time: '10am',
      provider: 'Montmartre & Sacré-...',
      rating: '(1.7k+)',
    },
    {
      id: 6,
      name: 'Eye Candy Creations',
      price: '$700',
      date: '23 Aug, 2024',
      time: '10am',
      provider: 'Montmartre & Sacré-...',
      rating: '(1.7k+)',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing(2.5), paddingTop: spacing(6), paddingBottom: spacing(2) }]}>
        <TouchableOpacity style={[styles.backButton, { width: spacing(5), height: spacing(5) }]}>
          <Text style={[styles.backIcon, { fontSize: normalizeFontSize(20) }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>Bookings</Text>
        <TouchableOpacity style={[styles.closeButton, { width: spacing(5), height: spacing(5) }]}>
          <Text style={[styles.closeIcon, { fontSize: normalizeFontSize(20) }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Page Title */}
      <View style={[styles.pageHeader, { paddingHorizontal: spacing(2.5), paddingBottom: spacing(2) }]}>
        <Text style={[styles.pageTitle, { fontSize: normalizeFontSize(24) }]}>Bookings</Text>
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingHorizontal: spacing(2.5), paddingBottom: spacing(10) }]}
        showsVerticalScrollIndicator={false}
      >
        {bookings.map((booking) => (
          <TouchableOpacity
            key={booking.id}
            style={[styles.bookingCard, { borderRadius: spacing(2), padding: spacing(1.5), marginBottom: spacing(2) }]}
          >
            <View style={styles.bookingContent}>
              {/* Image */}
              <View style={[styles.bookingImage, { width: spacing(12), height: spacing(12), borderRadius: spacing(1.5) }]}>
                <View style={styles.bookingImagePlaceholder}>
                  <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(10) }]}>Image</Text>
                </View>
              </View>

              {/* Info */}
              <View style={styles.bookingInfo}>
                <Text style={[styles.bookingName, { fontSize: normalizeFontSize(14), marginBottom: spacing(0.5) }]} numberOfLines={1}>
                  {booking.name}
                </Text>
                <Text style={[styles.bookingPrice, { fontSize: normalizeFontSize(16), marginBottom: spacing(1) }]}>
                  {booking.price}
                </Text>
                <View style={styles.bookingDetails}>
                  <Text style={[styles.bookingDate, { fontSize: normalizeFontSize(12) }]}>📅 {booking.date}</Text>
                  <Text style={[styles.bookingTime, { fontSize: normalizeFontSize(12) }]}>⏰ {booking.time}</Text>
                </View>
                <View style={[styles.bookingFooter, { marginTop: spacing(1) }]}>
                  <Text style={[styles.bookingProvider, { fontSize: normalizeFontSize(12) }]} numberOfLines={1}>
                    ✦ {booking.provider}
                  </Text>
                  <Text style={[styles.bookingRating, { fontSize: normalizeFontSize(12) }]}>⭐ {booking.rating}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#2D2D2D',
  },
  title: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: '#2D2D2D',
  },
  pageHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pageTitle: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  content: {
    flex: 1,
  },
  contentContainer: {},
  bookingCard: {
    backgroundColor: '#F5F5F5',
  },
  bookingContent: {
    flexDirection: 'row',
    gap: 12,
  },
  bookingImage: {
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  bookingImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  placeholderText: {
    color: '#999',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  bookingPrice: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  bookingDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  bookingDate: {
    color: '#666',
  },
  bookingTime: {
    color: '#666',
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingProvider: {
    color: '#666',
    flex: 1,
  },
  bookingRating: {
    color: '#666',
  },
});

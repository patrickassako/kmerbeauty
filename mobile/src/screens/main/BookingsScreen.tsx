import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, type CountryCode } from '../../utils/currency';
import { bookingsApi, type Booking } from '../../services/api';

type BookingsNavigationProp = NativeStackNavigationProp<any>;

export const BookingsScreen: React.FC = () => {
  const navigation = useNavigation<BookingsNavigationProp>();
  const { normalizeFontSize, spacing } = useResponsive();
  const { language } = useI18n();
  const { user } = useAuth();

  const [countryCode] = useState<CountryCode>('CM');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await bookingsApi.getAll(user.id);
      // Trier par date de création (plus récent en premier)
      const sortedData = data.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setBookings(sortedData);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'CONFIRMED':
        return '#4CAF50';
      case 'PENDING':
        return '#FF9800';
      case 'COMPLETED':
        return '#2196F3';
      case 'CANCELLED':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    const upperStatus = status.toUpperCase();
    const labels = {
      PENDING: language === 'fr' ? 'En attente' : 'Pending',
      CONFIRMED: language === 'fr' ? 'Confirmée' : 'Confirmed',
      COMPLETED: language === 'fr' ? 'Terminée' : 'Completed',
      CANCELLED: language === 'fr' ? 'Annulée' : 'Cancelled',
    };
    return labels[upperStatus as keyof typeof labels] || status;
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getProviderName = (booking: Booking) => {
    if (!booking.provider) return language === 'fr' ? 'Prestataire' : 'Provider';
    if (booking.therapist_id) {
      return `${booking.provider.user?.first_name || ''} ${booking.provider.user?.last_name || ''}`.trim() || 'Thérapeute';
    } else if (booking.salon_id) {
      return (language === 'fr' ? booking.provider.name_fr : booking.provider.name_en) || booking.provider.name_fr || 'Institut';
    }
    return language === 'fr' ? 'Prestataire' : 'Provider';
  };

  const getServiceName = (booking: Booking) => {
    if (booking.items && booking.items.length > 0) {
      const firstService = booking.items[0].service_name;
      if (booking.items.length > 1) {
        return language === 'fr'
          ? `${firstService} +${booking.items.length - 1}`
          : `${firstService} +${booking.items.length - 1}`;
      }
      return firstService;
    }
    return language === 'fr' ? 'Service' : 'Service';
  };

  const getServiceImage = (booking: Booking): string | null => {
    if (booking.items && booking.items.length > 0) {
      const firstItem = booking.items[0];
      if (firstItem.service?.images && firstItem.service.images.length > 0) {
        return firstItem.service.images[0];
      }
    }
    return null;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2D2D2D" />
        <Text style={[styles.loadingText, { fontSize: normalizeFontSize(14), marginTop: spacing(2) }]}>
          {language === 'fr' ? 'Chargement...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing(2.5), paddingTop: spacing(6), paddingBottom: spacing(2) }]}>
        <View style={{ width: spacing(5) }} />
        <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>
          {language === 'fr' ? 'Réservations' : 'Bookings'}
        </Text>
        <View style={{ width: spacing(5) }} />
      </View>

      {/* Page Title */}
      <View style={[styles.pageHeader, { paddingHorizontal: spacing(2.5), paddingBottom: spacing(2) }]}>
        <Text style={[styles.pageTitle, { fontSize: normalizeFontSize(24) }]}>
          {language === 'fr' ? 'Mes réservations' : 'My Bookings'}
        </Text>
        <Text style={[styles.pageSubtitle, { fontSize: normalizeFontSize(14), marginTop: spacing(0.5) }]}>
          {bookings.length} {language === 'fr' ? 'réservation(s)' : 'booking(s)'}
        </Text>
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingHorizontal: spacing(2.5), paddingBottom: spacing(10) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2D2D2D']} />
        }
      >
        {bookings.length === 0 ? (
          <View style={[styles.emptyContainer, { paddingVertical: spacing(10) }]}>
            <Text style={[styles.emptyIcon, { fontSize: normalizeFontSize(48), marginBottom: spacing(2) }]}>📅</Text>
            <Text style={[styles.emptyText, { fontSize: normalizeFontSize(16), marginBottom: spacing(1) }]}>
              {language === 'fr' ? 'Aucune réservation' : 'No bookings'}
            </Text>
            <Text style={[styles.emptySubtext, { fontSize: normalizeFontSize(14) }]}>
              {language === 'fr'
                ? 'Vos réservations apparaîtront ici'
                : 'Your bookings will appear here'}
            </Text>
          </View>
        ) : (
          bookings.map((booking) => {
            const dateTime = formatDateTime(booking.scheduled_at);
            const serviceImage = getServiceImage(booking);
            return (
              <TouchableOpacity
                key={booking.id}
                style={[styles.bookingCard, { borderRadius: spacing(2), padding: spacing(1.5), marginBottom: spacing(2) }]}
                onPress={() => {
                  navigation.navigate('Home', {
                    screen: 'BookingDetails',
                    params: { bookingId: booking.id },
                  } as any);
                }}
                activeOpacity={0.7}
              >
                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(booking.status), paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5), borderRadius: spacing(1.5), position: 'absolute', top: spacing(1.5), right: spacing(1.5), zIndex: 1 }
                  ]}
                >
                  <Text style={[styles.statusText, { fontSize: normalizeFontSize(10) }]}>
                    {getStatusLabel(booking.status)}
                  </Text>
                </View>

                <View style={styles.bookingContent}>
                  {/* Image/Icon */}
                  <View style={[styles.bookingImage, { width: spacing(12), height: spacing(12), borderRadius: spacing(1.5) }]}>
                    {serviceImage ? (
                      <Image
                        source={{ uri: serviceImage }}
                        style={styles.serviceImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.bookingImagePlaceholder}>
                        <Text style={[styles.placeholderText, { fontSize: normalizeFontSize(24) }]}>
                          {booking.therapist_id ? '👤' : '🏢'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.bookingInfo}>
                    <Text style={[styles.bookingName, { fontSize: normalizeFontSize(14), marginBottom: spacing(0.5), paddingRight: spacing(8) }]} numberOfLines={1}>
                      {getServiceName(booking)}
                    </Text>
                    <Text style={[styles.bookingPrice, { fontSize: normalizeFontSize(16), marginBottom: spacing(1) }]}>
                      {formatCurrency(booking.total, countryCode)}
                    </Text>
                    <View style={styles.bookingDetails}>
                      <Text style={[styles.bookingDate, { fontSize: normalizeFontSize(12) }]}>📅 {dateTime.date}</Text>
                      <Text style={[styles.bookingTime, { fontSize: normalizeFontSize(12) }]}>⏰ {dateTime.time}</Text>
                    </View>
                    <View style={[styles.bookingFooter, { marginTop: spacing(1) }]}>
                      <Text style={[styles.bookingProvider, { fontSize: normalizeFontSize(12) }]} numberOfLines={1}>
                        {booking.therapist_id ? '👤' : '🏢'} {getProviderName(booking)}
                      </Text>
                      {booking.provider?.rating && (
                        <Text style={[styles.bookingRating, { fontSize: normalizeFontSize(12) }]}>
                          ⭐ {booking.provider.rating.toFixed(1)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontWeight: '600',
    color: '#2D2D2D',
    textAlign: 'center',
  },
  pageHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pageTitle: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  pageSubtitle: {
    color: '#666',
  },
  content: {
    flex: 1,
  },
  contentContainer: {},
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    textAlign: 'center',
  },
  emptyText: {
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#666',
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  statusBadge: {},
  statusText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bookingContent: {
    flexDirection: 'row',
    gap: 12,
  },
  bookingImage: {
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  bookingImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
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

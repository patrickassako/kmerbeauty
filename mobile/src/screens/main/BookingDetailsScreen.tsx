import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { formatCurrency, type CountryCode } from '../../utils/currency';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { bookingsApi, type Booking } from '../../services/api';

type BookingDetailsRouteProp = RouteProp<HomeStackParamList, 'BookingDetails'>;
type BookingDetailsNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'BookingDetails'>;

export const BookingDetailsScreen: React.FC = () => {
  const route = useRoute<BookingDetailsRouteProp>();
  const navigation = useNavigation<BookingDetailsNavigationProp>();
  const { bookingId } = route.params;

  const { normalizeFontSize, spacing, isTablet, containerPaddingHorizontal } = useResponsive();
  const { language } = useI18n();
  const [countryCode] = useState<CountryCode>('CM');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const data = await bookingsApi.getById(bookingId);
      setBooking(data);
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setLoading(false);
    }
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
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getProviderName = () => {
    if (!booking?.provider) return '';
    if (booking.therapist_id) {
      return `${booking.provider.user?.first_name || ''} ${booking.provider.user?.last_name || ''}`.trim() || 'Thérapeute';
    } else if (booking.salon_id) {
      return (language === 'fr' ? booking.provider.name_fr : booking.provider.name_en) || booking.provider.name_fr || 'Institut';
    }
    return '';
  };

  const getProviderType = () => {
    return booking?.therapist_id ? 'therapist' : 'salon';
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

  if (!booking) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={[styles.errorText, { fontSize: normalizeFontSize(16) }]}>
          {language === 'fr' ? 'Réservation introuvable' : 'Booking not found'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing(2.5), paddingTop: spacing(6), paddingBottom: spacing(2) }]}>
        <TouchableOpacity
          style={[styles.backButton, { width: spacing(5), height: spacing(5), borderRadius: spacing(2.5) }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { fontSize: normalizeFontSize(24) }]}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { fontSize: normalizeFontSize(18) }]}>
            {language === 'fr' ? 'Détails de la réservation' : 'Booking Details'}
          </Text>
        </View>

        <View style={{ width: spacing(5) }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingHorizontal: isTablet ? containerPaddingHorizontal + spacing(2.5) : spacing(2.5),
          paddingBottom: spacing(10),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge */}
        <View style={[styles.statusContainer, { marginBottom: spacing(3) }]}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status), paddingHorizontal: spacing(2), paddingVertical: spacing(1), borderRadius: spacing(2) }]}>
            <Text style={[styles.statusText, { fontSize: normalizeFontSize(14) }]}>
              {getStatusLabel(booking.status)}
            </Text>
          </View>
        </View>

        {/* Services Card */}
        <View style={[styles.serviceCard, { borderRadius: spacing(2), marginBottom: spacing(3), overflow: 'hidden' }]}>
          <View style={{ padding: spacing(2) }}>
            <Text style={[styles.label, { fontSize: normalizeFontSize(12), marginBottom: spacing(1.5) }]}>
              {language === 'fr' ? 'Services' : 'Services'}
            </Text>
            {booking.items && booking.items.length > 0 ? (
              booking.items.map((item, index) => (
                <View key={item.id || index} style={[styles.itemRow, { marginBottom: spacing(1.5) }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { fontSize: normalizeFontSize(16) }]}>
                      {item.service_name}
                    </Text>
                    <Text style={[styles.itemDuration, { fontSize: normalizeFontSize(12), marginTop: spacing(0.5) }]}>
                      ⏰ {item.duration} min • {formatCurrency(item.price, countryCode)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.value, { fontSize: normalizeFontSize(14) }]}>
                {language === 'fr' ? 'Aucun service' : 'No services'}
              </Text>
            )}
            <View style={[styles.totalDuration, { marginTop: spacing(1.5), paddingTop: spacing(1.5), borderTopWidth: 1, borderTopColor: '#E0E0E0' }]}>
              <Text style={[styles.label, { fontSize: normalizeFontSize(12) }]}>
                {language === 'fr' ? 'Durée totale' : 'Total duration'}
              </Text>
              <Text style={[styles.value, { fontSize: normalizeFontSize(16), fontWeight: '700', marginTop: spacing(0.5) }]}>
                ⏰ {booking.duration} min
              </Text>
            </View>
          </View>
        </View>

        {/* Provider Card */}
        <View style={[styles.infoCard, { padding: spacing(2), borderRadius: spacing(2), marginBottom: spacing(3) }]}>
          <Text style={[styles.label, { fontSize: normalizeFontSize(12), marginBottom: spacing(1) }]}>
            {language === 'fr' ? 'Prestataire' : 'Provider'}
          </Text>
          <View style={styles.providerRow}>
            <Text style={[styles.value, { fontSize: normalizeFontSize(16), flex: 1 }]}>
              {getProviderName()}
            </Text>
            {getProviderType() === 'salon' && (
              <View style={[styles.typeBadge, { paddingHorizontal: spacing(1), paddingVertical: spacing(0.5), borderRadius: spacing(1) }]}>
                <Text style={[styles.typeBadgeText, { fontSize: normalizeFontSize(10) }]}>Institut</Text>
              </View>
            )}
          </View>
          {booking.provider?.city && (
            <Text style={[styles.locationText, { fontSize: normalizeFontSize(14), marginTop: spacing(0.5) }]}>
              📍 {booking.provider.city}
            </Text>
          )}
        </View>

        {/* Date & Time Card */}
        <View style={[styles.infoCard, { padding: spacing(2), borderRadius: spacing(2), marginBottom: spacing(3) }]}>
          <Text style={[styles.label, { fontSize: normalizeFontSize(12), marginBottom: spacing(1) }]}>
            {language === 'fr' ? 'Date et heure' : 'Date & Time'}
          </Text>
          <Text style={[styles.value, { fontSize: normalizeFontSize(16), marginBottom: spacing(1) }]}>
            📅 {formatDateTime(booking.scheduled_at).date}
          </Text>
          <Text style={[styles.value, { fontSize: normalizeFontSize(16) }]}>
            🕐 {formatDateTime(booking.scheduled_at).time}
          </Text>
        </View>

        {/* Location Card */}
        {booking.street && (
          <View style={[styles.infoCard, { padding: spacing(2), borderRadius: spacing(2), marginBottom: spacing(3) }]}>
            <Text style={[styles.label, { fontSize: normalizeFontSize(12), marginBottom: spacing(1) }]}>
              {language === 'fr' ? 'Adresse' : 'Address'}
            </Text>
            <Text style={[styles.value, { fontSize: normalizeFontSize(14), lineHeight: normalizeFontSize(20) }]}>
              📍 {booking.street}
            </Text>
            {booking.city && (
              <Text style={[styles.value, { fontSize: normalizeFontSize(14), marginTop: spacing(0.5) }]}>
                {booking.city}, {booking.region}
              </Text>
            )}
          </View>
        )}

        {/* Notes */}
        {booking.notes && (
          <View style={[styles.infoCard, { padding: spacing(2), borderRadius: spacing(2), marginBottom: spacing(3) }]}>
            <Text style={[styles.label, { fontSize: normalizeFontSize(12), marginBottom: spacing(1) }]}>
              {language === 'fr' ? 'Notes' : 'Notes'}
            </Text>
            <Text style={[styles.value, { fontSize: normalizeFontSize(14), lineHeight: normalizeFontSize(20) }]}>
              {booking.notes}
            </Text>
          </View>
        )}

        {/* Price */}
        <View style={[styles.priceCard, { padding: spacing(2), borderRadius: spacing(2), marginBottom: spacing(3) }]}>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { fontSize: normalizeFontSize(12) }]}>
              {language === 'fr' ? 'Sous-total' : 'Subtotal'}
            </Text>
            <Text style={[styles.value, { fontSize: normalizeFontSize(16) }]}>
              {formatCurrency(booking.subtotal || 0, countryCode)}
            </Text>
          </View>
          {booking.travel_fee && booking.travel_fee > 0 ? (
            <View style={[styles.priceRow, { marginTop: spacing(0.5) }]}>
              <Text style={[styles.priceLabel, { fontSize: normalizeFontSize(12) }]}>
                {language === 'fr' ? 'Frais de déplacement' : 'Travel fee'}
              </Text>
              <Text style={[styles.value, { fontSize: normalizeFontSize(16) }]}>
                {formatCurrency(booking.travel_fee, countryCode)}
              </Text>
            </View>
          ) : null}
          {booking.tip && booking.tip > 0 ? (
            <View style={[styles.priceRow, { marginTop: spacing(0.5) }]}>
              <Text style={[styles.priceLabel, { fontSize: normalizeFontSize(12) }]}>
                {language === 'fr' ? 'Pourboire' : 'Tip'}
              </Text>
              <Text style={[styles.value, { fontSize: normalizeFontSize(16) }]}>
                {formatCurrency(booking.tip, countryCode)}
              </Text>
            </View>
          ) : null}
          <View style={[styles.priceRow, { marginTop: spacing(1.5), paddingTop: spacing(1.5), borderTopWidth: 1, borderTopColor: '#E0E0E0' }]}>
            <Text style={[styles.priceLabel, { fontSize: normalizeFontSize(14), fontWeight: '700' }]}>
              {language === 'fr' ? 'Total' : 'Total'}
            </Text>
            <Text style={[styles.priceValue, { fontSize: normalizeFontSize(24) }]}>
              {formatCurrency(booking.total || 0, countryCode)}
            </Text>
          </View>
        </View>

        {/* Booking ID */}
        <Text style={[styles.bookingId, { fontSize: normalizeFontSize(12), textAlign: 'center', marginTop: spacing(2) }]}>
          ID: {booking.id}
        </Text>
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
  errorText: {
    color: '#F44336',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#2D2D2D',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusBadge: {},
  statusText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  serviceImageContainer: {
    width: '100%',
    backgroundColor: '#F5F5F5',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  label: {
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  serviceName: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  duration: {
    color: '#666',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemName: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  itemDuration: {
    color: '#666',
  },
  totalDuration: {},
  infoCard: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  typeBadge: {
    backgroundColor: '#E3F2FD',
  },
  typeBadgeText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  locationText: {
    color: '#666',
  },
  priceCard: {
    backgroundColor: '#F8F8F8',
    borderWidth: 2,
    borderColor: '#2D2D2D',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  priceValue: {
    fontWeight: '700',
    color: '#FF6B6B',
  },
  bookingId: {
    color: '#999',
  },
});

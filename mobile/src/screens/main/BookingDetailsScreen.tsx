import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { formatCurrency, type CountryCode } from '../../utils/currency';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { bookingsApi, reviewsApi } from '../../services/api';
import type { Booking } from '../../types/models';
import { useAuth } from '../../contexts/AuthContext';

type BookingDetailsRouteProp = RouteProp<HomeStackParamList, 'BookingDetails'>;
type BookingDetailsNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'BookingDetails'>;

export const BookingDetailsScreen: React.FC = () => {
  const route = useRoute<BookingDetailsRouteProp>();
  const navigation = useNavigation<BookingDetailsNavigationProp>();
  const { bookingId } = route.params;

  const { normalizeFontSize, spacing, isTablet, containerPaddingHorizontal } = useResponsive();
  const { language } = useI18n();
  const { user } = useAuth();
  const [countryCode] = useState<CountryCode>('CM');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [checkingReview, setCheckingReview] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const data = await bookingsApi.getById(bookingId);
      console.log('📋 [BookingDetailsScreen] Booking loaded - Status:', data.status);
      setBooking(data);

      // Check if user has already reviewed this booking (only for completed bookings)
      if (data.status.toUpperCase() === 'COMPLETED') {
        checkExistingReview(data);
      }
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingReview = async (bookingData: Booking) => {
    if (!user?.id) return;

    try {
      setCheckingReview(true);
      let reviews: any[] = [];

      if (bookingData.therapist_id) {
        reviews = await reviewsApi.getTherapistReviews(bookingData.therapist_id);
      } else if (bookingData.salon_id) {
        reviews = await reviewsApi.getSalonReviews(bookingData.salon_id);
      }

      // Check if user has already reviewed this provider
      const userReview = reviews.find((review: any) => review.user_id === user.id);
      setHasReviewed(!!userReview);
    } catch (error) {
      console.error('Error checking existing review:', error);
      // If error, allow user to try leaving a review (backend will handle duplicate check)
      setHasReviewed(false);
    } finally {
      setCheckingReview(false);
    }
  };

  const getStatusColor = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'CONFIRMED':
        return '#2196F3';
      case 'IN_PROGRESS':
        return '#FF9800';
      case 'PENDING':
        return '#FFC107';
      case 'COMPLETED':
        return '#4CAF50';
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
      IN_PROGRESS: language === 'fr' ? 'En cours' : 'In Progress',
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
      const firstName = booking.provider.user?.first_name;
      const lastName = booking.provider.user?.last_name;
      return (firstName || lastName)
        ? `${firstName || ''} ${lastName || ''}`.trim()
        : (language === 'fr' ? 'Thérapeute' : 'Therapist');
    } else if (booking.salon_id) {
      return (language === 'fr' ? booking.provider.name_fr : booking.provider.name_en) || booking.provider.name_fr || 'Institut';
    }
    return '';
  };

  const getProviderType = () => {
    return booking?.therapist_id ? 'therapist' : 'salon';
  };

  const handleProviderPress = () => {
    if (!booking?.provider) return;

    if (booking.therapist_id) {
      navigation.navigate('ProviderDetails', {
        providerId: booking.therapist_id,
        providerType: 'therapist',
      });
    } else if (booking.salon_id) {
      navigation.navigate('SalonDetails', {
        salon: booking.provider as any,
      });
    }
  };

  const handleCancelBooking = () => {
    if (!booking) return;

    Alert.alert(
      language === 'fr' ? 'Annuler la réservation' : 'Cancel booking',
      language === 'fr'
        ? 'Êtes-vous sûr de vouloir annuler cette réservation ?'
        : 'Are you sure you want to cancel this booking?',
      [
        {
          text: language === 'fr' ? 'Non' : 'No',
          style: 'cancel',
        },
        {
          text: language === 'fr' ? 'Oui, annuler' : 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingsApi.cancel(booking.id);
              Alert.alert(
                language === 'fr' ? 'Réservation annulée' : 'Booking cancelled',
                language === 'fr'
                  ? 'Votre réservation a été annulée avec succès.'
                  : 'Your booking has been cancelled successfully.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      const parentNav = navigation.getParent();
                      if (parentNav) {
                        parentNav.navigate('Bookings' as never);
                      } else {
                        navigation.goBack();
                      }
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert(
                language === 'fr' ? 'Erreur' : 'Error',
                language === 'fr'
                  ? 'Impossible d\'annuler la réservation.'
                  : 'Unable to cancel the booking.'
              );
            }
          },
        },
      ]
    );
  };

  const handleOpenChat = () => {
    if (!booking) return;

    navigation.navigate('Chat', {
      bookingId: booking.id,
      providerId: booking.therapist_id || booking.salon_id || '',
      providerName: getProviderName(),
      providerType: getProviderType(),
    });
  };

  const handleLeaveReview = () => {
    if (!booking) return;

    navigation.navigate('Review', {
      booking: booking,
    });
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
          onPress={() => {
            // Naviguer vers le tab Bookings
            const parentNav = navigation.getParent();
            if (parentNav) {
              parentNav.navigate('Bookings' as never);
            } else {
              navigation.goBack();
            }
          }}
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

        {/* Provider Card - Clickable */}
        <TouchableOpacity
          style={[styles.providerCard, { padding: spacing(2), borderRadius: spacing(2), marginBottom: spacing(3) }]}
          onPress={handleProviderPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.label, { fontSize: normalizeFontSize(12), marginBottom: spacing(1.5) }]}>
            {language === 'fr' ? 'Prestataire' : 'Provider'}
          </Text>
          <View style={styles.providerContent}>
            <View style={[styles.providerAvatar, { width: spacing(8), height: spacing(8), borderRadius: spacing(4) }]}>
              {(() => {
                const avatar = booking.provider?.profile_image || booking.provider?.user?.avatar || booking.provider?.logo;
                if (avatar) {
                  return (
                    <Image
                      source={{ uri: avatar }}
                      style={styles.providerAvatarImage}
                      resizeMode="cover"
                    />
                  );
                }
                return (
                  <View style={[styles.providerAvatarPlaceholder, { width: '100%', height: '100%', borderRadius: spacing(4) }]}>
                    <Text style={[styles.providerAvatarText, { fontSize: normalizeFontSize(20) }]}>
                      {getProviderType() === 'salon' ? '🏢' : '👤'}
                    </Text>
                  </View>
                );
              })()}
            </View>

            <View style={[styles.providerInfo, { flex: 1, marginLeft: spacing(2) }]}>
              <View style={styles.providerHeader}>
                <Text style={[styles.providerName, { fontSize: normalizeFontSize(16), flex: 1 }]}>
                  {getProviderName()}
                </Text>
                {getProviderType() === 'salon' && (
                  <View style={[styles.typeBadge, { paddingHorizontal: spacing(1), paddingVertical: spacing(0.5), borderRadius: spacing(1), marginLeft: spacing(1) }]}>
                    <Text style={[styles.typeBadgeText, { fontSize: normalizeFontSize(10) }]}>Institut</Text>
                  </View>
                )}
              </View>
              {booking.provider?.city && (
                <Text style={[styles.providerLocation, { fontSize: normalizeFontSize(14), marginTop: spacing(0.5) }]}>
                  📍 {booking.provider.city}
                </Text>
              )}
              {booking.provider?.rating != null && (
                <Text style={[styles.providerRating, { fontSize: normalizeFontSize(12), marginTop: spacing(0.5) }]}>
                  ⭐ {booking.provider.rating.toFixed(1)}
                </Text>
              )}
            </View>

            <Text style={[styles.providerArrow, { fontSize: normalizeFontSize(20), marginLeft: spacing(1) }]}>
              →
            </Text>
          </View>
        </TouchableOpacity>

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

        {/* Action Buttons */}
        <View style={[styles.actionsContainer, { marginTop: spacing(3), marginBottom: spacing(3) }]}>
          {(() => {
            const status = booking.status.toUpperCase();
            console.log('🔍 [BookingDetailsScreen] Rendering buttons for status:', status);

            // For completed bookings, show "Leave Review" button only if user hasn't reviewed yet
            if (status === 'COMPLETED' && !hasReviewed && !checkingReview) {
              return (
                <TouchableOpacity
                  style={[
                    styles.reviewButton,
                    {
                      paddingVertical: spacing(2),
                      paddingHorizontal: spacing(3),
                      borderRadius: spacing(2),
                      width: '100%',
                    }
                  ]}
                  onPress={handleLeaveReview}
                >
                  <Text
                    style={[styles.reviewButtonText, { fontSize: normalizeFontSize(16) }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    ⭐ {language === 'fr' ? 'Laisser un avis' : 'Leave a review'}
                  </Text>
                </TouchableOpacity>
              );
            }

            // For non-completed bookings, show chat and/or cancel buttons
            return (
              <>
                {/* Chat Button - Only show if booking is CONFIRMED or IN_PROGRESS */}
                {(status === 'CONFIRMED' || status === 'IN_PROGRESS') && (
                  <TouchableOpacity
                    style={[styles.chatButton, { flex: 1, paddingVertical: spacing(2), borderRadius: spacing(2), marginRight: spacing(1) }]}
                    onPress={handleOpenChat}
                  >
                    <Text style={[styles.chatButtonText, { fontSize: normalizeFontSize(16) }]}>
                      💬 {language === 'fr' ? 'Chat' : 'Chat'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Cancel Button - Only show if booking is not COMPLETED or CANCELLED */}
                {status !== 'COMPLETED' && status !== 'CANCELLED' && (
                  <TouchableOpacity
                    style={[
                      styles.cancelButton,
                      {
                        flex: (status === 'CONFIRMED' || status === 'IN_PROGRESS') ? 1 : undefined,
                        paddingVertical: spacing(2),
                        borderRadius: spacing(2),
                        marginLeft: (status === 'CONFIRMED' || status === 'IN_PROGRESS') ? spacing(1) : 0
                      }
                    ]}
                    onPress={handleCancelBooking}
                  >
                    <Text style={[styles.cancelButtonText, { fontSize: normalizeFontSize(16) }]}>
                      {language === 'fr' ? 'Annuler la réservation' : 'Cancel booking'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            );
          })()}
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
  providerCard: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  providerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatar: {
    overflow: 'hidden',
  },
  providerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  providerAvatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerAvatarText: {
    textAlign: 'center',
  },
  providerInfo: {},
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerName: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  providerLocation: {
    color: '#666',
  },
  providerRating: {
    color: '#666',
  },
  providerArrow: {
    color: '#999',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatButton: {
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  reviewButton: {
    backgroundColor: '#FFB800',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#D32F2F',
    fontWeight: '700',
  },
  bookingId: {
    color: '#999',
  },
});

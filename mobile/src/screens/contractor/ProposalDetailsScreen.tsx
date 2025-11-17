import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { bookingsApi, Booking } from '../../services/api';
import { getFullName } from '../../utils/userHelpers';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const ProposalDetailsScreen = () => {
  const { normalizeFontSize, spacing } = useResponsive();
  const { language } = useI18n();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const bookingId = route.params?.bookingId;

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      if (!bookingId) return;
      setLoading(true);
      console.log('🔍 Loading booking details:', bookingId);
      const data = await bookingsApi.getById(bookingId);
      console.log('✅ Booking loaded:', data);
      setBooking(data);
    } catch (error: any) {
      console.error('❌ Error loading booking:', error);
      Alert.alert(
        language === 'fr' ? 'Erreur' : 'Error',
        error.message || (language === 'fr' ? 'Impossible de charger la réservation' : 'Failed to load booking')
      );
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (datetime?: string) => {
    if (!datetime) return language === 'fr' ? 'À définir' : 'TBD';
    const date = new Date(datetime);
    return date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: !language || language !== 'fr',
    });
  };

  const formatDate = (datetime?: string) => {
    if (!datetime) return language === 'fr' ? 'À définir' : 'TBD';
    const date = new Date(datetime);
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleCancelBooking = async () => {
    try {
      setCancelling(true);
      console.log('🚫 Cancelling booking:', bookingId);
      await bookingsApi.cancel(bookingId, language === 'fr' ? 'Annulé par le prestataire' : 'Cancelled by provider');
      console.log('✅ Booking cancelled successfully');
      Alert.alert(
        language === 'fr' ? 'Annulée' : 'Cancelled',
        language === 'fr' ? 'Réservation annulée avec succès' : 'Booking cancelled successfully'
      );
      setShowCancelModal(false);
      navigation.goBack();
    } catch (error: any) {
      console.error('❌ Error cancelling booking:', error);
      Alert.alert(
        language === 'fr' ? 'Erreur' : 'Error',
        error.message || (language === 'fr' ? "Impossible d'annuler la réservation" : 'Failed to cancel booking')
      );
    } finally {
      setCancelling(false);
    }
  };

  const handleChatWithClient = () => {
    if (booking?.client) {
      navigation.navigate('Chat', {
        userId: booking.client.id,
        bookingId: booking.id,
        providerName: getFullName(booking.client),
        providerType: 'client',
        providerImage: booking.client.avatar,
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2D2D2D" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: normalizeFontSize(16) }}>
          {language === 'fr' ? 'Réservation introuvable' : 'Booking not found'}
        </Text>
      </View>
    );
  }

  const serviceName =
    booking.items && booking.items.length > 0
      ? booking.items.map((item) => item.service_name).join(', ')
      : language === 'fr'
      ? 'Service'
      : 'Service';

  const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED';

  // Get service images from booking items
  const serviceImages =
    booking.items
      ?.map((item: any) => item.service?.images)
      .flat()
      .filter(Boolean) || [];

  return (
    <View style={styles.container}>
      {/* Close Button */}
      <TouchableOpacity
        style={[styles.closeButton, { top: spacing(6), right: spacing(2) }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ fontSize: normalizeFontSize(24), color: '#FFF' }}>✕</Text>
      </TouchableOpacity>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Hero Image with Gallery */}
        <View style={styles.heroSection}>
          {serviceImages.length > 0 ? (
            <>
              <Image
                source={{ uri: serviceImages[0] }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              {serviceImages.length > 1 && (
                <View style={[styles.thumbnailContainer, { bottom: spacing(2), left: spacing(2) }]}>
                  {serviceImages.slice(0, 3).map((img: string, idx: number) => (
                    <Image
                      key={idx}
                      source={{ uri: img }}
                      style={[styles.thumbnail, { width: spacing(10), height: spacing(10) }]}
                      resizeMode="cover"
                    />
                  ))}
                  {serviceImages.length > 3 && (
                    <View style={[styles.thumbnail, styles.moreThumbnail, { width: spacing(10), height: spacing(10) }]}>
                      <Text style={[styles.moreThumbnailText, { fontSize: normalizeFontSize(16) }]}>
                        +{serviceImages.length - 3}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </>
          ) : (
            <View style={[styles.heroImage, styles.placeholderImage]}>
              <Text style={{ fontSize: normalizeFontSize(48) }}>💅</Text>
            </View>
          )}
        </View>

        {/* Info Banner */}
        <View style={[styles.infoBanner, { padding: spacing(2), marginHorizontal: spacing(2) }]}>
          <View style={styles.infoBannerItem}>
            <Text style={{ fontSize: normalizeFontSize(18) }}>🏠</Text>
            <Text style={[styles.infoBannerText, { fontSize: normalizeFontSize(14), marginLeft: spacing(1) }]}>
              {booking.location_type === 'HOME'
                ? language === 'fr'
                  ? 'À domicile'
                  : 'Home'
                : language === 'fr'
                ? 'Salon'
                : 'Salon'}
            </Text>
          </View>
          <View style={styles.infoBannerItem}>
            <Text style={{ fontSize: normalizeFontSize(18) }}>🕐</Text>
            <Text style={[styles.infoBannerText, { fontSize: normalizeFontSize(14), marginLeft: spacing(1) }]}>
              {formatTime(booking.scheduled_at)}
            </Text>
          </View>
          <View style={styles.infoBannerItem}>
            <Text style={{ fontSize: normalizeFontSize(18) }}>📅</Text>
            <Text style={[styles.infoBannerText, { fontSize: normalizeFontSize(14), marginLeft: spacing(1) }]}>
              {formatDate(booking.scheduled_at)}
            </Text>
          </View>
        </View>

        {/* Price, Duration, Client Info */}
        <View style={[styles.section, { padding: spacing(2) }]}>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { fontSize: normalizeFontSize(28) }]}>{booking.total} FCFA</Text>
            <View style={styles.durationBadge}>
              <Text style={{ fontSize: normalizeFontSize(14) }}>🕐</Text>
              <Text style={[styles.duration, { fontSize: normalizeFontSize(14), marginLeft: spacing(0.5) }]}>
                {booking.duration} min
              </Text>
            </View>
            {booking.client && (
              <View style={styles.clientBadge}>
                <Text style={{ fontSize: normalizeFontSize(14) }}>👤</Text>
                <Text style={[styles.clientName, { fontSize: normalizeFontSize(14), marginLeft: spacing(0.5) }]}>
                  {getFullName(booking.client)}
                </Text>
                <Text style={[styles.rating, { fontSize: normalizeFontSize(12), marginLeft: spacing(0.5) }]}>
                  ⭐ (3.9k+)
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Service Title */}
        <View style={[styles.section, { paddingHorizontal: spacing(2), paddingBottom: spacing(1) }]}>
          <Text style={[styles.serviceTitle, { fontSize: normalizeFontSize(24) }]}>{serviceName}</Text>
        </View>

        {/* Location */}
        <View style={[styles.section, { paddingHorizontal: spacing(2), paddingBottom: spacing(2) }]}>
          <View style={styles.locationRow}>
            <Text style={{ fontSize: normalizeFontSize(18) }}>📍</Text>
            <Text style={[styles.locationText, { fontSize: normalizeFontSize(14), marginLeft: spacing(1) }]}>
              {booking.street && `${booking.street}, `}
              {booking.quarter && `${booking.quarter}, `}
              {booking.city}, {booking.region}
              {booking.landmark && ` (${booking.landmark})`}
            </Text>
          </View>
        </View>

        {/* Description/Notes */}
        {(booking.notes || booking.instructions) && (
          <View style={[styles.section, { paddingHorizontal: spacing(2), paddingBottom: spacing(2) }]}>
            <Text style={[styles.description, { fontSize: normalizeFontSize(14), lineHeight: 22 }]}>
              {booking.notes || booking.instructions}
            </Text>
          </View>
        )}

        {/* Booking Items */}
        {booking.items && booking.items.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: spacing(2), paddingBottom: spacing(2) }]}>
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18), marginBottom: spacing(1) }]}>
              {language === 'fr' ? 'Services réservés' : 'Booked Services'}
            </Text>
            {booking.items.map((item: any, idx: number) => (
              <View key={idx} style={[styles.serviceItem, { paddingVertical: spacing(1.5) }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.serviceItemName, { fontSize: normalizeFontSize(15) }]}>
                    {item.service_name}
                  </Text>
                  <Text style={[styles.serviceItemDuration, { fontSize: normalizeFontSize(13) }]}>
                    {item.duration} min
                  </Text>
                </View>
                <Text style={[styles.serviceItemPrice, { fontSize: normalizeFontSize(15) }]}>
                  {item.price} FCFA
                </Text>
              </View>
            ))}
            <View style={[styles.totalRow, { paddingTop: spacing(2), marginTop: spacing(1) }]}>
              <Text style={[styles.totalLabel, { fontSize: normalizeFontSize(16) }]}>
                {language === 'fr' ? 'Total' : 'Total'}
              </Text>
              <Text style={[styles.totalAmount, { fontSize: normalizeFontSize(18) }]}>{booking.total} FCFA</Text>
            </View>
          </View>
        )}

        {/* Status Badge */}
        <View style={[styles.section, { paddingHorizontal: spacing(2), paddingBottom: spacing(2) }]}>
          <View
            style={[
              styles.statusBadge,
              { padding: spacing(1.5), backgroundColor: getStatusColor(booking.status) },
            ]}
          >
            <Text style={[styles.statusText, { fontSize: normalizeFontSize(14) }]}>
              {language === 'fr' ? 'Statut: ' : 'Status: '}
              {getStatusLabel(booking.status, language)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionsSection, { padding: spacing(2), gap: spacing(2) }]}>
          {/* Chat Button */}
          {booking.client && (
            <TouchableOpacity style={[styles.primaryButton, { padding: spacing(2) }]} onPress={handleChatWithClient}>
              <Text style={{ fontSize: normalizeFontSize(20), marginRight: spacing(1) }}>💬</Text>
              <Text style={[styles.primaryButtonText, { fontSize: normalizeFontSize(16) }]}>
                {language === 'fr' ? 'Contacter le client' : 'Contact Client'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Cancel Button */}
          {canCancel && (
            <TouchableOpacity
              style={[styles.cancelButton, { padding: spacing(2) }]}
              onPress={() => setShowCancelModal(true)}
            >
              <Text style={{ fontSize: normalizeFontSize(20), marginRight: spacing(1) }}>✕</Text>
              <Text style={[styles.cancelButtonText, { fontSize: normalizeFontSize(16) }]}>
                {language === 'fr' ? 'Annuler le rendez-vous' : 'Cancel Appointment'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Spacer for bottom */}
        <View style={{ height: spacing(10) }} />
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.cancelModalContent, { padding: spacing(3) }]}>
            <Text style={[styles.cancelModalTitle, { fontSize: normalizeFontSize(24), marginBottom: spacing(2) }]}>
              {language === 'fr' ? 'Voulez-vous vraiment annuler?' : 'Do you really want to cancel?'}
            </Text>
            <Text style={[styles.cancelModalText, { fontSize: normalizeFontSize(14), marginBottom: spacing(3) }]}>
              {language === 'fr'
                ? "Assurez-vous de ne plus avoir besoin de ce rendez-vous avant de continuer. Si vous êtes certain de la suppression, confirmez votre décision."
                : "Ensure you no longer need the file before proceeding. If you're certain about the deletion, confirm your decision."}
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalNotNowButton, { padding: spacing(2), marginBottom: spacing(2) }]}
              onPress={() => setShowCancelModal(false)}
            >
              <Text style={[styles.modalNotNowText, { fontSize: normalizeFontSize(16) }]}>
                {language === 'fr' ? 'Pas maintenant' : 'Not Now'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton, { padding: spacing(2) }]}
              onPress={handleCancelBooking}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={{ fontSize: normalizeFontSize(20), marginRight: spacing(1), color: '#FFF' }}>✕</Text>
                  <Text style={[styles.modalCancelText, { fontSize: normalizeFontSize(16) }]}>
                    {language === 'fr' ? 'Annuler le rendez-vous' : 'Cancel Appointment'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'CONFIRMED':
      return '#4CAF50';
    case 'COMPLETED':
      return '#2196F3';
    case 'CANCELLED':
      return '#F44336';
    case 'PENDING':
    default:
      return '#FF9800';
  }
};

const getStatusLabel = (status: string, language: string) => {
  const labels = {
    fr: {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      COMPLETED: 'Terminée',
      CANCELLED: 'Annulée',
    },
    en: {
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    },
  };
  return labels[language === 'fr' ? 'fr' : 'en'][status as keyof typeof labels.en] || status;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  closeButton: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    position: 'relative',
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailContainer: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 8,
  },
  thumbnail: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  moreThumbnail: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreThumbnailText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  infoBanner: {
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    marginTop: -20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  infoBannerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoBannerText: {
    color: '#FFF',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  price: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  duration: {
    color: '#666',
    fontWeight: '500',
  },
  clientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flex: 1,
  },
  clientName: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  rating: {
    color: '#666',
  },
  serviceTitle: {
    fontWeight: 'bold',
    color: '#2D2D2D',
    lineHeight: 32,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationText: {
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  description: {
    color: '#666',
    lineHeight: 22,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  serviceItemName: {
    color: '#2D2D2D',
    fontWeight: '500',
  },
  serviceItemDuration: {
    color: '#999',
    marginTop: 4,
  },
  serviceItemPrice: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: '#2D2D2D',
  },
  totalLabel: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  statusBadge: {
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFF',
    fontWeight: '600',
  },
  actionsSection: {
    backgroundColor: '#FFF',
    marginTop: 2,
  },
  primaryButton: {
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F44336',
  },
  cancelButtonText: {
    color: '#F44336',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  cancelModalContent: {
    backgroundColor: '#DC3545',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cancelModalTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelModalText: {
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButton: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNotNowButton: {
    backgroundColor: '#FFF',
  },
  modalNotNowText: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  modalCancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    flexDirection: 'row',
  },
  modalCancelText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

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
  TextInput,
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
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [processing, setProcessing] = useState(false);

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
      console.log('🔍 Client data:', data.client);
      console.log('🔍 Client exists?', !!data.client);
      console.log('🔍 Full booking object:', JSON.stringify(data, null, 2));
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

  const handleConfirmBooking = async () => {
    try {
      setProcessing(true);
      console.log('✅ Confirming booking:', bookingId);
      await bookingsApi.confirm(bookingId);
      console.log('✅ Booking confirmed successfully');
      Alert.alert(
        language === 'fr' ? 'Confirmée' : 'Confirmed',
        language === 'fr' ? 'Commande confirmée avec succès' : 'Order confirmed successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Error confirming booking:', error);
      Alert.alert(
        language === 'fr' ? 'Erreur' : 'Error',
        error.message || (language === 'fr' ? 'Impossible de confirmer la commande' : 'Failed to confirm order')
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineBooking = async () => {
    if (!declineReason.trim()) {
      Alert.alert(
        language === 'fr' ? 'Raison requise' : 'Reason required',
        language === 'fr' ? 'Veuillez indiquer la raison du refus' : 'Please provide a reason for declining'
      );
      return;
    }

    try {
      setProcessing(true);
      console.log('🚫 Declining booking:', bookingId, '| Reason:', declineReason);
      await bookingsApi.decline(bookingId, declineReason);
      console.log('✅ Booking declined successfully');
      setShowDeclineModal(false);
      Alert.alert(
        language === 'fr' ? 'Refusée' : 'Declined',
        language === 'fr' ? 'Commande refusée' : 'Order declined',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Error declining booking:', error);
      Alert.alert(
        language === 'fr' ? 'Erreur' : 'Error',
        error.message || (language === 'fr' ? 'Impossible de refuser la commande' : 'Failed to decline order')
      );
    } finally {
      setProcessing(false);
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

  const mainService = booking.items && booking.items.length > 0 ? booking.items[0] : null;
  const additionalServices = booking.items && booking.items.length > 1 ? booking.items.slice(1) : [];
  // booking_items n'a pas d'images - utiliser placeholder
  const serviceImage = null;
  const isPending = booking.status === 'PENDING';

  const formatDate = (datetime?: string) => {
    if (!datetime) return language === 'fr' ? 'À définir' : 'TBD';
    const date = new Date(datetime);
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (datetime?: string) => {
    if (!datetime) return language === 'fr' ? 'À définir' : 'TBD';
    const date = new Date(datetime);
    return date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: language !== 'fr',
    });
  };

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
        {/* Service Image */}
        <View style={styles.heroSection}>
          {serviceImage ? (
            <Image source={{ uri: serviceImage }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, styles.placeholderImage]}>
              <Text style={{ fontSize: normalizeFontSize(48) }}>💅</Text>
            </View>
          )}
        </View>

        {/* Main Service Name */}
        <View style={[styles.section, { paddingHorizontal: spacing(2), paddingTop: spacing(2) }]}>
          <Text style={[styles.mainServiceName, { fontSize: normalizeFontSize(24) }]}>
            {mainService?.service_name || (language === 'fr' ? 'Service' : 'Service')}
          </Text>
        </View>

        {/* Date and Time */}
        <View style={[styles.section, { paddingHorizontal: spacing(2), paddingVertical: spacing(2) }]}>
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeItem}>
              <Text style={{ fontSize: normalizeFontSize(18) }}>📅</Text>
              <Text style={[styles.dateTimeText, { fontSize: normalizeFontSize(14), marginLeft: spacing(1) }]}>
                {formatDate(booking.scheduled_at)}
              </Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Text style={{ fontSize: normalizeFontSize(18) }}>🕐</Text>
              <Text style={[styles.dateTimeText, { fontSize: normalizeFontSize(14), marginLeft: spacing(1) }]}>
                {formatTime(booking.scheduled_at)}
              </Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Text style={{ fontSize: normalizeFontSize(18) }}>⏱️</Text>
              <Text style={[styles.dateTimeText, { fontSize: normalizeFontSize(14), marginLeft: spacing(1) }]}>
                {booking.duration} min
              </Text>
            </View>
          </View>
        </View>

        {/* Additional Services */}
        {additionalServices.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: spacing(2), paddingTop: spacing(2) }]}>
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1) }]}>
              {language === 'fr' ? 'Services additionnels' : 'Additional Services'}
            </Text>
            {additionalServices.map((item: any, idx: number) => (
              <View key={idx} style={[styles.additionalServiceItem, { paddingVertical: spacing(1) }]}>
                <Text style={[styles.additionalServiceName, { fontSize: normalizeFontSize(14) }]}>
                  • {item.service_name}
                </Text>
                <Text style={[styles.additionalServicePrice, { fontSize: normalizeFontSize(14) }]}>
                  {item.price} FCFA
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Price Breakdown */}
        <View style={[styles.section, { paddingHorizontal: spacing(2), paddingVertical: spacing(2) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1.5) }]}>
            {language === 'fr' ? 'Récapitulatif' : 'Summary'}
          </Text>

          {/* Main Service */}
          {mainService && (
            <View style={[styles.priceRow, { paddingVertical: spacing(1) }]}>
              <Text style={[styles.priceLabel, { fontSize: normalizeFontSize(14) }]}>
                {mainService.service_name}
              </Text>
              <Text style={[styles.priceValue, { fontSize: normalizeFontSize(14) }]}>
                {mainService.price} FCFA
              </Text>
            </View>
          )}

          {/* Additional Services Total */}
          {additionalServices.length > 0 && (
            <View style={[styles.priceRow, { paddingVertical: spacing(1) }]}>
              <Text style={[styles.priceLabel, { fontSize: normalizeFontSize(14) }]}>
                {language === 'fr' ? 'Services additionnels' : 'Additional Services'} ({additionalServices.length})
              </Text>
              <Text style={[styles.priceValue, { fontSize: normalizeFontSize(14) }]}>
                {additionalServices.reduce((sum, item) => sum + (item.price || 0), 0)} FCFA
              </Text>
            </View>
          )}

          {/* Travel Fee */}
          {booking.travel_fee && booking.travel_fee > 0 ? (
            <View style={[styles.priceRow, { paddingVertical: spacing(1) }]}>
              <Text style={[styles.priceLabel, { fontSize: normalizeFontSize(14) }]}>
                {language === 'fr' ? 'Frais de transport' : 'Travel Fee'}
              </Text>
              <Text style={[styles.priceValue, { fontSize: normalizeFontSize(14) }]}>
                {booking.travel_fee} FCFA
              </Text>
            </View>
          ) : null}

          {/* Divider */}
          <View style={[styles.divider, { marginVertical: spacing(1.5) }]} />

          {/* Subtotal */}
          {booking.subtotal && (
            <View style={[styles.priceRow, { paddingVertical: spacing(1) }]}>
              <Text style={[styles.priceLabel, { fontSize: normalizeFontSize(15), fontWeight: '600' }]}>
                {language === 'fr' ? 'Sous-total' : 'Subtotal'}
              </Text>
              <Text style={[styles.priceValue, { fontSize: normalizeFontSize(15), fontWeight: '600' }]}>
                {booking.subtotal} FCFA
              </Text>
            </View>
          )}

          {/* Total */}
          <View style={[styles.totalRow, { paddingTop: spacing(1) }]}>
            <Text style={[styles.totalLabel, { fontSize: normalizeFontSize(18) }]}>
              {language === 'fr' ? 'Total' : 'Total'}
            </Text>
            <Text style={[styles.totalAmount, { fontSize: normalizeFontSize(24) }]}>
              {booking.total} FCFA
            </Text>
          </View>
        </View>

        {/* Client Info */}
        {booking.client && (
          <View style={[styles.section, { paddingHorizontal: spacing(2), paddingVertical: spacing(2) }]}>
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1.5) }]}>
              {language === 'fr' ? 'Client' : 'Client'}
            </Text>
            <View style={styles.clientCard}>
              <View style={styles.clientInfo}>
                <View style={[styles.clientAvatar, { width: spacing(8), height: spacing(8) }]}>
                  {booking.client.avatar ? (
                    <Image source={{ uri: booking.client.avatar }} style={styles.avatarImage} resizeMode="cover" />
                  ) : (
                    <Text style={{ fontSize: normalizeFontSize(24) }}>👤</Text>
                  )}
                </View>
                <View style={{ marginLeft: spacing(2), flex: 1 }}>
                  <Text style={[styles.clientName, { fontSize: normalizeFontSize(18) }]}>
                    {getFullName(booking.client)}
                  </Text>
                  {booking.client.email && (
                    <Text style={[styles.clientEmail, { fontSize: normalizeFontSize(13) }]}>
                      {booking.client.email}
                    </Text>
                  )}
                  {booking.client.phone && (
                    <Text style={[styles.clientPhone, { fontSize: normalizeFontSize(13), marginTop: spacing(0.5) }]}>
                      📱 {booking.client.phone}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={[styles.chatButton, { marginTop: spacing(2), padding: spacing(1.5) }]}
                onPress={handleChatWithClient}
              >
                <Text style={{ fontSize: normalizeFontSize(18), marginRight: spacing(1) }}>💬</Text>
                <Text style={[styles.chatButtonText, { fontSize: normalizeFontSize(15) }]}>
                  {language === 'fr' ? 'Démarrer le chat' : 'Start Chat'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Order Notes */}
        {(booking.notes || booking.instructions) && (
          <View style={[styles.section, { paddingHorizontal: spacing(2), paddingVertical: spacing(2) }]}>
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1) }]}>
              {language === 'fr' ? 'Note de commande' : 'Order Notes'}
            </Text>
            <Text style={[styles.notes, { fontSize: normalizeFontSize(14), lineHeight: 22 }]}>
              {booking.notes || booking.instructions}
            </Text>
          </View>
        )}

        {/* Location Details */}
        <View style={[styles.section, { paddingHorizontal: spacing(2), paddingVertical: spacing(2) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1) }]}>
            {language === 'fr' ? 'Lieu de rendez-vous' : 'Meeting Location'}
          </Text>
          <View style={styles.locationDetails}>
            <Text style={[styles.locationText, { fontSize: normalizeFontSize(14), lineHeight: 20 }]}>
              📍{' '}
              {[booking.street, booking.quarter, booking.city, booking.region, booking.landmark]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {isPending && (
          <View style={[styles.actionsSection, { padding: spacing(2), gap: spacing(2) }]}>
            <TouchableOpacity
              style={[styles.confirmButton, { padding: spacing(2) }]}
              onPress={handleConfirmBooking}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={{ fontSize: normalizeFontSize(20), marginRight: spacing(1) }}>✓</Text>
                  <Text style={[styles.confirmButtonText, { fontSize: normalizeFontSize(16) }]}>
                    {language === 'fr' ? 'Prendre la commande' : 'Accept Order'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.declineButton, { padding: spacing(2) }]}
              onPress={() => setShowDeclineModal(true)}
              disabled={processing}
            >
              <Text style={{ fontSize: normalizeFontSize(20), marginRight: spacing(1) }}>✕</Text>
              <Text style={[styles.declineButtonText, { fontSize: normalizeFontSize(16) }]}>
                {language === 'fr' ? 'Décliner' : 'Decline'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status Badge for non-pending */}
        {!isPending && (
          <View style={[styles.section, { paddingHorizontal: spacing(2), paddingVertical: spacing(2) }]}>
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
        )}

        <View style={{ height: spacing(10) }} />
      </ScrollView>

      {/* Decline Modal */}
      <Modal
        visible={showDeclineModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeclineModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.declineModalContent, { padding: spacing(3) }]}>
            <Text style={[styles.declineModalTitle, { fontSize: normalizeFontSize(22), marginBottom: spacing(2) }]}>
              {language === 'fr' ? 'Raison du refus' : 'Decline Reason'}
            </Text>
            <Text style={[styles.declineModalText, { fontSize: normalizeFontSize(14), marginBottom: spacing(2) }]}>
              {language === 'fr'
                ? 'Veuillez indiquer la raison pour laquelle vous refusez cette commande:'
                : 'Please provide a reason for declining this order:'}
            </Text>

            <TextInput
              style={[
                styles.reasonInput,
                {
                  padding: spacing(2),
                  fontSize: normalizeFontSize(14),
                  minHeight: spacing(15),
                  marginBottom: spacing(3),
                },
              ]}
              placeholder={
                language === 'fr' ? 'Tapez la raison ici...' : 'Type your reason here...'
              }
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={declineReason}
              onChangeText={setDeclineReason}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton, { padding: spacing(2), marginBottom: spacing(2) }]}
              onPress={() => {
                setShowDeclineModal(false);
                setDeclineReason('');
              }}
            >
              <Text style={[styles.modalCancelText, { fontSize: normalizeFontSize(16) }]}>
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalDeclineButton, { padding: spacing(2) }]}
              onPress={handleDeclineBooking}
              disabled={processing || !declineReason.trim()}
            >
              {processing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={{ fontSize: normalizeFontSize(20), marginRight: spacing(1), color: '#FFF' }}>✕</Text>
                  <Text style={[styles.modalDeclineText, { fontSize: normalizeFontSize(16) }]}>
                    {language === 'fr' ? 'Confirmer le refus' : 'Confirm Decline'}
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
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.6,
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
  section: {
    backgroundColor: '#FFF',
    marginTop: 2,
  },
  mainServiceName: {
    fontWeight: 'bold',
    color: '#2D2D2D',
    lineHeight: 32,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    color: '#666',
    fontWeight: '500',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  additionalServiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  additionalServiceName: {
    color: '#666',
    flex: 1,
  },
  additionalServicePrice: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    color: '#666',
    flex: 1,
  },
  priceValue: {
    color: '#2D2D2D',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  clientCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientAvatar: {
    borderRadius: 100,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  clientName: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  clientEmail: {
    color: '#666',
    marginTop: 4,
  },
  clientPhone: {
    color: '#666',
  },
  chatButton: {
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  notes: {
    color: '#666',
    lineHeight: 22,
  },
  locationDetails: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  locationText: {
    color: '#666',
  },
  actionsSection: {
    backgroundColor: '#FFF',
    marginTop: 2,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F44336',
  },
  declineButtonText: {
    color: '#F44336',
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  declineModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  declineModalTitle: {
    color: '#2D2D2D',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  declineModalText: {
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  reasonInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#2D2D2D',
  },
  modalButton: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F0F0F0',
  },
  modalCancelText: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  modalDeclineButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
  },
  modalDeclineText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

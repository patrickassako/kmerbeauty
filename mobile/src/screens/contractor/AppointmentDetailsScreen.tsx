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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { bookingsApi, Booking } from '../../services/api';
import { getFullName, getUserInitials } from '../../utils/userHelpers';

export const AppointmentDetailsScreen = () => {
  const { normalizeFontSize, spacing } = useResponsive();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [appointment, setAppointment] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  const appointmentId = route.params?.appointmentId;

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      if (!appointmentId) return;
      setLoading(true);
      const data = await bookingsApi.getById(appointmentId);
      console.log('📋 [AppointmentDetailsScreen] Loaded appointment status:', data.status);
      setAppointment(data);
    } catch (error: any) {
      console.error('Error loading appointment:', error);
      Alert.alert('Error', error.message || 'Failed to load appointment');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleCancelAppointment = () => {
    Alert.alert(
      'Cancel Appointment',
      'Do want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingsApi.cancel(appointmentId, 'Cancelled by contractor');
              Alert.alert('Success', 'Appointment cancelled successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel appointment');
            }
          },
        },
      ]
    );
  };

  const handleChatWithClient = () => {
    if (appointment?.client && appointment?.id) {
      // Navigate to Chat with bookingId - this will get or create a chat for this booking
      navigation.navigate('Chat', {
        bookingId: appointment.id,
        providerId: appointment.client.id,
        providerName: getFullName(appointment.client),
        providerType: 'client',
        providerImage: appointment.client.avatar,
      });
    }
  };

  const handleCompleteAppointment = () => {
    Alert.alert(
      'Complete Appointment',
      'Mark this appointment as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await bookingsApi.complete(appointmentId);
              Alert.alert('Success', 'Appointment marked as completed');
              loadAppointment(); // Reload to update status
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to complete appointment');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2D2D2D" />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: normalizeFontSize(16) }}>Appointment not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing(10) }}>
        {/* Header Image Gallery */}
        <View style={[styles.imageGallery, { height: spacing(30) }]}>
          {/* Main Image */}
          {appointment.service?.image ? (
            <Image
              source={{ uri: appointment.service.image }}
              style={styles.mainImage}
            />
          ) : (
            <View style={[styles.mainImage, styles.placeholderImage]}>
              <Text style={{ fontSize: normalizeFontSize(40), color: '#999' }}>📷</Text>
            </View>
          )}

          {/* Close Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.closeButton,
              { top: spacing(5), right: spacing(2), width: spacing(4), height: spacing(4) },
            ]}
          >
            <Text style={{ fontSize: normalizeFontSize(20), color: '#2D2D2D' }}>✕</Text>
          </TouchableOpacity>

          {/* Thumbnail Strip */}
          <View style={[styles.thumbnailStrip, { bottom: spacing(2), left: spacing(2), gap: spacing(1) }]}>
            <View style={[styles.thumbnail, { width: spacing(8), height: spacing(8) }]}>
              {appointment.service?.image ? (
                <Image
                  source={{ uri: appointment.service.image }}
                  style={{ width: '100%', height: '100%', borderRadius: spacing(1) }}
                />
              ) : (
                <View style={[styles.placeholderImage, { width: '100%', height: '100%', borderRadius: spacing(1) }]}>
                  <Text style={{ fontSize: normalizeFontSize(20), color: '#999' }}>📷</Text>
                </View>
              )}
            </View>
            <View style={[styles.thumbnail, { width: spacing(8), height: spacing(8) }]}>
              <View style={styles.moreThumbnail}>
                <Text style={{ fontSize: normalizeFontSize(14), color: '#FFF', fontWeight: '600' }}>
                  +12
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info Banner */}
        <View
          style={[
            styles.infoBanner,
            { padding: spacing(2), gap: spacing(1.5), marginTop: -spacing(3), marginHorizontal: spacing(2) },
          ]}
        >
          <View style={styles.infoBannerRow}>
            <Text style={[styles.infoBannerText, { fontSize: normalizeFontSize(14) }]}>🏠 Home</Text>
            <Text style={[styles.infoBannerText, { fontSize: normalizeFontSize(14) }]}>
              🕐 {formatTime(appointment.scheduled_at)}
            </Text>
            <Text style={[styles.infoBannerText, { fontSize: normalizeFontSize(14) }]}>
              📅 {formatDate(appointment.scheduled_at)}
            </Text>
          </View>
        </View>

        {/* Status Badge */}
        <View style={{ paddingHorizontal: spacing(2), paddingTop: spacing(2) }}>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor:
                appointment.status === 'COMPLETED' ? '#4CAF50' :
                appointment.status === 'CONFIRMED' ? '#2196F3' :
                appointment.status === 'IN_PROGRESS' ? '#FF9800' :
                appointment.status === 'PENDING' ? '#FFC107' :
                appointment.status === 'CANCELLED' ? '#F44336' : '#999',
              paddingHorizontal: spacing(2),
              paddingVertical: spacing(1),
              borderRadius: spacing(1),
              alignSelf: 'flex-start',
            }
          ]}>
            <Text style={[styles.statusText, { fontSize: normalizeFontSize(12), color: '#FFF', fontWeight: '600' }]}>
              Status: {appointment.status}
            </Text>
          </View>
        </View>

        {/* Price and Client Info */}
        <View style={[styles.section, { padding: spacing(2), gap: spacing(1) }]}>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { fontSize: normalizeFontSize(24) }]}>
              ${appointment.total_price}
            </Text>
            <Text style={[styles.duration, { fontSize: normalizeFontSize(14) }]}>
              🕐 {appointment.duration || 60} min
            </Text>
            <View style={styles.clientBadge}>
              <Text style={[styles.clientName, { fontSize: normalizeFontSize(14) }]}>
                👤 {getFullName(appointment.client)}
              </Text>
              <Text style={{ fontSize: normalizeFontSize(14) }}>⭐ ({appointment.client_rating || 0}k+)</Text>
            </View>
          </View>
        </View>

        {/* Service Title */}
        <View style={[styles.section, { paddingHorizontal: spacing(2), paddingBottom: spacing(1) }]}>
          <Text style={[styles.serviceTitle, { fontSize: normalizeFontSize(22) }]}>
            {appointment.service?.name || 'Service'}
          </Text>
        </View>

        {/* Location */}
        <View style={[styles.section, { paddingHorizontal: spacing(2), paddingBottom: spacing(2) }]}>
          <View style={styles.locationRow}>
            <Text style={{ fontSize: normalizeFontSize(18) }}>📍</Text>
            <Text style={[styles.locationText, { fontSize: normalizeFontSize(14) }]}>
              {appointment.location?.address || '6 Parvis Notre-Dame - 754 Paris, France (1km away)'}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={[styles.section, { paddingHorizontal: spacing(2), paddingBottom: spacing(2) }]}>
          <Text style={[styles.description, { fontSize: normalizeFontSize(14), lineHeight: 22 }]}>
            {appointment.notes ||
              'Facial is specifically designed to address and manage acne-prone skin, reducing breakouts, and improving overall skin health'}
          </Text>
        </View>

        {/* Client Details Card */}
        <View
          style={[
            styles.clientCard,
            {
              marginHorizontal: spacing(2),
              padding: spacing(2),
              borderRadius: spacing(1.5),
              marginBottom: spacing(2),
            },
          ]}
        >
          <View style={styles.clientCardHeader}>
            <View style={styles.clientInfo}>
              <View
                style={[
                  styles.clientAvatar,
                  { width: spacing(6), height: spacing(6), borderRadius: spacing(3) },
                ]}
              >
                {appointment.client?.profile_picture ? (
                  <Image
                    source={{ uri: appointment.client.profile_picture }}
                    style={{ width: '100%', height: '100%', borderRadius: spacing(3) }}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={{ fontSize: normalizeFontSize(20), color: '#FFF' }}>
                      {getUserInitials(appointment.client)}
                    </Text>
                  </View>
                )}
              </View>
              <View>
                <Text style={[styles.clientCardName, { fontSize: normalizeFontSize(16) }]}>
                  {getFullName(appointment.client)} {appointment.client?.is_verified && '✓'}
                </Text>
                <Text style={[styles.userBadge, { fontSize: normalizeFontSize(12) }]}>Diamond User</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleChatWithClient} style={styles.chatButton}>
              <Text style={{ fontSize: normalizeFontSize(24) }}>💬</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Details Section */}
        <View style={[styles.detailsSection, { paddingHorizontal: spacing(2), gap: spacing(1.5) }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { fontSize: normalizeFontSize(14) }]}>Skin Type</Text>
            <Text style={[styles.detailValue, { fontSize: normalizeFontSize(14) }]}>
              {appointment.skin_type || 'Dry Skin'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { fontSize: normalizeFontSize(14) }]}>Notes</Text>
            <Text style={[styles.detailValue, { fontSize: normalizeFontSize(14) }]}>
              {appointment.notes || 'No medical conditions'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { fontSize: normalizeFontSize(14) }]}>Service Type</Text>
            <Text style={[styles.detailValue, { fontSize: normalizeFontSize(14) }]}>
              {appointment.service?.category?.name || 'Hairdressing'}
            </Text>
          </View>
        </View>

        {/* Complete Button - Only show if status is CONFIRMED or IN_PROGRESS */}
        {(appointment.status === 'CONFIRMED' || appointment.status === 'IN_PROGRESS') && (
          <View style={{ paddingHorizontal: spacing(2), paddingTop: spacing(3) }}>
            <TouchableOpacity
              onPress={handleCompleteAppointment}
              style={[
                styles.completeButton,
                {
                  padding: spacing(2),
                  borderRadius: spacing(1.5),
                },
              ]}
            >
              <Text style={{ fontSize: normalizeFontSize(18) }}>✓</Text>
              <Text style={[styles.completeButtonText, { fontSize: normalizeFontSize(16) }]}>
                Mark as Completed
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cancel Button - Only show if status is not COMPLETED or CANCELLED */}
        {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
          <View style={{ paddingHorizontal: spacing(2), paddingTop: spacing(3) }}>
            <TouchableOpacity onPress={handleCancelAppointment} style={styles.cancelTextButton}>
              <Text style={[styles.cancelText, { fontSize: normalizeFontSize(14) }]}>
                Do want to cancel this appointment?
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCancelAppointment}
              style={[
                styles.cancelButton,
                {
                  padding: spacing(2),
                  borderRadius: spacing(1.5),
                  marginTop: spacing(1.5),
                },
              ]}
            >
              <Text style={{ fontSize: normalizeFontSize(18) }}>✕</Text>
              <Text style={[styles.cancelButtonText, { fontSize: normalizeFontSize(16) }]}>
                Cancel Appointment
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Go to Homepage Button */}
      <View style={[styles.footer, { padding: spacing(2) }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ContractorDashboard')}
          style={[
            styles.homepageButton,
            {
              padding: spacing(2),
              borderRadius: spacing(1.5),
              gap: spacing(1),
            },
          ]}
        >
          <Text style={{ fontSize: normalizeFontSize(20) }}>→</Text>
          <Text style={[styles.homepageButtonText, { fontSize: normalizeFontSize(16) }]}>
            Go to Homepage
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  imageGallery: {
    position: 'relative',
    backgroundColor: '#DDD',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    backgroundColor: '#FFF',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailStrip: {
    position: 'absolute',
    flexDirection: 'row',
  },
  thumbnail: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#999',
  },
  moreThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBanner: {
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    zIndex: 1,
  },
  infoBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoBannerText: {
    color: '#FFF',
  },
  statusBadge: {
    // Styles dynamiques dans le composant
  },
  statusText: {
    // Styles dynamiques dans le composant
  },
  section: {
    backgroundColor: '#FFF',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  price: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  duration: {
    color: '#666',
  },
  clientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    justifyContent: 'flex-end',
  },
  clientName: {
    color: '#2D2D2D',
  },
  serviceTitle: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  locationText: {
    color: '#666',
    flex: 1,
  },
  description: {
    color: '#666',
  },
  clientCard: {
    backgroundColor: '#FFF',
  },
  clientCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientAvatar: {
    backgroundColor: '#DDD',
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientCardName: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  userBadge: {
    color: '#FF6B6B',
  },
  chatButton: {
    padding: 8,
  },
  detailsSection: {
    backgroundColor: '#FFF',
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    color: '#666',
  },
  detailValue: {
    color: '#2D2D2D',
    fontWeight: '500',
  },
  cancelTextButton: {
    alignItems: 'center',
  },
  cancelText: {
    color: '#FF4444',
  },
  cancelButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButtonText: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  homepageButton: {
    backgroundColor: '#2D2D2D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homepageButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

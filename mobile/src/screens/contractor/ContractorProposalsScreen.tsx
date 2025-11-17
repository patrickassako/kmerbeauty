import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { bookingsApi, contractorApi, type Booking } from '../../services/api';
import { getFullName } from '../../utils/userHelpers';

export const ContractorProposalsScreen = () => {
  const { normalizeFontSize, spacing } = useResponsive();
  const { t, language } = useI18n();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [contractorId, setContractorId] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const profile = await contractorApi.getProfileByUserId(user?.id || '');
      if (!profile) return;

      setContractorId(profile.id);
      const data = await bookingsApi.getForContractor(profile.id);
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const getStatusLabel = (status: string) => {
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

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2D2D2D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
        <Text style={[styles.logo, { fontSize: normalizeFontSize(16) }]}>K-B</Text>
        <View style={styles.headerCenter}>
          <Text style={[styles.locationIcon, { fontSize: normalizeFontSize(14) }]}>📍</Text>
          <Text style={[styles.location, { fontSize: normalizeFontSize(14) }]}>
            {user?.city && user?.region ? `${user.city}, ${user.region}` : 'Cameroun'}
          </Text>
        </View>
        <TouchableOpacity>
          <View style={[styles.avatar, { width: spacing(6), height: spacing(6) }]}>
            <Text style={{ fontSize: normalizeFontSize(20) }}>👤</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { fontSize: normalizeFontSize(24), padding: spacing(2.5) }]}>
        {language === 'fr' ? 'Réservations' : 'Bookings'}
      </Text>

      <ScrollView style={styles.scrollView}>
        {bookings.length === 0 ? (
          <Text style={[styles.emptyText, { fontSize: normalizeFontSize(14) }]}>
            {language === 'fr' ? 'Aucune réservation' : 'No bookings'}
          </Text>
        ) : (
          bookings.map((booking) => {
            const serviceName =
              booking.items && booking.items.length > 0
                ? booking.items.map((item) => item.service_name).join(', ')
                : language === 'fr'
                ? 'Services multiples'
                : 'Multiple services';

            return (
              <View
                key={booking.id}
                style={[styles.proposalCard, { padding: spacing(2.5), margin: spacing(2.5) }]}
              >
                <View style={styles.proposalHeader}>
                  <Text style={[styles.serviceName, { fontSize: normalizeFontSize(16) }]}>
                    {serviceName}
                  </Text>
                  <Text style={[styles.time, { fontSize: normalizeFontSize(12) }]}>
                    {formatTime(booking.scheduled_at || booking.created_at || '')}
                  </Text>
                </View>

                {/* Location and notes */}
                {(booking.city || booking.notes) && (
                  <Text
                    style={[styles.description, { fontSize: normalizeFontSize(13), marginTop: spacing(1) }]}
                    numberOfLines={3}
                  >
                    {booking.city && booking.region && `📍 ${booking.city}, ${booking.region}`}
                    {booking.notes && `\n${booking.notes}`}
                  </Text>
                )}

                {/* Client info */}
                {booking.client && (
                  <View style={[styles.clientInfo, { marginTop: spacing(2) }]}>
                    <View style={[styles.clientAvatar, { width: spacing(6), height: spacing(6) }]}>
                      <Text style={{ fontSize: normalizeFontSize(20) }}>👤</Text>
                    </View>
                    <View style={styles.clientDetails}>
                      <Text style={[styles.clientName, { fontSize: normalizeFontSize(14) }]}>
                        {getFullName(booking.client)}
                      </Text>
                      <Text style={[styles.ratingStars, { fontSize: normalizeFontSize(12), marginTop: 3 }]}>
                        💰 ${booking.total}
                      </Text>
                    </View>
                  </View>
                )}

                {/* View button and status */}
                <View style={[styles.actions, { marginTop: spacing(2) }]}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.viewButton,
                      { padding: spacing(1.5), flex: 1, marginRight: spacing(1) },
                    ]}
                    onPress={() => navigation.navigate('ProposalDetails', { bookingId: booking.id })}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        styles.viewButtonText,
                        { fontSize: normalizeFontSize(14) },
                      ]}
                    >
                      {language === 'fr' ? 'Voir' : 'View'}
                    </Text>
                  </TouchableOpacity>
                  <View
                    style={[
                      styles.statusBadge,
                      { marginTop: 0, marginLeft: spacing(1), paddingHorizontal: 12, paddingVertical: 6 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { fontSize: normalizeFontSize(12), color: getStatusColor(booking.status) },
                      ]}
                    >
                      {getStatusLabel(booking.status)}
                    </Text>
                  </View>
                </View>
              </View>
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
    backgroundColor: '#F9F9F9',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
  },
  logo: {
    fontWeight: 'bold',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 20,
  },
  locationIcon: {},
  location: {
    marginLeft: 5,
  },
  avatar: {
    borderRadius: 100,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    backgroundColor: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  proposalCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontWeight: 'bold',
    flex: 1,
  },
  time: {
    color: '#999',
  },
  description: {
    color: '#666',
    lineHeight: 20,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientAvatar: {
    borderRadius: 100,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientDetails: {
    marginLeft: 10,
    flex: 1,
  },
  clientName: {
    fontWeight: '600',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  ratingStars: {
    color: '#FF9800',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#2D2D2D',
  },
  viewButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  viewButtonText: {
    color: '#2D2D2D',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  statusText: {
    fontWeight: '600',
  },
});

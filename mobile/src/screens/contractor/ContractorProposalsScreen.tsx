import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
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
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [contractorId, setContractorId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [selectedFilter, allBookings]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading contractor profile for user:', user?.id);
      const profile = await contractorApi.getProfileByUserId(user?.id || '');

      if (!profile) {
        console.log('❌ No contractor profile found for user:', user?.id);
        Alert.alert(
          language === 'fr' ? 'Erreur' : 'Error',
          language === 'fr' ? 'Profil prestataire introuvable' : 'Contractor profile not found'
        );
        return;
      }

      console.log('✅ Contractor profile found:', profile.id);
      setContractorId(profile.id);

      console.log('🔍 Fetching bookings for contractor:', profile.id);
      const data = await bookingsApi.getForContractor(profile.id);
      console.log('📦 Received bookings:', data?.length || 0, 'bookings');
      console.log('📋 Bookings data:', JSON.stringify(data, null, 2));

      setAllBookings(data || []);
    } catch (error) {
      console.error('❌ Error loading bookings:', error);
      Alert.alert(
        language === 'fr' ? 'Erreur' : 'Error',
        language === 'fr'
          ? 'Impossible de charger les réservations: ' + (error as any)?.message
          : 'Failed to load bookings: ' + (error as any)?.message
      );
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    const now = new Date();
    let filtered: Booking[] = [];

    switch (selectedFilter) {
      case 'upcoming':
        // Bookings with PENDING or CONFIRMED status, or scheduled in the future
        filtered = allBookings.filter((booking) => {
          const scheduledDate = booking.scheduled_at ? new Date(booking.scheduled_at) : null;
          return (
            (booking.status === 'PENDING' || booking.status === 'CONFIRMED') &&
            (!scheduledDate || scheduledDate >= now)
          );
        });
        break;
      case 'completed':
        // Bookings with COMPLETED status or past dates
        filtered = allBookings.filter((booking) => booking.status === 'COMPLETED');
        break;
      case 'cancelled':
        // Bookings with CANCELLED status
        filtered = allBookings.filter((booking) => booking.status === 'CANCELLED');
        break;
      case 'all':
      default:
        filtered = allBookings;
        break;
    }

    console.log(`🔎 Filter: ${selectedFilter}, Results: ${filtered.length}`);
    setBookings(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
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
        {t.proposals.title}
      </Text>

      {/* Filter Chips */}
      <View style={[styles.filterContainer, { paddingHorizontal: spacing(2.5), paddingBottom: spacing(2) }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              { paddingHorizontal: spacing(2), paddingVertical: spacing(1), marginRight: spacing(1) },
              selectedFilter === 'all' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                { fontSize: normalizeFontSize(14) },
                selectedFilter === 'all' && styles.filterChipTextActive,
              ]}
            >
              {language === 'fr' ? 'Tous' : 'All'}
              {selectedFilter === 'all' && ` (${allBookings.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { paddingHorizontal: spacing(2), paddingVertical: spacing(1), marginRight: spacing(1) },
              selectedFilter === 'upcoming' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter('upcoming')}
          >
            <Text
              style={[
                styles.filterChipText,
                { fontSize: normalizeFontSize(14) },
                selectedFilter === 'upcoming' && styles.filterChipTextActive,
              ]}
            >
              {language === 'fr' ? 'À venir' : 'Upcoming'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { paddingHorizontal: spacing(2), paddingVertical: spacing(1), marginRight: spacing(1) },
              selectedFilter === 'completed' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter('completed')}
          >
            <Text
              style={[
                styles.filterChipText,
                { fontSize: normalizeFontSize(14) },
                selectedFilter === 'completed' && styles.filterChipTextActive,
              ]}
            >
              {language === 'fr' ? 'Terminées' : 'Completed'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              { paddingHorizontal: spacing(2), paddingVertical: spacing(1), marginRight: spacing(1) },
              selectedFilter === 'cancelled' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter('cancelled')}
          >
            <Text
              style={[
                styles.filterChipText,
                { fontSize: normalizeFontSize(14) },
                selectedFilter === 'cancelled' && styles.filterChipTextActive,
              ]}
            >
              {language === 'fr' ? 'Annulées' : 'Cancelled'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {bookings.length === 0 ? (
          <View style={{ padding: spacing(4), alignItems: 'center' }}>
            <Text style={[styles.emptyText, { fontSize: normalizeFontSize(16), marginBottom: spacing(2) }]}>
              {t.proposals.noProposals}
            </Text>
            <Text style={[styles.emptySubtext, { fontSize: normalizeFontSize(14), textAlign: 'center' }]}>
              {language === 'fr'
                ? 'Les clients peuvent réserver vos services depuis votre profil.'
                : 'Clients can book your services from your profile.'}
            </Text>
            {allBookings.length > 0 && (
              <Text
                style={[
                  styles.emptySubtext,
                  { fontSize: normalizeFontSize(14), textAlign: 'center', marginTop: spacing(1) },
                ]}
              >
                {language === 'fr'
                  ? `Total: ${allBookings.length} réservation(s)`
                  : `Total: ${allBookings.length} booking(s)`}
              </Text>
            )}
          </View>
        ) : (
          bookings.map((booking) => {
            const serviceName =
              booking.items && booking.items.length > 0
                ? booking.items[0].service_name
                : language === 'fr'
                  ? 'Service'
                  : 'Service';

            // Le backend récupère l'image du service en cherchant par nom
            const serviceImage = booking.items && booking.items.length > 0 ? booking.items[0].service_image : null;

            return (
              <TouchableOpacity
                key={booking.id}
                style={[styles.proposalCard, { marginHorizontal: spacing(2.5), marginBottom: spacing(2) }]}
                onPress={() => navigation.navigate('ProposalDetails', { bookingId: booking.id })}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  {/* Service Image */}
                  <View style={[styles.serviceImageContainer, { width: spacing(14), height: spacing(14) }]}>
                    {serviceImage ? (
                      <Image
                        source={{ uri: serviceImage }}
                        style={styles.serviceImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.serviceImage, styles.placeholderImage]}>
                        <Text style={{ fontSize: normalizeFontSize(32) }}>💅</Text>
                      </View>
                    )}
                  </View>

                  {/* Booking Info */}
                  <View style={styles.bookingInfo}>
                    <View style={styles.bookingHeader}>
                      <Text style={[styles.serviceName, { fontSize: normalizeFontSize(16) }]} numberOfLines={1}>
                        {serviceName}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { paddingHorizontal: spacing(1.5), paddingVertical: spacing(0.5) },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { fontSize: normalizeFontSize(11), color: getStatusColor(booking.status) },
                          ]}
                        >
                          {getStatusLabel(booking.status)}
                        </Text>
                      </View>
                    </View>

                    {/* Quarter/Location */}
                    {booking.quarter && (
                      <View style={[styles.locationRow, { marginTop: spacing(0.5) }]}>
                        <Text style={{ fontSize: normalizeFontSize(14), marginRight: spacing(0.5) }}>📍</Text>
                        <Text style={[styles.quarterText, { fontSize: normalizeFontSize(13) }]} numberOfLines={1}>
                          {booking.quarter}
                        </Text>
                      </View>
                    )}

                    {/* Client Name */}
                    {booking.client && (
                      <View style={[styles.clientRow, { marginTop: spacing(0.5) }]}>
                        <Text style={{ fontSize: normalizeFontSize(14), marginRight: spacing(0.5) }}>👤</Text>
                        <Text style={[styles.clientText, { fontSize: normalizeFontSize(13) }]} numberOfLines={1}>
                          {getFullName(booking.client)}
                        </Text>
                      </View>
                    )}

                    {/* Price and Time */}
                    <View style={[styles.priceTimeRow, { marginTop: spacing(1) }]}>
                      <Text style={[styles.price, { fontSize: normalizeFontSize(18) }]}>
                        {booking.total} FCFA
                      </Text>
                      <Text style={[styles.time, { fontSize: normalizeFontSize(12) }]}>
                        🕐 {formatTime(booking.scheduled_at || booking.created_at || '')}
                      </Text>
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
    color: '#333',
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#999',
  },
  proposalCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  serviceImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceName: {
    fontWeight: 'bold',
    color: '#2D2D2D',
    flex: 1,
    marginRight: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quarterText: {
    color: '#666',
    flex: 1,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientText: {
    color: '#666',
    flex: 1,
  },
  priceTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  time: {
    color: '#999',
    fontSize: 12,
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
  filterContainer: {
    backgroundColor: '#FFF',
  },
  filterChip: {
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#2D2D2D',
    borderColor: '#2D2D2D',
  },
  filterChipText: {
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
});

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { contractorApi, creditsApi, type DashboardStats, type Booking } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ContractorDashboardScreen = () => {
  const { normalizeFontSize, spacing } = useResponsive();
  const { t, language, setLanguage } = useI18n();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Booking[]>([]);
  const [selectedDay, setSelectedDay] = useState('All');
  const [contractorId, setContractorId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const creditCardAnim = useRef(new Animated.Value(0)).current;
  const statsCardsAnim = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const days = ['All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!loading) {
      // Start animations after data loads
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Stagger credit card animation
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(creditCardAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Stagger stats cards
      Animated.stagger(
        100,
        statsCardsAnim.map(anim =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          })
        )
      ).start();
    }
  }, [loading]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // Get contractor profile
      const profileData = await contractorApi.getProfileByUserId(user?.id || '');
      if (!profileData) {
        // Redirect to profile setup
        navigation.navigate('ContractorProfileEdit');
        return;
      }

      setProfile(profileData);
      setContractorId(profileData.id);

      // Get dashboard stats
      const dashboardData = await contractorApi.getDashboard(profileData.id);
      setStats(dashboardData);

      // Get credits balance using creditsApi
      try {
        const creditData = await creditsApi.getBalance(profileData.id, 'therapist');
        setCredits(creditData.balance || 0);
      } catch (e) {
        console.log('Error fetching credits:', e);
      }

      // Get upcoming appointments
      const appointments = await contractorApi.getUpcomingAppointments(profileData.id);
      setUpcomingAppointments(appointments);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2D2D2D" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D2D2D" />
      }
    >
      {/* Header */}
      <View style={[styles.header, { padding: spacing(2.5) }]}>
        <Text style={[styles.logo, { fontSize: normalizeFontSize(16) }]}>K-B</Text>
        <View style={styles.headerCenter}>
          <Text style={[styles.locationIcon, { fontSize: normalizeFontSize(14) }]}>📍</Text>
          <Text style={[styles.location, { fontSize: normalizeFontSize(14) }]}>
            {user?.city && user?.region ? `${user.city}, ${user.region}` : 'Cameroun'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
            style={[styles.languageButton, { marginRight: spacing(2) }]}
          >
            <Text style={[styles.languageText, { fontSize: normalizeFontSize(14) }]}>
              {language === 'fr' ? 'FR' : 'EN'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ContractorProfile')}>
            <View style={[styles.avatar, { width: spacing(6), height: spacing(6) }]}>
              <Text style={{ fontSize: normalizeFontSize(20) }}>👤</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Greeting */}
      <View style={[styles.greetingSection, { padding: spacing(2.5) }]}>
        <Text style={[styles.name, { fontSize: normalizeFontSize(24) }]}>
          {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.email || 'Utilisateur'}
        </Text>
        <Text style={[styles.greeting, { fontSize: normalizeFontSize(14) }]}>
          {language === 'fr' ? 'Bonjour!' : 'Good morning!'}
        </Text>
      </View>

      {/* Inactive Banner */}
      {profile && !profile.is_active && (
        <View style={[styles.warningBanner, { marginHorizontal: spacing(2.5), marginBottom: spacing(2) }]}>
          <Text style={[styles.warningTitle, { fontSize: normalizeFontSize(14) }]}>⚠️ Compte en attente de validation</Text>
          <Text style={[styles.warningText, { fontSize: normalizeFontSize(12) }]}>
            Votre profil est complet mais doit être validé par un administrateur avant d'être visible par les clients.
          </Text>
        </View>
      )}

      {/* Credits Card */}
      <Animated.View
        style={[
          styles.creditsCard,
          {
            marginHorizontal: spacing(2.5),
            padding: spacing(2.5),
            marginBottom: spacing(3),
            opacity: creditCardAnim,
            transform: [
              {
                scale: creditCardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                })
              }
            ]
          }
        ]}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={[styles.creditsLabel, { fontSize: normalizeFontSize(14) }]}>Vos Crédits</Text>
            <Text style={[styles.creditsValue, { fontSize: normalizeFontSize(28) }]}>{credits.toFixed(1)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.rechargeButton, { paddingHorizontal: spacing(2), paddingVertical: spacing(1) }]}
            onPress={() => navigation.navigate('PurchaseCredits')}
          >
            <Text style={[styles.rechargeText, { fontSize: normalizeFontSize(14) }]}>Recharger</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Quick Actions */}
      <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginBottom: spacing(3) }]}>
        <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18), marginBottom: spacing(2) }]}>
          Actions Rapides
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.actionCard, { padding: spacing(2), marginRight: spacing(1.5) }]}
            onPress={() => navigation.navigate('ContractorServices')}
          >
            <Text style={{ fontSize: normalizeFontSize(24), marginBottom: spacing(1) }}>💇‍♀️</Text>
            <Text style={[styles.actionLabel, { fontSize: normalizeFontSize(13) }]}>Services</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { padding: spacing(2), marginRight: spacing(1.5) }]}
            onPress={() => navigation.navigate('ContractorAvailability')}
          >
            <Text style={{ fontSize: normalizeFontSize(24), marginBottom: spacing(1) }}>📅</Text>
            <Text style={[styles.actionLabel, { fontSize: normalizeFontSize(13) }]}>Disponibilités</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { padding: spacing(2), marginRight: spacing(1.5) }]}
            onPress={() => navigation.navigate('ContractorProfileEdit')}
          >
            <Text style={{ fontSize: normalizeFontSize(24), marginBottom: spacing(1) }}>✏️</Text>
            <Text style={[styles.actionLabel, { fontSize: normalizeFontSize(13) }]}>Modifier Profil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { padding: spacing(2), marginRight: spacing(1.5) }]}
            onPress={() => navigation.navigate('ContractorEarnings')}
          >
            <Text style={{ fontSize: normalizeFontSize(24), marginBottom: spacing(1) }}>📊</Text>
            <Text style={[styles.actionLabel, { fontSize: normalizeFontSize(13) }]}>Revenus</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Reports */}
      <View style={[styles.section, { paddingHorizontal: spacing(2.5) }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18) }]}>
            {language === 'fr' ? 'Rapports' : 'Reports'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('ContractorEarnings')}>
            <Text style={[styles.seeAll, { fontSize: normalizeFontSize(14) }]}>
              {language === 'fr' ? 'Voir tout' : 'See all'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reportCards}>
          <Animated.View
            style={{
              flex: 1,
              opacity: statsCardsAnim[0],
              transform: [{
                translateY: statsCardsAnim[0].interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                })
              }]
            }}
          >
            <TouchableOpacity
              style={[styles.reportCard, { padding: spacing(2) }]}
              onPress={() => navigation.navigate('ContractorEarnings')}
            >
              <Text style={[styles.reportIcon, { fontSize: normalizeFontSize(20) }]}>💰</Text>
              <Text style={[styles.reportLabel, { fontSize: normalizeFontSize(13) }]}>
                {language === 'fr' ? 'Revenus' : 'Income'}
              </Text>
              <Text style={[styles.reportValue, { fontSize: normalizeFontSize(16) }]}>
                {formatCurrency(stats?.total_income || 0)}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={{
              flex: 1,
              opacity: statsCardsAnim[1],
              transform: [{
                translateY: statsCardsAnim[1].interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                })
              }]
            }}
          >
            <TouchableOpacity
              style={[styles.reportCard, { padding: spacing(2) }]}
              onPress={() => navigation.navigate('ContractorProposals')}
            >
              <Text style={[styles.reportIcon, { fontSize: normalizeFontSize(20) }]}>📋</Text>
              <Text style={[styles.reportLabel, { fontSize: normalizeFontSize(13) }]}>
                {language === 'fr' ? 'Commandes' : 'Orders'}
              </Text>
              <Text style={[styles.reportValue, { fontSize: normalizeFontSize(16) }]}>
                {stats?.total_proposals || 0}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={{
              flex: 1,
              opacity: statsCardsAnim[2],
              transform: [{
                translateY: statsCardsAnim[2].interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                })
              }]
            }}
          >
            <TouchableOpacity
              style={[styles.reportCard, { padding: spacing(2) }]}
              onPress={() => navigation.navigate('ContractorAppointments')}
            >
              <Text style={[styles.reportIcon, { fontSize: normalizeFontSize(20) }]}>✅</Text>
              <Text style={[styles.reportLabel, { fontSize: normalizeFontSize(13) }]}>
                {language === 'fr' ? 'Terminés' : 'Completed'}
              </Text>
              <Text style={[styles.reportValue, { fontSize: normalizeFontSize(16) }]}>
                {stats?.completed_bookings || 0}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Upcoming Appointments */}
      <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginTop: spacing(3) }]}>
        <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18) }]}>
          {language === 'fr' ? 'Rendez-vous à venir' : 'Upcoming Appointments'}
        </Text>

        {/* Day filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing(2) }}
        >
          {days.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                {
                  paddingHorizontal: spacing(2),
                  paddingVertical: spacing(1),
                  marginRight: spacing(1),
                },
                selectedDay === day && styles.dayButtonActive,
              ]}
              onPress={() => setSelectedDay(day)}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  { fontSize: normalizeFontSize(13) },
                  selectedDay === day && styles.dayButtonTextActive,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Appointments list */}
        <View style={{ marginTop: spacing(2) }}>
          {upcomingAppointments.length === 0 ? (
            <Text style={[styles.emptyText, { fontSize: normalizeFontSize(14) }]}>
              {language === 'fr'
                ? 'Aucun rendez-vous à venir'
                : 'No upcoming appointments'}
            </Text>
          ) : (
            upcomingAppointments.slice(0, 3).map((appointment) => (
              <TouchableOpacity
                key={appointment.id}
                style={[styles.appointmentCard, { padding: spacing(2), marginBottom: spacing(1.5) }]}
                onPress={() =>
                  navigation.navigate('AppointmentDetails', { bookingId: appointment.id })
                }
              >
                <View style={[styles.appointmentImage, { width: spacing(8), height: spacing(8) }]}>
                  {appointment.user?.profile_picture ? (
                    <Text style={{ fontSize: normalizeFontSize(40) }}>👤</Text>
                  ) : (
                    <Text style={{ fontSize: normalizeFontSize(40) }}>👤</Text>
                  )}
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={[styles.appointmentService, { fontSize: normalizeFontSize(16) }]}>
                    {appointment.service?.name || 'Haircut service'}
                  </Text>
                  <View style={styles.appointmentDetails}>
                    <Text style={[styles.appointmentTime, { fontSize: normalizeFontSize(13) }]}>
                      ⏰ {formatTime(appointment.scheduled_at)}
                    </Text>
                    <Text style={[styles.appointmentDate, { fontSize: normalizeFontSize(13) }]}>
                      📅 {formatDate(appointment.scheduled_at)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      {/* Total Earning */}
      <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginTop: spacing(3) }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18) }]}>
            {language === 'fr' ? 'Revenus Totaux' : 'Total Earning'}
          </Text>
          <TouchableOpacity>
            <Text style={[styles.period, { fontSize: normalizeFontSize(14) }]}>
              {language === 'fr' ? 'Mensuel ▼' : 'Monthly ▼'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Simple bar chart */}
        <View style={[styles.chart, { height: spacing(25), marginTop: spacing(2) }]}>
          {stats?.earnings_chart?.slice(-7).map((item, index) => {
            const maxAmount = Math.max(...(stats.earnings_chart?.map((i) => i.amount) || [1]));
            const height = (item.amount / maxAmount) * 100;

            return (
              <View
                key={index}
                style={[styles.chartBar, { width: `${100 / 7}%`, height: spacing(25) }]}
              >
                <View
                  style={[
                    styles.chartBarFill,
                    {
                      height: `${height}%`,
                      backgroundColor: index % 2 === 0 ? '#2D2D2D' : '#FF6B6B',
                    },
                  ]}
                />
                <Text style={[styles.chartLabel, { fontSize: normalizeFontSize(10) }]}>
                  {new Date(item.date).getDate()}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Completed Appointments Chart */}
      <View style={[styles.section, { paddingHorizontal: spacing(2.5), marginTop: spacing(3) }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18) }]}>
            {language === 'fr' ? 'Rendez-vous Terminés' : 'Completed Appointments'}
          </Text>
          <TouchableOpacity>
            <Text style={[styles.period, { fontSize: normalizeFontSize(14) }]}>
              {language === 'fr' ? 'Mensuel ▼' : 'Monthly ▼'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.statsCard, { padding: spacing(2), marginTop: spacing(2) }]}>
          <View style={styles.statsRow}>
            <Text style={[styles.statsLabel, { fontSize: normalizeFontSize(14) }]}>Total</Text>
            <Text style={[styles.statsValue, { fontSize: normalizeFontSize(32) }]}>
              +{stats?.completed_bookings || 0}
            </Text>
            <Text style={[styles.statsChange, { fontSize: normalizeFontSize(14) }]}>
              +12% ↑
            </Text>
          </View>
        </View>
      </View>

      {/* Total Clients */}
      <View
        style={[
          styles.section,
          { paddingHorizontal: spacing(2.5), marginTop: spacing(3), marginBottom: spacing(10) },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(18) }]}>
            {language === 'fr' ? 'Total Clients' : 'Total Clients'}
          </Text>
          <TouchableOpacity>
            <Text style={[styles.period, { fontSize: normalizeFontSize(14) }]}>
              {language === 'fr' ? 'Mensuel ▼' : 'Monthly ▼'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.statsCard, { padding: spacing(2), marginTop: spacing(2) }]}>
          <Text style={[styles.statsValue, { fontSize: normalizeFontSize(32) }]}>
            {stats?.total_clients || 0}
          </Text>
        </View>
      </View>
    </ScrollView>
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
    paddingTop: 50,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageButton: {
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  avatar: {
    borderRadius: 100,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingSection: {
    backgroundColor: '#FFF',
  },
  name: {
    fontWeight: 'bold',
  },
  greeting: {
    color: '#666',
    marginTop: 5,
  },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  seeAll: {
    color: '#FF6B6B',
  },
  period: {
    color: '#666',
  },
  reportCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  reportCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  reportIcon: {},
  reportLabel: {
    color: '#666',
    marginTop: 5,
  },
  reportValue: {
    fontWeight: 'bold',
    marginTop: 5,
  },
  dayButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  dayButtonActive: {
    backgroundColor: '#2D2D2D',
    borderColor: '#2D2D2D',
  },
  dayButtonText: {
    color: '#666',
  },
  dayButtonTextActive: {
    color: '#FFF',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    alignItems: 'center',
  },
  appointmentImage: {
    borderRadius: 8,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentInfo: {
    flex: 1,
    marginLeft: 15,
  },
  appointmentService: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  appointmentDetails: {
    flexDirection: 'row',
    marginTop: 5,
  },
  appointmentTime: {
    color: '#AAA',
    marginRight: 20,
  },
  appointmentDate: {
    color: '#AAA',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartBar: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '70%',
    borderRadius: 4,
    marginBottom: 5,
  },
  chartLabel: {
    color: '#999',
  },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsLabel: {
    color: '#666',
  },
  statsValue: {
    fontWeight: 'bold',
    marginLeft: 10,
  },
  statsChange: {
    color: '#4CAF50',
    marginLeft: 10,
  },
  warningBanner: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    padding: 15,
    borderRadius: 8,
  },
  warningTitle: {
    color: '#E65100',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  warningText: {
    color: '#E65100',
  },
  creditsCard: {
    backgroundColor: '#2D2D2D',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  creditsLabel: {
    color: '#AAA',
    marginBottom: 5,
  },
  creditsValue: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  rechargeButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
  },
  rechargeText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  actionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionLabel: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
});

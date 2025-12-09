import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';
import { contractorApi, Booking } from '../../services/api';
import { getFullName, getUserInitials } from '../../utils/userHelpers';

const DAYS = ['All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ContractorAppointmentsScreen = () => {
  const { normalizeFontSize, spacing } = useResponsive();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [selectedDay, setSelectedDay] = useState('All');
  const [appointments, setAppointments] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractorId, setContractorId] = useState<string | null>(null);

  useEffect(() => {
    loadContractorProfile();
  }, []);

  useEffect(() => {
    if (contractorId) {
      loadAppointments();
    }
  }, [contractorId, selectedDay]);

  const loadContractorProfile = async () => {
    try {
      if (!user?.id) return;
      const profile = await contractorApi.getProfileByUserId(user.id);
      setContractorId(profile.id);
    } catch (error: any) {
      console.error('Error loading contractor profile:', error);
      Alert.alert('Error', error.message || 'Failed to load profile');
    }
  };

  const loadAppointments = async () => {
    try {
      if (!contractorId) return;
      setLoading(true);
      const day = selectedDay === 'All' ? undefined : selectedDay.toLowerCase();
      const data = await contractorApi.getUpcomingAppointments(contractorId, day);
      setAppointments(data);
    } catch (error: any) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', error.message || 'Failed to load appointments');
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

  const handleAppointmentPress = (appointment: Booking) => {
    navigation.navigate('AppointmentDetails', { appointmentId: appointment.id });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { padding: spacing(2.5), paddingTop: spacing(6) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: normalizeFontSize(24) }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: normalizeFontSize(18) }]}>Appointments</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: normalizeFontSize(18) }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing(10) }}>
        {/* Upcoming Appointments Section */}
        <View style={{ padding: spacing(2) }}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(20), marginBottom: spacing(2) }]}>
            Upcoming Appointments
          </Text>

          {/* Day Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: spacing(2) }}
            contentContainerStyle={{ gap: spacing(1) }}
          >
            {DAYS.map((day) => (
              <TouchableOpacity
                key={day}
                onPress={() => setSelectedDay(day)}
                style={[
                  styles.dayButton,
                  {
                    paddingHorizontal: spacing(2),
                    paddingVertical: spacing(1),
                    borderRadius: spacing(2.5),
                  },
                  selectedDay === day && styles.dayButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    { fontSize: normalizeFontSize(14) },
                    selectedDay === day && styles.dayButtonTextActive,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Appointments List */}
          {loading ? (
            <View style={{ padding: spacing(4), alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#2D2D2D" />
            </View>
          ) : appointments.length === 0 ? (
            <View style={{ padding: spacing(4), alignItems: 'center' }}>
              <Text style={{ fontSize: normalizeFontSize(16), color: '#999' }}>
                No appointments found
              </Text>
            </View>
          ) : (
            <View style={{ gap: spacing(1.5) }}>
              {appointments.map((appointment, index) => {
                const animValue = useRef(new Animated.Value(0)).current;

                useEffect(() => {
                  Animated.spring(animValue, {
                    toValue: 1,
                    delay: index * 100,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                  }).start();
                }, []);

                return (
                  <Animated.View
                    key={appointment.id}
                    style={{
                      opacity: animValue,
                      transform: [{
                        translateY: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        })
                      }, {
                        scale: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        })
                      }]
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => handleAppointmentPress(appointment)}
                      style={[
                        styles.appointmentCard,
                        {
                          padding: spacing(1.5),
                          borderRadius: spacing(1.5),
                          gap: spacing(1.5),
                        },
                      ]}
                    >
                      <View style={styles.appointmentContent}>
                        {/* Client Image */}
                        <View
                          style={[
                            styles.clientImage,
                            {
                              width: spacing(6),
                              height: spacing(6),
                              borderRadius: spacing(1),
                            },
                          ]}
                        >
                          {appointment.client?.profile_picture ? (
                            <Image
                              source={{ uri: appointment.client.profile_picture }}
                              style={{ width: '100%', height: '100%', borderRadius: spacing(1) }}
                            />
                          ) : (
                            <View style={styles.placeholderImage}>
                              <Text style={{ fontSize: normalizeFontSize(20), color: '#FFF' }}>
                                {getUserInitials(appointment.client)}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Service Info */}
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.serviceName,
                              { fontSize: normalizeFontSize(16), marginBottom: spacing(0.5) },
                            ]}
                          >
                            {appointment.service?.name || 'Service'}
                          </Text>
                          <View style={styles.timeRow}>
                            <Text style={[styles.timeText, { fontSize: normalizeFontSize(13) }]}>
                              🕐 {formatTime(appointment.scheduled_at)}
                            </Text>
                            <Text style={[styles.dateText, { fontSize: normalizeFontSize(13) }]}>
                              📅 {formatDate(appointment.scheduled_at)}
                            </Text>
                          </View>
                        </View>

                        {/* Arrow Icon */}
                        <Text style={{ fontSize: normalizeFontSize(18), color: '#FFF' }}>→</Text>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
  },
  title: {
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#2D2D2D',
  },
  dayButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    fontWeight: '600',
  },
  appointmentCard: {
    backgroundColor: '#2D2D2D',
  },
  appointmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientImage: {
    backgroundColor: '#666',
    overflow: 'hidden',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceName: {
    color: '#FFF',
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    color: '#CCC',
  },
  dateText: {
    color: '#CCC',
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

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { formatCurrency, type CountryCode } from '../../utils/currency';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';

type BookingRouteProp = RouteProp<HomeStackParamList, 'Booking'>;
type BookingNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Booking'>;

export const BookingScreen: React.FC = () => {
  const route = useRoute<BookingRouteProp>();
  const navigation = useNavigation<BookingNavigationProp>();
  const { service, providerId, providerType, providerName, providerPrice } = route.params;

  const { normalizeFontSize, spacing } = useResponsive();
  const { language } = useI18n();
  const [countryCode] = useState<CountryCode>('CM');

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Générer les dates disponibles (7 prochains jours)
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  // Horaires disponibles
  const availableTimes = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00', '18:00',
  ];

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert(
        language === 'fr' ? 'Information manquante' : 'Missing information',
        language === 'fr'
          ? 'Veuillez sélectionner une date et une heure'
          : 'Please select a date and time'
      );
      return;
    }

    setLoading(true);

    try {
      // TODO: Implémenter l'appel API pour créer la réservation
      // const response = await bookingsApi.create({
      //   service_id: service.id,
      //   provider_id: providerId,
      //   provider_type: providerType,
      //   scheduled_date: selectedDate,
      //   scheduled_time: selectedTime,
      //   notes,
      // });

      // Simuler un délai
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        language === 'fr' ? 'Réservation confirmée' : 'Booking confirmed',
        language === 'fr'
          ? `Votre réservation pour ${service.name_fr || service.name_en} est confirmée pour le ${selectedDate.toLocaleDateString('fr-FR')} à ${selectedTime}.`
          : `Your booking for ${service.name_en || service.name_fr} is confirmed for ${selectedDate.toLocaleDateString('en-US')} at ${selectedTime}.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('BookingManagement'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        language === 'fr' ? 'Erreur' : 'Error',
        language === 'fr'
          ? 'Une erreur est survenue lors de la réservation'
          : 'An error occurred while booking'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const days = language === 'fr'
      ? ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const months = language === 'fr'
      ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
    };
  };

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
            {language === 'fr' ? 'Réserver' : 'Book'}
          </Text>
          <Text style={[styles.headerSubtitle, { fontSize: normalizeFontSize(12) }]}>
            {language === 'fr' ? service.name_fr : service.name_en}
          </Text>
        </View>

        <View style={{ width: spacing(5) }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingHorizontal: spacing(2.5), paddingBottom: spacing(10) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Info */}
        <View style={[styles.serviceCard, { borderRadius: spacing(2), marginBottom: spacing(3), overflow: 'hidden' }]}>
          {/* Service Image */}
          {service.images && service.images.length > 0 && service.images[0] ? (
            <View style={[styles.serviceImageContainer, { height: spacing(25) }]}>
              <Image
                source={{ uri: service.images[0] }}
                style={styles.serviceImage}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={[styles.serviceImagePlaceholder, { height: spacing(25) }]}>
              <Text style={[styles.serviceImagePlaceholderText, { fontSize: normalizeFontSize(14) }]}>
                {language === 'fr' ? 'Photo du service' : 'Service photo'}
              </Text>
            </View>
          )}

          <View style={[{ padding: spacing(2) }]}>
            <Text style={[styles.serviceLabel, { fontSize: normalizeFontSize(12), marginBottom: spacing(0.5) }]}>
              {language === 'fr' ? 'Service' : 'Service'}
            </Text>
            <Text style={[styles.serviceName, { fontSize: normalizeFontSize(18), marginBottom: spacing(1) }]}>
              {language === 'fr' ? service.name_fr : service.name_en}
            </Text>
            <View style={styles.serviceDetails}>
              <Text style={[styles.serviceDetail, { fontSize: normalizeFontSize(14) }]}>
                ⏰ {service.duration}min
              </Text>
              <Text style={[styles.serviceDivider, { fontSize: normalizeFontSize(14), marginHorizontal: spacing(1.5) }]}>
                •
              </Text>
              <Text style={[styles.serviceDetail, { fontSize: normalizeFontSize(14), fontWeight: '700', color: '#FF6B6B' }]}>
                {formatCurrency(providerPrice || service.base_price, countryCode)}
              </Text>
            </View>

            {providerName && (
              <View style={[styles.providerInfo, { marginTop: spacing(1.5), paddingTop: spacing(1.5), borderTopWidth: 1, borderTopColor: '#F0F0F0' }]}>
                <View style={styles.providerHeaderRow}>
                  <Text style={[styles.providerLabel, { fontSize: normalizeFontSize(12) }]}>
                    {language === 'fr' ? 'Prestataire' : 'Provider'}
                  </Text>
                  {providerType === 'salon' && (
                    <View style={[styles.providerTypeBadge, { paddingHorizontal: spacing(1), paddingVertical: spacing(0.3), borderRadius: spacing(1) }]}>
                      <Text style={[styles.providerTypeBadgeText, { fontSize: normalizeFontSize(10) }]}>Institut</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.providerName, { fontSize: normalizeFontSize(14) }]}>
                  {providerName}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Date Selection */}
        <View style={[styles.section, { marginBottom: spacing(3) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(2) }]}>
            {language === 'fr' ? 'Sélectionner une date' : 'Select a date'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {availableDates.map((date, index) => {
              const dateInfo = formatDate(date);
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateCard,
                    isSelected && styles.dateCardSelected,
                    { padding: spacing(2), borderRadius: spacing(2), marginRight: spacing(1.5), minWidth: spacing(10) },
                  ]}
                  onPress={() => handleDateSelect(date)}
                >
                  <Text style={[styles.dateDay, isSelected && styles.dateDaySelected, { fontSize: normalizeFontSize(12) }]}>
                    {dateInfo.day}
                  </Text>
                  <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected, { fontSize: normalizeFontSize(20), fontWeight: '700' }]}>
                    {dateInfo.date}
                  </Text>
                  <Text style={[styles.dateMonth, isSelected && styles.dateMonthSelected, { fontSize: normalizeFontSize(12) }]}>
                    {dateInfo.month}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time Selection */}
        {selectedDate && (
          <View style={[styles.section, { marginBottom: spacing(3) }]}>
            <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(2) }]}>
              {language === 'fr' ? 'Sélectionner une heure' : 'Select a time'}
            </Text>
            <View style={styles.timeGrid}>
              {availableTimes.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeCard,
                      isSelected && styles.timeCardSelected,
                      { padding: spacing(1.5), borderRadius: spacing(1.5), marginRight: spacing(1), marginBottom: spacing(1) },
                    ]}
                    onPress={() => handleTimeSelect(time)}
                  >
                    <Text style={[styles.timeText, isSelected && styles.timeTextSelected, { fontSize: normalizeFontSize(14) }]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Summary */}
        {selectedDate && selectedTime && (
          <View style={[styles.summary, { padding: spacing(2), borderRadius: spacing(2), marginBottom: spacing(3) }]}>
            <Text style={[styles.summaryTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1.5) }]}>
              {language === 'fr' ? 'Résumé de la réservation' : 'Booking summary'}
            </Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { fontSize: normalizeFontSize(14) }]}>
                {language === 'fr' ? 'Date' : 'Date'}:
              </Text>
              <Text style={[styles.summaryValue, { fontSize: normalizeFontSize(14) }]}>
                {selectedDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { fontSize: normalizeFontSize(14) }]}>
                {language === 'fr' ? 'Heure' : 'Time'}:
              </Text>
              <Text style={[styles.summaryValue, { fontSize: normalizeFontSize(14) }]}>
                {selectedTime}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { fontSize: normalizeFontSize(14) }]}>
                {language === 'fr' ? 'Durée' : 'Duration'}:
              </Text>
              <Text style={[styles.summaryValue, { fontSize: normalizeFontSize(14) }]}>
                {service.duration} min
              </Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: spacing(1.5), paddingTop: spacing(1.5), borderTopWidth: 1, borderTopColor: '#F0F0F0' }]}>
              <Text style={[styles.summaryLabel, { fontSize: normalizeFontSize(16), fontWeight: '700' }]}>
                {language === 'fr' ? 'Total' : 'Total'}:
              </Text>
              <Text style={[styles.summaryTotal, { fontSize: normalizeFontSize(18) }]}>
                {formatCurrency(service.base_price, countryCode)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Button */}
      {selectedDate && selectedTime && (
        <View style={[styles.bottomBar, { padding: spacing(2.5) }]}>
          <TouchableOpacity
            style={[styles.bookButton, { paddingVertical: spacing(2), borderRadius: spacing(2) }]}
            onPress={handleBooking}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.bookButtonText, { fontSize: normalizeFontSize(16) }]}>
                {language === 'fr' ? 'Confirmer la réservation' : 'Confirm booking'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  headerSubtitle: {
    color: '#999',
    marginTop: 2,
  },
  content: {
    flex: 1,
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
  serviceImagePlaceholder: {
    width: '100%',
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceImagePlaceholderText: {
    color: '#999',
  },
  serviceLabel: {
    color: '#999',
    textTransform: 'uppercase',
  },
  serviceName: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDetail: {
    color: '#666',
  },
  serviceDivider: {
    color: '#CCC',
  },
  providerInfo: {},
  providerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  providerLabel: {
    color: '#999',
  },
  providerTypeBadge: {
    backgroundColor: '#E3F2FD',
  },
  providerTypeBadgeText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  providerName: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  section: {},
  sectionTitle: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  dateScroll: {
    flexDirection: 'row',
  },
  dateCard: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  dateCardSelected: {
    backgroundColor: '#2D2D2D',
    borderColor: '#2D2D2D',
  },
  dateDay: {
    color: '#999',
    textTransform: 'uppercase',
  },
  dateDaySelected: {
    color: '#FFFFFF',
  },
  dateNumber: {
    color: '#2D2D2D',
    marginVertical: 4,
  },
  dateNumberSelected: {
    color: '#FFFFFF',
  },
  dateMonth: {
    color: '#999',
    textTransform: 'uppercase',
  },
  dateMonthSelected: {
    color: '#FFFFFF',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeCard: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 80,
    alignItems: 'center',
  },
  timeCardSelected: {
    backgroundColor: '#2D2D2D',
    borderColor: '#2D2D2D',
  },
  timeText: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  timeTextSelected: {
    color: '#FFFFFF',
  },
  summary: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  summaryTitle: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#666',
  },
  summaryValue: {
    fontWeight: '600',
    color: '#2D2D2D',
  },
  summaryTotal: {
    fontWeight: '700',
    color: '#FF6B6B',
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  bookButton: {
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

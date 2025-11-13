import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, type CountryCode } from '../../utils/currency';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { bookingsApi, therapistsApi, salonsApi } from '../../services/api';

type BookingRouteProp = RouteProp<HomeStackParamList, 'Booking'>;
type BookingNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Booking'>;

export const BookingScreen: React.FC = () => {
  const route = useRoute<BookingRouteProp>();
  const navigation = useNavigation<BookingNavigationProp>();
  const { service, providerId, providerType, providerName, providerPrice } = route.params;

  const { normalizeFontSize, spacing } = useResponsive();
  const { language } = useI18n();
  const { user } = useAuth();
  const [countryCode] = useState<CountryCode>('CM');

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [providerServices, setProviderServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([service.id]);

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

  // Charger les services du prestataire
  useEffect(() => {
    if (providerId && providerType) {
      loadProviderServices();
    }
  }, [providerId, providerType]);

  const loadProviderServices = async () => {
    try {
      setLoadingServices(true);
      let services: any[] = [];

      if (providerType === 'therapist') {
        services = await therapistsApi.getServices(providerId);
      } else {
        services = await salonsApi.getServices(providerId);
      }

      // Filtrer pour ne garder que les services actifs et différents du service principal
      const otherServices = services
        .filter(s => s.service?.id !== service.id && s.service?.id)
        .map(s => ({
          ...s.service,
          service_price: s.price,
          service_duration: s.duration,
        }));

      setProviderServices(otherServices);
    } catch (error) {
      console.error('Error loading provider services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        // Ne pas permettre de désélectionner le service principal
        if (serviceId === service.id) return prev;
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  // Calculer le prix total et la durée totale
  const calculateTotals = () => {
    let totalPrice = providerPrice || service.base_price;
    let totalDuration = service.duration || 0;

    selectedServices.forEach(serviceId => {
      if (serviceId !== service.id) {
        const additionalService = providerServices.find(s => s.id === serviceId);
        if (additionalService) {
          totalPrice += additionalService.service_price || additionalService.base_price || 0;
          totalDuration += additionalService.duration || 0;
        }
      }
    });

    return { totalPrice, totalDuration };
  };

  const { totalPrice, totalDuration } = calculateTotals();

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

    if (!address.trim()) {
      Alert.alert(
        language === 'fr' ? 'Adresse manquante' : 'Address missing',
        language === 'fr'
          ? 'Veuillez saisir votre adresse complète'
          : 'Please enter your complete address'
      );
      return;
    }

    if (!user?.id) {
      Alert.alert(
        language === 'fr' ? 'Erreur' : 'Error',
        language === 'fr'
          ? 'Vous devez être connecté pour réserver'
          : 'You must be logged in to book'
      );
      return;
    }

    if (!providerId || !providerType) {
      Alert.alert(
        language === 'fr' ? 'Erreur' : 'Error',
        language === 'fr'
          ? 'Prestataire non sélectionné'
          : 'Provider not selected'
      );
      return;
    }

    setLoading(true);

    try {
      // Combiner date et heure pour scheduled_at
      const [hours, minutes] = selectedTime.split(':');
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Préparer les items (services)
      const bookingItems = selectedServices.map(serviceId => {
        if (serviceId === service.id) {
          return {
            service_id: service.id,
            service_name: language === 'fr' ? service.name_fr : service.name_en,
            price: providerPrice || service.base_price,
            duration: service.duration || 0,
          };
        } else {
          const additionalService = providerServices.find(s => s.id === serviceId);
          if (additionalService) {
            return {
              service_id: additionalService.id,
              service_name: language === 'fr' ? additionalService.name_fr : additionalService.name_en,
              price: additionalService.service_price || additionalService.base_price,
              duration: additionalService.duration || 0,
            };
          }
          return null;
        }
      }).filter(Boolean) as any[];

      // Parser l'adresse pour extraire city et region (simple parsing)
      const addressParts = address.split(',').map(p => p.trim());
      const city = addressParts.length > 0 ? addressParts[addressParts.length - 1] : 'Douala';
      const region = 'Littoral'; // Valeur par défaut pour le Cameroun

      // Préparer les notes
      let notesContent = additionalNotes.trim() || '';

      // Créer la réservation via l'API
      const booking = await bookingsApi.create({
        user_id: user.id,
        therapist_id: providerType === 'therapist' ? providerId : undefined,
        salon_id: providerType === 'salon' ? providerId : undefined,
        scheduled_at: scheduledAt.toISOString(),
        duration: totalDuration,
        location_type: 'AT_HOME', // Par défaut, peut être modifié plus tard
        street: address,
        city: city,
        region: region,
        instructions: notesContent || undefined,
        subtotal: totalPrice,
        travel_fee: 0,
        tip: 0,
        total: totalPrice,
        notes: notesContent || undefined,
        items: bookingItems,
      });

      Alert.alert(
        language === 'fr' ? 'Réservation confirmée !' : 'Booking confirmed!',
        language === 'fr'
          ? `Votre réservation pour ${service.name_fr || service.name_en} est confirmée.`
          : `Your booking for ${service.name_en || service.name_fr} is confirmed.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('BookingDetails', { bookingId: booking.id }),
          },
        ]
      );
    } catch (error) {
      console.error('Booking error:', error);
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

        {/* Address Input */}
        <View style={[styles.section, { marginBottom: spacing(3) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(2) }]}>
            {language === 'fr' ? 'Adresse complète *' : 'Complete address *'}
          </Text>
          <TextInput
            style={[styles.addressInput, { padding: spacing(2), borderRadius: spacing(2), fontSize: normalizeFontSize(14), minHeight: spacing(12) }]}
            placeholder={language === 'fr' ? 'Entrez votre adresse complète (rue, quartier, ville)...' : 'Enter your complete address (street, district, city)...'}
            placeholderTextColor="#999"
            value={address}
            onChangeText={setAddress}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Additional Services */}
        {providerServices.length > 0 && (
          <View style={[styles.section, { marginBottom: spacing(3) }]}>
            <View style={[styles.sectionHeaderRow, { marginBottom: spacing(2) }]}>
              <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16) }]}>
                {language === 'fr' ? 'Services additionnels' : 'Additional services'}
              </Text>
              {selectedServices.length > 1 && (
                <Text style={[styles.selectedCount, { fontSize: normalizeFontSize(12) }]}>
                  {selectedServices.length - 1} {language === 'fr' ? 'sélectionné(s)' : 'selected'}
                </Text>
              )}
            </View>
            <Text style={[styles.sectionSubtitle, { fontSize: normalizeFontSize(12), marginBottom: spacing(2) }]}>
              {language === 'fr'
                ? 'Autres services proposés par ce prestataire'
                : 'Other services offered by this provider'}
            </Text>
            {loadingServices ? (
              <ActivityIndicator size="small" color="#2D2D2D" />
            ) : (
              <View style={styles.additionalServicesGrid}>
                {providerServices.map((svc) => {
                  const isSelected = selectedServices.includes(svc.id);
                  return (
                    <TouchableOpacity
                      key={svc.id}
                      style={[
                        styles.additionalServiceCard,
                        { padding: spacing(2), borderRadius: spacing(2), marginBottom: spacing(2) },
                        isSelected && styles.additionalServiceCardSelected,
                      ]}
                      onPress={() => toggleServiceSelection(svc.id)}
                    >
                      <View style={styles.additionalServiceHeader}>
                        <View style={styles.additionalServiceInfo}>
                          <Text style={[styles.additionalServiceName, { fontSize: normalizeFontSize(14) }]} numberOfLines={2}>
                            {language === 'fr' ? svc.name_fr : svc.name_en}
                          </Text>
                          <View style={styles.additionalServiceMeta}>
                            <Text style={[styles.additionalServiceDuration, { fontSize: normalizeFontSize(12) }]}>
                              ⏰ {svc.duration}min
                            </Text>
                            <Text style={[styles.additionalServicePrice, { fontSize: normalizeFontSize(14) }]}>
                              {formatCurrency(svc.service_price || svc.base_price, countryCode)}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.checkboxContainer, { width: spacing(3), height: spacing(3), borderRadius: spacing(1.5) }, isSelected && styles.checkboxSelected]}>
                          {isSelected && <Text style={[styles.checkmark, { fontSize: normalizeFontSize(14) }]}>✓</Text>}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Additional Notes */}
        <View style={[styles.section, { marginBottom: spacing(3) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(2) }]}>
            {language === 'fr' ? 'Notes additionnelles (optionnel)' : 'Additional notes (optional)'}
          </Text>
          <TextInput
            style={[styles.notesInput, { padding: spacing(2), borderRadius: spacing(2), fontSize: normalizeFontSize(14), minHeight: spacing(12) }]}
            placeholder={language === 'fr' ? 'Ajoutez des informations supplémentaires (préférences, demandes spéciales, etc.)...' : 'Add additional information (preferences, special requests, etc.)...'}
            placeholderTextColor="#999"
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            multiline
            textAlignVertical="top"
          />
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
                {language === 'fr' ? 'Durée totale' : 'Total duration'}:
              </Text>
              <Text style={[styles.summaryValue, { fontSize: normalizeFontSize(14) }]}>
                {totalDuration} min
              </Text>
            </View>
            {selectedServices.length > 1 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontSize: normalizeFontSize(12), color: '#999' }]}>
                  {language === 'fr' ? 'Services inclus' : 'Included services'}:
                </Text>
                <Text style={[styles.summaryValue, { fontSize: normalizeFontSize(12), color: '#999' }]}>
                  {selectedServices.length}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, { marginTop: spacing(1.5), paddingTop: spacing(1.5), borderTopWidth: 1, borderTopColor: '#F0F0F0' }]}>
              <Text style={[styles.summaryLabel, { fontSize: normalizeFontSize(16), fontWeight: '700' }]}>
                {language === 'fr' ? 'Prix total' : 'Total price'}:
              </Text>
              <Text style={[styles.summaryTotal, { fontSize: normalizeFontSize(18) }]}>
                {formatCurrency(totalPrice, countryCode)}
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCount: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  sectionSubtitle: {
    color: '#666',
    lineHeight: 18,
  },
  addressInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#2D2D2D',
  },
  notesInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#2D2D2D',
  },
  additionalServicesGrid: {
    width: '100%',
  },
  additionalServiceCard: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  additionalServiceCardSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  additionalServiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  additionalServiceInfo: {
    flex: 1,
    marginRight: 12,
  },
  additionalServiceName: {
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 6,
  },
  additionalServiceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  additionalServiceDuration: {
    color: '#666',
  },
  additionalServicePrice: {
    fontWeight: '700',
    color: '#FF6B6B',
  },
  checkboxContainer: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: '700',
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

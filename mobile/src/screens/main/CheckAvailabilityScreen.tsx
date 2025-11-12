/**
 * CheckAvailabilityScreen
 * Étape 1 du processus de réservation : Sélection thérapeute, date/heure et location
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { shadows } from '../../design-system/shadows';
import { typography } from '../../design-system/typography';

interface CheckAvailabilityScreenProps {
  navigation: any;
  route: any;
}

interface Therapist {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  isLicensed: boolean;
  experience: number;
  salon: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const CheckAvailabilityScreen: React.FC<CheckAvailabilityScreenProps> = ({
  navigation,
  route,
}) => {
  const { service } = route.params || {};

  // États
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');

  // Mock data - Thérapeutes disponibles
  const therapists: Therapist[] = [
    {
      id: '1',
      name: 'Clarie Sinthly',
      avatar: 'https://i.pravatar.cc/150?img=1',
      rating: 5.0,
      reviewCount: 36,
      isLicensed: true,
      experience: 10,
      salon: 'Luxembourg Gardens Salon',
    },
    {
      id: '2',
      name: 'Marie Dubois',
      avatar: 'https://i.pravatar.cc/150?img=5',
      rating: 4.8,
      reviewCount: 52,
      isLicensed: true,
      experience: 8,
      salon: 'Beau Monde Esthétique',
    },
  ];

  // Mock data - Créneaux horaires
  const morningSlots: TimeSlot[] = [
    { time: '7:00', available: true },
    { time: '7:30', available: true },
    { time: '8:30', available: true },
    { time: '9:00', available: true },
    { time: '9:30', available: true },
    { time: '10:00', available: true },
    { time: '10:30', available: false },
    { time: '11:00', available: true },
    { time: '11:30', available: true },
  ];

  const afternoonSlots: TimeSlot[] = [
    { time: '12:00', available: true },
    { time: '12:30', available: false },
    { time: '13:00', available: true },
    { time: '14:00', available: true },
    { time: '15:00', available: true },
    { time: '16:00', available: true },
  ];

  const eveningSlots: TimeSlot[] = [
    { time: '17:00', available: true },
    { time: '18:00', available: true },
    { time: '19:00', available: false },
    { time: '20:00', available: true },
  ];

  const getSlotsByPeriod = () => {
    switch (selectedPeriod) {
      case 'Morning':
        return morningSlots;
      case 'Afternoon':
        return afternoonSlots;
      case 'Evening':
        return eveningSlots;
      default:
        return morningSlots;
    }
  };

  // Générer les jours de la semaine
  const generateWeekDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        day: days[date.getDay()],
        date: date.getDate(),
        fullDate: date,
      });
    }

    return dates;
  };

  const weekDays = generateWeekDays();

  const handleContinue = () => {
    if (!selectedTherapist || !selectedTimeSlot) {
      alert('Veuillez sélectionner un thérapeute et un créneau horaire');
      return;
    }

    // Navigate to next step (Review Service)
    navigation.navigate('CheckoutReviewService', {
      service,
      therapist: selectedTherapist,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.black} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Check Availability</Text>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="close" size={24} color={colors.black} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Info Card */}
        {service && (
          <View style={styles.serviceCard}>
            <Image source={{ uri: service.image }} style={styles.serviceImage} />
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <View style={styles.serviceDetails}>
                <Text style={styles.servicePrice}>${service.price}</Text>
                <View style={styles.serviceMeta}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.serviceMetaText}>{service.duration}h</Text>
                  <Ionicons name="star" size={14} color={colors.gold} />
                  <Text style={styles.serviceMetaText}>({service.reviews}+)</Text>
                </View>
              </View>
              <View style={styles.serviceSalon}>
                <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.serviceSalonText}>{service.salon}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Select Therapist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Therapist</Text>

          <View style={styles.therapistSelector}>
            <TouchableOpacity
              style={styles.therapistDropdown}
              onPress={() => {
                // Open therapist selector modal
              }}
            >
              <View style={styles.therapistDropdownContent}>
                {selectedTherapist ? (
                  <>
                    <Text style={styles.therapistName}>{selectedTherapist.name}</Text>
                    <View style={styles.therapistRating}>
                      <Ionicons name="star" size={12} color={colors.gold} />
                      <Text style={styles.therapistRatingText}>
                        ({selectedTherapist.reviewCount})
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.therapistPlaceholder}>Select a therapist</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {selectedTherapist && (
              <View style={styles.therapistDetails}>
                <Image
                  source={{ uri: selectedTherapist.avatar }}
                  style={styles.therapistAvatar}
                />
                <View style={styles.therapistInfo}>
                  <View style={styles.therapistBadges}>
                    <Ionicons name="business-outline" size={12} color={colors.textSecondary} />
                    <Text style={styles.therapistBadgeText}>{selectedTherapist.salon}</Text>
                  </View>
                  <View style={styles.therapistBadges}>
                    {selectedTherapist.isLicensed && (
                      <>
                        <Ionicons name="shield-checkmark" size={12} color={colors.success} />
                        <Text style={styles.therapistBadgeText}>Licensed</Text>
                      </>
                    )}
                    <Ionicons name="briefcase-outline" size={12} color={colors.textSecondary} />
                    <Text style={styles.therapistBadgeText}>
                      {selectedTherapist.experience} Years Experience
                    </Text>
                  </View>
                  <TouchableOpacity>
                    <Text style={styles.viewProfileLink}>View Profile</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Time & Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time & Date</Text>

          {/* Calendar Week View */}
          <View style={styles.calendar}>
            <TouchableOpacity style={styles.calendarNav}>
              <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.calendarDays}>
              <Text style={styles.calendarMonth}>23 August, 2024</Text>
              <View style={styles.weekDays}>
                {weekDays.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayButton,
                      selectedDate.getDate() === day.date && styles.dayButtonSelected,
                    ]}
                    onPress={() => setSelectedDate(day.fullDate)}
                  >
                    <Text
                      style={[
                        styles.dayName,
                        selectedDate.getDate() === day.date && styles.dayNameSelected,
                      ]}
                    >
                      {day.day}
                    </Text>
                    <Text
                      style={[
                        styles.dayNumber,
                        selectedDate.getDate() === day.date && styles.dayNumberSelected,
                      ]}
                    >
                      {day.date}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.calendarNav}>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Available Slots */}
          <View style={styles.availableSlots}>
            <Text style={styles.availableSlotsTitle}>Available Slots</Text>

            {/* Period Tabs */}
            <View style={styles.periodTabs}>
              {(['Morning', 'Afternoon', 'Evening'] as const).map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodTab,
                    selectedPeriod === period && styles.periodTabActive,
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Text
                    style={[
                      styles.periodTabText,
                      selectedPeriod === period && styles.periodTabTextActive,
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Time Slots */}
            <View style={styles.timeSlots}>
              {getSlotsByPeriod().map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeSlot,
                    !slot.available && styles.timeSlotDisabled,
                    selectedTimeSlot === slot.time && styles.timeSlotSelected,
                  ]}
                  onPress={() => slot.available && setSelectedTimeSlot(slot.time)}
                  disabled={!slot.available}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      !slot.available && styles.timeSlotTextDisabled,
                      selectedTimeSlot === slot.time && styles.timeSlotTextSelected,
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.locationHeader}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity>
              <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.locationCard}>
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.locationText}>
              6 Parvis Notre-Dame - 764 Paris, France (1km away)
            </Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.secondaryButton}>
          <Ionicons name="business-outline" size={20} color={colors.black} />
          <Text style={styles.secondaryButtonText}>View Shop</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
          <View style={styles.primaryButtonIcon}>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </View>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing['2xl'],
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: radius.sm,
  },
  serviceInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  serviceName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  servicePrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.coral,
    marginRight: spacing.md,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceMetaText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  serviceSalon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceSalonText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing['3xl'],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
    marginBottom: spacing.lg,
  },
  therapistSelector: {
    gap: spacing.md,
  },
  therapistDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray50,
    borderRadius: radius.sm,
    padding: spacing.lg,
  },
  therapistDropdownContent: {
    flex: 1,
  },
  therapistName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.black,
  },
  therapistRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  therapistRatingText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  therapistPlaceholder: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  therapistDetails: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  therapistAvatar: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
  },
  therapistInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  therapistBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  therapistBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  viewProfileLink: {
    fontSize: typography.fontSize.sm,
    color: colors.coral,
    fontWeight: typography.fontWeight.medium,
    marginTop: 4,
  },
  calendar: {
    marginBottom: spacing.lg,
  },
  calendarNav: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDays: {
    flex: 1,
  },
  calendarMonth: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 40,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  dayButtonSelected: {
    backgroundColor: colors.charcoal,
  },
  dayName: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dayNameSelected: {
    color: colors.white,
  },
  dayNumber: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.black,
  },
  dayNumberSelected: {
    color: colors.white,
  },
  availableSlots: {
    gap: spacing.md,
  },
  availableSlotsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
  },
  periodTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  periodTab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.gray50,
  },
  periodTabActive: {
    backgroundColor: colors.charcoal,
  },
  periodTabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  periodTabTextActive: {
    color: colors.white,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeSlot: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  timeSlotSelected: {
    borderColor: colors.black,
    borderWidth: 2,
  },
  timeSlotDisabled: {
    backgroundColor: colors.gray50,
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: typography.fontSize.sm,
    color: colors.black,
  },
  timeSlotTextSelected: {
    fontWeight: typography.fontWeight.semibold,
  },
  timeSlotTextDisabled: {
    color: colors.textSecondary,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: radius.sm,
    padding: spacing.lg,
    gap: spacing.md,
  },
  locationText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.charcoal,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  primaryButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default CheckAvailabilityScreen;

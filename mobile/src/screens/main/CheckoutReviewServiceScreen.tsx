/**
 * CheckoutReviewServiceScreen
 * Étape 2 du processus de réservation : Review Service + Additional Services
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { shadows } from '../../design-system/shadows';
import { typography } from '../../design-system/typography';

interface CheckoutReviewServiceScreenProps {
  navigation: any;
  route: any;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  salon: string;
  rating: number;
  reviews: string;
  image: string;
}

const CheckoutReviewServiceScreen: React.FC<CheckoutReviewServiceScreenProps> = ({
  navigation,
  route,
}) => {
  const { service, therapist, date, timeSlot } = route.params || {};

  // Services additionnels disponibles
  const additionalServices: Service[] = [
    {
      id: '1',
      name: 'Hot Stone Wellness M...',
      price: 2550,
      duration: 2,
      salon: 'Luxembourg Gardens Salon',
      rating: 3.9,
      reviews: '3.9k+',
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    },
    {
      id: '2',
      name: 'Bold Brow & Eye Bar',
      price: 780,
      duration: 1,
      salon: 'Montmartre & Sacré-Cœur',
      rating: 1.7,
      reviews: '1.7k+',
      image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400',
    },
    {
      id: '3',
      name: 'Hair Botox Straight...',
      price: 780,
      duration: 2,
      salon: 'Rue Saint, Paris',
      rating: 4.8,
      reviews: '4.8k+',
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    },
  ];

  const [selectedAdditionalServices, setSelectedAdditionalServices] = useState<string[]>([]);

  // Calculer le sous-total
  const calculateSubtotal = () => {
    let total = service?.price || 1245;

    selectedAdditionalServices.forEach((serviceId) => {
      const additionalService = additionalServices.find((s) => s.id === serviceId);
      if (additionalService) {
        total += additionalService.price;
      }
    });

    return total;
  };

  const toggleAdditionalService = (serviceId: string) => {
    if (selectedAdditionalServices.includes(serviceId)) {
      setSelectedAdditionalServices(selectedAdditionalServices.filter((id) => id !== serviceId));
    } else {
      setSelectedAdditionalServices([...selectedAdditionalServices, serviceId]);
    }
  };

  const handleContinue = () => {
    navigation.navigate('CheckoutPayment', {
      service,
      therapist,
      date,
      timeSlot,
      additionalServices: additionalServices.filter((s) =>
        selectedAdditionalServices.includes(s.id)
      ),
      subtotal: calculateSubtotal(),
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

        <Text style={styles.headerTitle}>Checkout</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          style={styles.headerButton}
        >
          <Ionicons name="close" size={24} color={colors.black} />
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, styles.progressDotCompleted]}>
            <Ionicons name="checkmark" size={16} color={colors.white} />
          </View>
          <Text style={styles.progressLabel}>Service</Text>
        </View>

        <View style={styles.progressLine} />

        <View style={styles.progressStep}>
          <View style={styles.progressDot} />
          <Text style={styles.progressLabel}>Payment</Text>
        </View>

        <View style={styles.progressLine} />

        <View style={styles.progressStep}>
          <View style={styles.progressDot} />
          <Text style={styles.progressLabel}>Checkout</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Review Service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Review Service</Text>

          <View style={styles.mainServiceCard}>
            <Image source={{ uri: service?.image }} style={styles.mainServiceImage} />
            <View style={styles.mainServiceInfo}>
              <Text style={styles.mainServicePrice}>${service?.price || 1245}.00</Text>
              <Text style={styles.mainServiceName}>
                {service?.name || 'Deep Tissue French Massage'}
              </Text>
            </View>
          </View>
        </View>

        {/* Additional Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Services</Text>

          {additionalServices.map((additionalService) => {
            const isSelected = selectedAdditionalServices.includes(additionalService.id);

            return (
              <TouchableOpacity
                key={additionalService.id}
                style={styles.additionalServiceCard}
                onPress={() => toggleAdditionalService(additionalService.id)}
              >
                <View
                  style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected,
                  ]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  )}
                </View>

                <Image
                  source={{ uri: additionalService.image }}
                  style={styles.additionalServiceImage}
                />

                <View style={styles.additionalServiceInfo}>
                  <View style={styles.additionalServiceHeader}>
                    <Text style={styles.additionalServiceName}>
                      {additionalService.name}
                    </Text>
                    <Text style={styles.additionalServicePrice}>
                      ${additionalService.price}
                    </Text>
                  </View>

                  <View style={styles.additionalServiceMeta}>
                    <Text style={styles.additionalServiceSalon}>
                      {additionalService.salon}
                    </Text>
                    <View style={styles.additionalServiceRating}>
                      <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                      <Text style={styles.additionalServiceMetaText}>
                        {additionalService.duration}h
                      </Text>
                    </View>
                  </View>

                  <View style={styles.additionalServiceRating}>
                    <Ionicons name="star" size={12} color={colors.gold} />
                    <Text style={styles.additionalServiceMetaText}>
                      ({additionalService.reviews})
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Subtotal */}
        <View style={styles.subtotalSection}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalAmount}>${calculateSubtotal()}.00</Text>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomActions}>
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  progressStep: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotCompleted: {
    backgroundColor: colors.charcoal,
  },
  progressLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.gray200,
    marginHorizontal: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
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
  mainServiceCard: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  mainServiceImage: {
    width: 80,
    height: 80,
    borderRadius: radius.sm,
  },
  mainServiceInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  mainServicePrice: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.coral,
    marginBottom: spacing.xs,
  },
  mainServiceName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.black,
  },
  additionalServiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.coral,
    borderColor: colors.coral,
  },
  additionalServiceImage: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
  },
  additionalServiceInfo: {
    flex: 1,
  },
  additionalServiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  additionalServiceName: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.black,
    marginRight: spacing.sm,
  },
  additionalServicePrice: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.coral,
  },
  additionalServiceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  additionalServiceSalon: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  additionalServiceRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  additionalServiceMetaText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  subtotalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  subtotalLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.black,
  },
  subtotalAmount: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.black,
  },
  bottomActions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  primaryButton: {
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

export default CheckoutReviewServiceScreen;

/**
 * CheckoutFinalReviewScreen
 * Étape 4 du processus de réservation : Final Review avant paiement
 */

import React from 'react';
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

interface CheckoutFinalReviewScreenProps {
  navigation: any;
  route: any;
}

const CheckoutFinalReviewScreen: React.FC<CheckoutFinalReviewScreenProps> = ({
  navigation,
  route,
}) => {
  const {
    service,
    therapist,
    date,
    timeSlot,
    additionalServices,
    subtotal,
    paymentMethod,
    paymentDetails,
  } = route.params || {};

  const allServices = [service, ...(additionalServices || [])];

  const handleConfirmPayment = async () => {
    // Simulate payment processing
    // TODO: Integrate with Flutterwave SDK

    // Navigate to order complete screen
    navigation.navigate('OrderComplete', {
      bookingId: 'BOOK-' + Date.now(),
      service,
      therapist,
      date,
      timeSlot,
      additionalServices,
      total: subtotal,
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
          <View style={[styles.progressDot, styles.progressDotCompleted]}>
            <Ionicons name="checkmark" size={16} color={colors.white} />
          </View>
          <Text style={styles.progressLabel}>Payment</Text>
        </View>

        <View style={styles.progressLine} />

        <View style={styles.progressStep}>
          <View style={[styles.progressDot, styles.progressDotCompleted]}>
            <Ionicons name="checkmark" size={16} color={colors.white} />
          </View>
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Review Service</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {allServices.map((svc, index) => (
            <View key={index} style={styles.serviceCard}>
              <Image source={{ uri: svc?.image }} style={styles.serviceImage} />
              <View style={styles.serviceInfo}>
                <View style={styles.servicePriceRow}>
                  <Text style={styles.servicePrice}>${svc?.price || 1245}</Text>
                  <View style={styles.serviceDuration}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.serviceDurationText}>{svc?.duration || 2}h</Text>
                  </View>
                </View>
                <Text style={styles.serviceName}>{svc?.name || 'Service'}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails de la réservation</Text>

          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Thérapeute</Text>
                <Text style={styles.detailValue}>{therapist?.name || 'Clarie Sinthly'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {date ? new Date(date).toLocaleDateString('fr-FR') : '23 août 2024'}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Heure</Text>
                <Text style={styles.detailValue}>{timeSlot || '8:30'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Moyen de paiement</Text>
                <Text style={styles.detailValue}>
                  {paymentMethod === 'ORANGE_MONEY'
                    ? 'Orange Money'
                    : paymentMethod === 'MTN_MOBILE_MONEY'
                    ? 'MTN Mobile Money'
                    : 'Carte bancaire'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Subtotal */}
        <View style={styles.subtotalSection}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalAmount}>{subtotal || 3795} XAF</Text>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleConfirmPayment}>
          <View style={styles.primaryButtonIcon}>
            <Ionicons name="checkmark" size={20} color={colors.white} />
          </View>
          <Text style={styles.primaryButtonText}>Confirmer le paiement</Text>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  serviceImage: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
  },
  serviceInfo: {
    flex: 1,
  },
  servicePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  servicePrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.coral,
  },
  serviceDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDurationText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  serviceName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.black,
  },
  detailsCard: {
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.black,
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

export default CheckoutFinalReviewScreen;

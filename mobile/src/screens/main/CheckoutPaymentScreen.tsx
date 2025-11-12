/**
 * CheckoutPaymentScreen
 * Étape 3 du processus de réservation : Payment avec Flutterwave (Orange Money, MTN Mobile Money, Card)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { shadows } from '../../design-system/shadows';
import { typography } from '../../design-system/typography';

interface CheckoutPaymentScreenProps {
  navigation: any;
  route: any;
}

type PaymentMethod = 'ORANGE_MONEY' | 'MTN_MOBILE_MONEY' | 'CARD';

const CheckoutPaymentScreen: React.FC<CheckoutPaymentScreenProps> = ({
  navigation,
  route,
}) => {
  const { service, therapist, date, timeSlot, additionalServices, subtotal } = route.params || {};

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('ORANGE_MONEY');

  // Card form states
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expirationMonth, setExpirationMonth] = useState('');
  const [expirationYear, setExpirationYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Mobile Money states
  const [mobileNumber, setMobileNumber] = useState('');

  const handleContinue = () => {
    if (selectedPaymentMethod === 'CARD') {
      // Validate card form
      if (!cardholderName || !cardNumber || !expirationMonth || !expirationYear || !cvv) {
        alert('Veuillez remplir tous les champs de la carte');
        return;
      }
    } else {
      // Validate mobile number
      if (!mobileNumber) {
        alert('Veuillez entrer votre numéro de téléphone');
        return;
      }
    }

    // Navigate to final review
    navigation.navigate('CheckoutFinalReview', {
      service,
      therapist,
      date,
      timeSlot,
      additionalServices,
      subtotal,
      paymentMethod: selectedPaymentMethod,
      paymentDetails:
        selectedPaymentMethod === 'CARD'
          ? {
              cardholderName,
              cardNumber: `**** **** **** ${cardNumber.slice(-4)}`,
            }
          : {
              mobileNumber,
            },
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
          <View style={styles.progressDot} />
          <Text style={styles.progressLabel}>Checkout</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Choose Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choisir un moyen de paiement</Text>

          {/* Orange Money */}
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              selectedPaymentMethod === 'ORANGE_MONEY' && styles.paymentMethodCardSelected,
            ]}
            onPress={() => setSelectedPaymentMethod('ORANGE_MONEY')}
          >
            <View style={styles.radioButton}>
              {selectedPaymentMethod === 'ORANGE_MONEY' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <Text style={styles.paymentMethodText}>Orange Money</Text>
            <View style={styles.paymentMethodLogos}>
              <View style={[styles.paymentLogo, { backgroundColor: '#FF6600' }]}>
                <Text style={styles.paymentLogoText}>OM</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* MTN Mobile Money */}
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              selectedPaymentMethod === 'MTN_MOBILE_MONEY' && styles.paymentMethodCardSelected,
            ]}
            onPress={() => setSelectedPaymentMethod('MTN_MOBILE_MONEY')}
          >
            <View style={styles.radioButton}>
              {selectedPaymentMethod === 'MTN_MOBILE_MONEY' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <Text style={styles.paymentMethodText}>MTN Mobile Money</Text>
            <View style={styles.paymentMethodLogos}>
              <View style={[styles.paymentLogo, { backgroundColor: '#FFCC00' }]}>
                <Text style={[styles.paymentLogoText, { color: colors.black }]}>MTN</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Card */}
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              selectedPaymentMethod === 'CARD' && styles.paymentMethodCardSelected,
            ]}
            onPress={() => setSelectedPaymentMethod('CARD')}
          >
            <View style={styles.radioButton}>
              {selectedPaymentMethod === 'CARD' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
            <Text style={styles.paymentMethodText}>Carte bancaire</Text>
            <View style={styles.paymentMethodLogos}>
              <View style={[styles.paymentLogo, { backgroundColor: '#EB001B' }]}>
                <Text style={styles.paymentLogoText}>MC</Text>
              </View>
              <View style={[styles.paymentLogo, { backgroundColor: '#1A1F71' }]}>
                <Text style={styles.paymentLogoText}>VISA</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Mobile Money Form */}
        {(selectedPaymentMethod === 'ORANGE_MONEY' ||
          selectedPaymentMethod === 'MTN_MOBILE_MONEY') && (
          <View style={styles.section}>
            <Text style={styles.label}>Numéro de téléphone</Text>
            <TextInput
              style={styles.input}
              placeholder="+237 6XX XXX XXX"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.helperText}>
              Vous recevrez une notification pour confirmer le paiement sur votre téléphone
            </Text>
          </View>
        )}

        {/* Card Form */}
        {selectedPaymentMethod === 'CARD' && (
          <View style={styles.section}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nom du titulaire</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={cardholderName}
                onChangeText={setCardholderName}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Numéro de carte</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChangeText={setCardNumber}
                keyboardType="number-pad"
                maxLength={16}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Expiration</Text>
                <View style={styles.expirationRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="MM"
                    value={expirationMonth}
                    onChangeText={setExpirationMonth}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={styles.expirationSeparator}>/</Text>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="YY"
                    value={expirationYear}
                    onChangeText={setExpirationYear}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="number-pad"
                  maxLength={3}
                  secureTextEntry
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Code postal</Text>
              <TextInput
                style={styles.input}
                placeholder="12345"
                value={postalCode}
                onChangeText={setPostalCode}
                keyboardType="number-pad"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        )}

        {/* Payment Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total</Text>
            <Text style={styles.summaryValue}>{subtotal || 1965} XAF</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frais de service</Text>
            <Text style={styles.summaryValue}>0 XAF</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>{subtotal || 1965} XAF</Text>
          </View>
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
          <Text style={styles.primaryButtonText}>Continuer</Text>
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
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  paymentMethodCardSelected: {
    borderColor: colors.coral,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.coral,
  },
  paymentMethodText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.black,
  },
  paymentMethodLogos: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paymentLogo: {
    width: 40,
    height: 24,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentLogoText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.black,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray50,
    borderRadius: radius.sm,
    padding: spacing.lg,
    fontSize: typography.fontSize.base,
    color: colors.black,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  expirationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  expirationSeparator: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.black,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  summaryTotalLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
  },
  summaryTotalValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.coral,
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

export default CheckoutPaymentScreen;

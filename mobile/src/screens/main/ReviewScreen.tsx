/**
 * ReviewScreen
 * Écran pour laisser un avis sur un service, salon ou thérapeute
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { shadows } from '../../design-system/shadows';
import { typography } from '../../design-system/typography';

interface ReviewScreenProps {
  navigation: any;
  route: any;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({ navigation, route }) => {
  const { booking } = route.params || {};

  const [overallRating, setOverallRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    if (overallRating === 0) {
      alert('Veuillez donner une note globale');
      return;
    }

    // TODO: Submit review to API
    console.log({
      bookingId: booking?.id,
      overallRating,
      cleanlinessRating,
      professionalismRating,
      valueRating,
      comment,
    });

    navigation.goBack();
  };

  const StarRating = ({
    rating,
    onRate,
    size = 32,
  }: {
    rating: number;
    onRate: (rating: number) => void;
    size?: number;
  }) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => onRate(star)}>
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={size}
              color={star <= rating ? colors.gold : colors.gray300}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
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

        <Text style={styles.headerTitle}>Laisser un avis</Text>

        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service/Booking Info */}
        {booking && (
          <View style={styles.bookingCard}>
            <Image
              source={{ uri: booking.service?.image }}
              style={styles.bookingImage}
            />
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingServiceName}>
                {booking.service?.name}
              </Text>
              <Text style={styles.bookingSalonName}>
                {booking.salon?.name || booking.therapist?.name}
              </Text>
              <Text style={styles.bookingDate}>
                {new Date(booking.scheduledAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
        )}

        {/* Overall Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Note globale *</Text>
          <View style={styles.overallRatingContainer}>
            <StarRating rating={overallRating} onRate={setOverallRating} size={40} />
            <Text style={styles.ratingValue}>
              {overallRating > 0 ? `${overallRating}.0` : 'Non noté'}
            </Text>
          </View>
        </View>

        {/* Detailed Ratings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes détaillées (optionnel)</Text>

          <View style={styles.detailedRating}>
            <View style={styles.ratingRow}>
              <View style={styles.ratingLabelContainer}>
                <Ionicons name="sparkles" size={20} color={colors.textSecondary} />
                <Text style={styles.ratingLabel}>Propreté</Text>
              </View>
              <StarRating
                rating={cleanlinessRating}
                onRate={setCleanlinessRating}
                size={24}
              />
            </View>

            <View style={styles.ratingRow}>
              <View style={styles.ratingLabelContainer}>
                <Ionicons name="briefcase" size={20} color={colors.textSecondary} />
                <Text style={styles.ratingLabel}>Professionnalisme</Text>
              </View>
              <StarRating
                rating={professionalismRating}
                onRate={setProfessionalismRating}
                size={24}
              />
            </View>

            <View style={styles.ratingRow}>
              <View style={styles.ratingLabelContainer}>
                <Ionicons name="cash" size={20} color={colors.textSecondary} />
                <Text style={styles.ratingLabel}>Rapport qualité/prix</Text>
              </View>
              <StarRating rating={valueRating} onRate={setValueRating} size={24} />
            </View>
          </View>
        </View>

        {/* Comment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Votre commentaire (optionnel)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Partagez votre expérience..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.commentHint}>
            Minimum 10 caractères • {comment.length}/500
          </Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Ionicons name="bulb" size={20} color={colors.coral} />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Conseils pour un bon avis</Text>
            <Text style={styles.tipsText}>
              • Soyez honnête et constructif{'\n'}
              • Mentionnez ce qui vous a plu{'\n'}
              • Expliquez ce qui pourrait être amélioré{'\n'}
              • Restez respectueux
            </Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.submitButton, overallRating === 0 && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={overallRating === 0}
        >
          <Text style={styles.submitButtonText}>Publier l'avis</Text>
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
  bookingCard: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing['2xl'],
    gap: spacing.md,
  },
  bookingImage: {
    width: 80,
    height: 80,
    borderRadius: radius.sm,
  },
  bookingInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookingServiceName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  bookingSalonName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing['3xl'],
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
    marginBottom: spacing.lg,
  },
  overallRatingContainer: {
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    paddingVertical: spacing['2xl'],
    gap: spacing.md,
  },
  starContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ratingValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.black,
  },
  detailedRating: {
    gap: spacing.lg,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  ratingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  ratingLabel: {
    fontSize: typography.fontSize.base,
    color: colors.black,
  },
  commentInput: {
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: typography.fontSize.base,
    color: colors.black,
    minHeight: 120,
  },
  commentHint: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: colors.coral + '10',
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.coral,
    marginBottom: spacing.sm,
  },
  tipsText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.xs,
  },
  bottomActions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  submitButton: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.charcoal,
    ...shadows.sm,
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  submitButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default ReviewScreen;

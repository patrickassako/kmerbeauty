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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useI18n } from '../../i18n/I18nContext';
import { reviewsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface ReviewScreenProps {
  navigation: any;
  route: any;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({ navigation, route }) => {
  const { booking } = route.params || {};
  const { user } = useAuth();
  const { normalizeFontSize, spacing } = useResponsive();
  const { language } = useI18n();

  const [overallRating, setOverallRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (overallRating === 0) {
      Alert.alert(
        language === 'fr' ? 'Erreur' : 'Error',
        language === 'fr' ? 'Veuillez donner une note globale' : 'Please provide an overall rating'
      );
      return;
    }

    if (!user?.id) {
      Alert.alert(
        language === 'fr' ? 'Erreur' : 'Error',
        language === 'fr' ? 'Vous devez être connecté pour laisser un avis' : 'You must be logged in to leave a review'
      );
      return;
    }

    if (!booking?.therapist_id && !booking?.salon_id) {
      Alert.alert(
        language === 'fr' ? 'Erreur' : 'Error',
        language === 'fr' ? 'Impossible de déterminer le prestataire à noter' : 'Unable to determine provider to review'
      );
      return;
    }

    try {
      setSubmitting(true);

      await reviewsApi.createReview({
        user_id: user.id,
        therapist_id: booking.therapist_id || undefined,
        salon_id: booking.salon_id || undefined,
        rating: overallRating,
        comment: comment.trim() || undefined,
        cleanliness: cleanlinessRating > 0 ? cleanlinessRating : undefined,
        professionalism: professionalismRating > 0 ? professionalismRating : undefined,
        value: valueRating > 0 ? valueRating : undefined,
      });

      Alert.alert(
        language === 'fr' ? 'Merci !' : 'Thank you!',
        language === 'fr' ? 'Votre avis a été publié avec succès' : 'Your review has been published successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting review:', error);
      Alert.alert(
        language === 'fr' ? 'Erreur' : 'Error',
        error.message || (language === 'fr' ? 'Impossible de publier votre avis' : 'Failed to publish your review')
      );
    } finally {
      setSubmitting(false);
    }
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
          <TouchableOpacity key={star} onPress={() => onRate(star)} activeOpacity={0.7}>
            <Text style={{ fontSize: size, color: star <= rating ? '#FFD700' : '#E0E0E0' }}>
              {star <= rating ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getProviderName = () => {
    if (!booking?.provider) return '';
    if (booking.therapist_id) {
      const firstName = booking.provider.user?.first_name;
      const lastName = booking.provider.user?.last_name;
      return `${firstName || ''} ${lastName || ''}`.trim() || (language === 'fr' ? 'Thérapeute' : 'Therapist');
    } else if (booking.salon_id) {
      return (language === 'fr' ? booking.provider.name_fr : booking.provider.name_en) || booking.provider.name_fr || (language === 'fr' ? 'Institut' : 'Salon');
    }
    return language === 'fr' ? 'Prestataire' : 'Provider';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing(2.5), paddingTop: spacing(6), paddingBottom: spacing(2) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { width: spacing(5), height: spacing(5) }]}>
          <Text style={[styles.backButtonText, { fontSize: normalizeFontSize(24) }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: normalizeFontSize(18) }]}>
          {language === 'fr' ? 'Laisser un avis' : 'Leave a review'}
        </Text>
        <View style={{ width: spacing(5) }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing(2.5), paddingBottom: spacing(10) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Provider Info */}
        {booking && (
          <View style={[styles.providerCard, { padding: spacing(2), borderRadius: spacing(1.5), marginBottom: spacing(3) }]}>
            <Text style={[styles.providerName, { fontSize: normalizeFontSize(16), marginBottom: spacing(0.5) }]}>
              {getProviderName()}
            </Text>
            <Text style={[styles.providerType, { fontSize: normalizeFontSize(14) }]}>
              {booking.therapist_id ? '👤 ' : '🏢 '}
              {booking.therapist_id ? (language === 'fr' ? 'Thérapeute' : 'Therapist') : (language === 'fr' ? 'Institut' : 'Salon')}
            </Text>
          </View>
        )}

        {/* Overall Rating */}
        <View style={[styles.section, { marginBottom: spacing(3) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1.5) }]}>
            {language === 'fr' ? 'Note globale' : 'Overall rating'} *
          </Text>
          <View style={[styles.overallRatingContainer, { paddingVertical: spacing(3), borderRadius: spacing(1.5) }]}>
            <StarRating rating={overallRating} onRate={setOverallRating} size={40} />
            <Text style={[styles.ratingValue, { fontSize: normalizeFontSize(24), marginTop: spacing(1.5) }]}>
              {overallRating > 0 ? `${overallRating}.0` : (language === 'fr' ? 'Non noté' : 'Not rated')}
            </Text>
          </View>
        </View>

        {/* Detailed Ratings */}
        <View style={[styles.section, { marginBottom: spacing(3) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1.5) }]}>
            {language === 'fr' ? 'Notes détaillées (optionnel)' : 'Detailed ratings (optional)'}
          </Text>

          <View style={styles.detailedRating}>
            <View style={[styles.ratingRow, { padding: spacing(2), borderRadius: spacing(1.5), marginBottom: spacing(1.5) }]}>
              <View style={styles.ratingLabelContainer}>
                <Text style={[styles.ratingIcon, { fontSize: normalizeFontSize(20) }]}>✨</Text>
                <Text style={[styles.ratingLabel, { fontSize: normalizeFontSize(14) }]}>
                  {language === 'fr' ? 'Propreté' : 'Cleanliness'}
                </Text>
              </View>
              <StarRating rating={cleanlinessRating} onRate={setCleanlinessRating} size={24} />
            </View>

            <View style={[styles.ratingRow, { padding: spacing(2), borderRadius: spacing(1.5), marginBottom: spacing(1.5) }]}>
              <View style={styles.ratingLabelContainer}>
                <Text style={[styles.ratingIcon, { fontSize: normalizeFontSize(20) }]}>💼</Text>
                <Text style={[styles.ratingLabel, { fontSize: normalizeFontSize(14) }]}>
                  {language === 'fr' ? 'Professionnalisme' : 'Professionalism'}
                </Text>
              </View>
              <StarRating rating={professionalismRating} onRate={setProfessionalismRating} size={24} />
            </View>

            <View style={[styles.ratingRow, { padding: spacing(2), borderRadius: spacing(1.5) }]}>
              <View style={styles.ratingLabelContainer}>
                <Text style={[styles.ratingIcon, { fontSize: normalizeFontSize(20) }]}>💰</Text>
                <Text style={[styles.ratingLabel, { fontSize: normalizeFontSize(14) }]}>
                  {language === 'fr' ? 'Rapport qualité/prix' : 'Value for money'}
                </Text>
              </View>
              <StarRating rating={valueRating} onRate={setValueRating} size={24} />
            </View>
          </View>
        </View>

        {/* Comment */}
        <View style={[styles.section, { marginBottom: spacing(3) }]}>
          <Text style={[styles.sectionTitle, { fontSize: normalizeFontSize(16), marginBottom: spacing(1.5) }]}>
            {language === 'fr' ? 'Votre commentaire (optionnel)' : 'Your comment (optional)'}
          </Text>
          <TextInput
            style={[styles.commentInput, { padding: spacing(2), borderRadius: spacing(1.5), fontSize: normalizeFontSize(14), minHeight: spacing(15) }]}
            placeholder={language === 'fr' ? 'Partagez votre expérience...' : 'Share your experience...'}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholderTextColor="#999"
            maxLength={500}
          />
          <Text style={[styles.commentHint, { fontSize: normalizeFontSize(12), marginTop: spacing(1) }]}>
            {comment.length}/500
          </Text>
        </View>

        {/* Tips */}
        <View style={[styles.tipsCard, { padding: spacing(2), borderRadius: spacing(1.5), marginBottom: spacing(2) }]}>
          <Text style={[styles.tipsIcon, { fontSize: normalizeFontSize(20), marginBottom: spacing(1) }]}>💡</Text>
          <Text style={[styles.tipsTitle, { fontSize: normalizeFontSize(14), marginBottom: spacing(1) }]}>
            {language === 'fr' ? 'Conseils pour un bon avis' : 'Tips for a good review'}
          </Text>
          <Text style={[styles.tipsText, { fontSize: normalizeFontSize(12), lineHeight: normalizeFontSize(18) }]}>
            {language === 'fr' ? (
              '• Soyez honnête et constructif\n• Mentionnez ce qui vous a plu\n• Expliquez ce qui pourrait être amélioré\n• Restez respectueux'
            ) : (
              '• Be honest and constructive\n• Mention what you liked\n• Explain what could be improved\n• Stay respectful'
            )}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomActions, { padding: spacing(2.5) }]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            { paddingVertical: spacing(2), borderRadius: spacing(1.5) },
            (overallRating === 0 || submitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={overallRating === 0 || submitting}
          activeOpacity={0.7}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[styles.submitButtonText, { fontSize: normalizeFontSize(16) }]}>
              {language === 'fr' ? "Publier l'avis" : 'Publish review'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  headerTitle: {
    fontWeight: '600',
    color: '#2D2D2D',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {},
  providerCard: {
    backgroundColor: '#F5F5F5',
  },
  providerName: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  providerType: {
    color: '#666',
  },
  section: {},
  sectionTitle: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  overallRatingContainer: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  starContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingValue: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  detailedRating: {},
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  ratingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  ratingIcon: {
    color: '#666',
  },
  ratingLabel: {
    color: '#2D2D2D',
    fontWeight: '600',
  },
  commentInput: {
    backgroundColor: '#F5F5F5',
    color: '#2D2D2D',
  },
  commentHint: {
    color: '#999',
  },
  tipsCard: {
    backgroundColor: '#FFF9E6',
  },
  tipsIcon: {},
  tipsTitle: {
    fontWeight: '700',
    color: '#2D2D2D',
  },
  tipsText: {
    color: '#666',
  },
  bottomActions: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default ReviewScreen;

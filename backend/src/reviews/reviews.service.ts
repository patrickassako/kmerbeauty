import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ReviewsService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Récupère les avis pour un thérapeute
   */
  async getTherapistReviews(therapistId: string) {
    const { data, error } = await this.supabase.client
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        cleanliness,
        professionalism,
        value,
        created_at,
        user:users!reviews_user_id_fkey (
          id,
          first_name,
          last_name,
          avatar
        )
      `)
      .eq('therapist_id', therapistId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch therapist reviews: ${error.message}`);
    }

    return data;
  }

  /**
   * Récupère les avis pour un salon
   */
  async getSalonReviews(salonId: string) {
    const { data, error } = await this.supabase.client
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        cleanliness,
        professionalism,
        value,
        created_at,
        user:users!reviews_user_id_fkey (
          id,
          first_name,
          last_name,
          avatar
        )
      `)
      .eq('salon_id', salonId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch salon reviews: ${error.message}`);
    }

    return data;
  }

  /**
   * Créer un nouvel avis
   */
  async createReview(createReviewDto: {
    user_id: string;
    therapist_id?: string;
    salon_id?: string;
    rating: number;
    comment?: string;
    cleanliness?: number;
    professionalism?: number;
    value?: number;
  }) {
    // Vérifier qu'on a soit therapist_id soit salon_id
    if (!createReviewDto.therapist_id && !createReviewDto.salon_id) {
      throw new Error('Either therapist_id or salon_id must be provided');
    }

    if (createReviewDto.therapist_id && createReviewDto.salon_id) {
      throw new Error('Cannot provide both therapist_id and salon_id');
    }

    const { data, error } = await this.supabase.client
      .from('reviews')
      .insert(createReviewDto)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create review: ${error.message}`);
    }

    // Mettre à jour les stats du provider
    if (createReviewDto.therapist_id) {
      await this.updateTherapistStats(createReviewDto.therapist_id);
    } else if (createReviewDto.salon_id) {
      await this.updateSalonStats(createReviewDto.salon_id);
    }

    return data;
  }

  /**
   * Mettre à jour les stats de rating d'un thérapeute
   */
  private async updateTherapistStats(therapistId: string) {
    // Récupérer tous les avis
    const { data: reviews } = await this.supabase.client
      .from('reviews')
      .select('rating')
      .eq('therapist_id', therapistId);

    if (!reviews || reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const reviewCount = reviews.length;

    // Mettre à jour le thérapeute
    await this.supabase.client
      .from('therapists')
      .update({
        rating: avgRating,
        review_count: reviewCount,
      })
      .eq('id', therapistId);
  }

  /**
   * Mettre à jour les stats de rating d'un salon
   */
  private async updateSalonStats(salonId: string) {
    // Récupérer tous les avis
    const { data: reviews } = await this.supabase.client
      .from('reviews')
      .select('rating')
      .eq('salon_id', salonId);

    if (!reviews || reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const reviewCount = reviews.length;

    // Mettre à jour le salon
    await this.supabase.client
      .from('salons')
      .update({
        rating: avgRating,
        review_count: reviewCount,
      })
      .eq('id', salonId);
  }
}

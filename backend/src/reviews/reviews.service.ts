import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Récupère les avis pour un thérapeute
   */
  async getTherapistReviews(therapistId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
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
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
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
    const supabase = this.supabaseService.getClient();

    // Vérifier qu'on a soit therapist_id soit salon_id
    if (!createReviewDto.therapist_id && !createReviewDto.salon_id) {
      throw new Error('Either therapist_id or salon_id must be provided');
    }

    if (createReviewDto.therapist_id && createReviewDto.salon_id) {
      throw new Error('Cannot provide both therapist_id and salon_id');
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert(createReviewDto)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create review: ${error.message}`);
    }

    // Note: Les stats (rating, review_count) sont mises à jour automatiquement
    // par les triggers PostgreSQL (voir migration 003_add_reviews_triggers.sql)

    return data;
  }
}

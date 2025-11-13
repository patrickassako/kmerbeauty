import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Vérifier si un thérapeute est en favoris
   */
  async isTherapistFavorite(userId: string, therapistId: string): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('therapist_id', therapistId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      throw new Error(`Failed to check favorite: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Vérifier si un salon est en favoris
   */
  async isSalonFavorite(userId: string, salonId: string): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('salon_id', salonId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check favorite: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Ajouter un thérapeute aux favoris
   */
  async addTherapistToFavorites(userId: string, therapistId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        therapist_id: therapistId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add to favorites: ${error.message}`);
    }

    return data;
  }

  /**
   * Ajouter un salon aux favoris
   */
  async addSalonToFavorites(userId: string, salonId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        salon_id: salonId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add to favorites: ${error.message}`);
    }

    return data;
  }

  /**
   * Retirer un thérapeute des favoris
   */
  async removeTherapistFromFavorites(userId: string, therapistId: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('therapist_id', therapistId);

    if (error) {
      throw new Error(`Failed to remove from favorites: ${error.message}`);
    }

    return { success: true };
  }

  /**
   * Retirer un salon des favoris
   */
  async removeSalonFromFavorites(userId: string, salonId: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('salon_id', salonId);

    if (error) {
      throw new Error(`Failed to remove from favorites: ${error.message}`);
    }

    return { success: true };
  }

  /**
   * Récupérer tous les favoris d'un utilisateur
   */
  async getUserFavorites(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        therapist_id,
        salon_id,
        created_at,
        therapist:therapist_id (
          id,
          bio_fr,
          bio_en,
          rating,
          review_count,
          portfolio_images,
          user:user_id (
            first_name,
            last_name,
            avatar
          )
        ),
        salon:salon_id (
          id,
          name_fr,
          name_en,
          rating,
          review_count,
          cover_image,
          city,
          quarter
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch favorites: ${error.message}`);
    }

    return data;
  }
}

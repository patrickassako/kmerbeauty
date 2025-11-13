import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class TherapistsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(city?: string, serviceId?: string) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('therapists')
      .select(`
        *,
        user:user_id (
          id,
          first_name,
          last_name,
          avatar,
          phone
        ),
        salon:salon_id (
          id,
          name_fr,
          name_en
        )
      `)
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (city) {
      query = query.eq('city', city);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch therapists: ${error.message}`);
    }

    // Filter by service if provided
    if (serviceId) {
      if (!data || data.length === 0) {
        return [];
      }

      const therapistIds = data.map((t) => t.id);
      const { data: therapistServices } = await supabase
        .from('therapist_services')
        .select('therapist_id')
        .eq('service_id', serviceId)
        .in('therapist_id', therapistIds);

      if (therapistServices && therapistServices.length > 0) {
        const filteredIds = therapistServices.map((ts) => ts.therapist_id);
        return data.filter((t) => filteredIds.includes(t.id));
      }

      // Return empty array if no therapists offer this service
      return [];
    }

    return data;
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('therapists')
      .select(`
        *,
        user:user_id (
          id,
          first_name,
          last_name,
          avatar,
          phone,
          email
        ),
        salon:salon_id (
          id,
          name_fr,
          name_en,
          quarter,
          city
        ),
        education (
          id,
          title,
          institution,
          year
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch therapist: ${error.message}`);
    }

    return data;
  }

  async getServices(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('therapist_services')
      .select(`
        price,
        duration,
        service:service_id (
          id,
          name_fr,
          name_en,
          description_fr,
          description_en,
          category,
          images,
          base_price,
          duration
        )
      `)
      .eq('therapist_id', id)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch therapist services: ${error.message}`);
    }

    return data;
  }
}

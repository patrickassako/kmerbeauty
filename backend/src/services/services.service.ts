import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ServicesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(category?: string) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch services: ${error.message}`);
    }

    // Ajouter le nombre de prestataires (thérapeutes + salons) pour chaque service
    const servicesWithCounts = await Promise.all(
      data.map(async (service) => {
        // Compter les thérapeutes qui offrent ce service
        const { count: therapistCount } = await supabase
          .from('therapist_services')
          .select('*', { count: 'exact', head: true })
          .eq('service_id', service.id)
          .eq('is_active', true);

        // Compter les salons qui offrent ce service
        const { count: salonCount } = await supabase
          .from('salon_services')
          .select('*', { count: 'exact', head: true })
          .eq('service_id', service.id)
          .eq('is_active', true);

        return {
          ...service,
          provider_count: (therapistCount || 0) + (salonCount || 0),
        };
      }),
    );

    return servicesWithCounts;
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch service: ${error.message}`);
    }

    return data;
  }
}

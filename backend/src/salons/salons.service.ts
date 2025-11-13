import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SalonsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(city?: string, serviceId?: string) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('salons')
      .select(`
        *,
        user:user_id (
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (city) {
      query = query.eq('city', city);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch salons: ${error.message}`);
    }

    // Filter by service if provided
    if (serviceId) {
      if (!data || data.length === 0) {
        return [];
      }

      const salonIds = data.map((s) => s.id);
      const { data: salonServices } = await supabase
        .from('salon_services')
        .select('salon_id, price, duration')
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .in('salon_id', salonIds);

      if (salonServices && salonServices.length > 0) {
        const priceMap = new Map(
          salonServices.map((ss) => [
            ss.salon_id,
            { price: ss.price, duration: ss.duration },
          ]),
        );

        return data
          .filter((s) => priceMap.has(s.id))
          .map((s) => ({
            ...s,
            service_price: priceMap.get(s.id)?.price,
            service_duration: priceMap.get(s.id)?.duration,
          }));
      }

      // Return empty array if no salons offer this service
      return [];
    }

    return data;
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('salons')
      .select(`
        *,
        user:user_id (
          id,
          first_name,
          last_name,
          phone,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch salon: ${error.message}`);
    }

    return data;
  }

  async getServices(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('salon_services')
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
      .eq('salon_id', id)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch salon services: ${error.message}`);
    }

    return data;
  }

  async getTherapists(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('therapists')
      .select(`
        *,
        user:user_id (
          id,
          first_name,
          last_name,
          avatar
        )
      `)
      .eq('salon_id', id)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch salon therapists: ${error.message}`);
    }

    return data;
  }
}

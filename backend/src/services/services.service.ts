import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ServicesService {
  constructor(private readonly supabaseService: SupabaseService) { }

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

    // provider_count is now denormalized and auto-maintained by triggers
    // No need for N+1 queries - just return the data directly
    return data;
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

    // No need for additional COUNT queries
    return data;
  }

  async findNearbyProviders(
    serviceId: string | null,
    lat: number,
    lng: number,
    radius: number = 50000,
    city?: string,
    district?: string,
  ) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.rpc('get_nearby_providers', {
      lat,
      lng,
      radius_meters: radius,
      client_city: city,
      client_district: district,
      filter_service_id: serviceId,
    });

    if (error) {
      throw new Error(`Failed to fetch nearby providers: ${error.message}`);
    }

    return data;
  }
}

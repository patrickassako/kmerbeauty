import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class TherapistsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async findAll(city?: string, serviceId?: string, quarter?: string) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('therapists')
      .select(`
        *,
        user:users!user_id (
          id,
          first_name,
          last_name,
          avatar,
          phone
        ),
        salon:salons!salon_id (
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

    let result = data || [];

    // Prioritize by quarter if provided
    if (quarter && result.length > 0) {
      result = result.sort((a, b) => {
        let aZones: any[] = [];
        let bZones: any[] = [];

        try {
          aZones = a.service_zones ? (typeof a.service_zones === 'string' ? JSON.parse(a.service_zones) : a.service_zones) : [];
        } catch { aZones = []; }

        try {
          bZones = b.service_zones ? (typeof b.service_zones === 'string' ? JSON.parse(b.service_zones) : b.service_zones) : [];
        } catch { bZones = []; }

        // Check if quarter matches (service_zones is array of {city, district} objects)
        const aMatches = Array.isArray(aZones) && aZones.some((z) => {
          if (typeof z === 'string') return z.toLowerCase() === quarter.toLowerCase();
          if (z && typeof z.district === 'string') return z.district.toLowerCase() === quarter.toLowerCase();
          return false;
        });
        const bMatches = Array.isArray(bZones) && bZones.some((z) => {
          if (typeof z === 'string') return z.toLowerCase() === quarter.toLowerCase();
          if (z && typeof z.district === 'string') return z.district.toLowerCase() === quarter.toLowerCase();
          return false;
        });

        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    }

    // Filter by service if provided
    if (serviceId) {
      if (result.length === 0) {
        return [];
      }

      const therapistIds = result.map((t) => t.id);
      const { data: therapistServices } = await supabase
        .from('therapist_services')
        .select('therapist_id, price, duration')
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .in('therapist_id', therapistIds);

      if (therapistServices && therapistServices.length > 0) {
        const priceMap = new Map(
          therapistServices.map((ts) => [
            ts.therapist_id,
            { price: ts.price, duration: ts.duration },
          ]),
        );

        return result
          .filter((t) => priceMap.has(t.id))
          .map((t) => ({
            ...t,
            service_price: priceMap.get(t.id)?.price,
            service_duration: priceMap.get(t.id)?.duration,
          }));
      }

      return [];
    }

    return result;
  }

  async findOne(id: string, userId?: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('therapists')
      .select(`
        *,
        user:users!user_id (
          id,
          first_name,
          last_name,
          avatar,
          phone,
          email
        ),
        salon:salons!salon_id (
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

    if (data && userId) {
      this.eventEmitter.emit('profile.viewed', {
        providerId: data.id,
        providerType: 'therapist',
        userId: userId,
      });
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
        service:services!service_id (
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
  async getAvailability(id: string, date: string) {
    const supabase = this.supabaseService.getClient();

    // Simple availability check based on is_online field
    const { data: therapist, error } = await supabase
      .from('therapists')
      .select(`
        id,
        is_active,
        user:users!user_id (
          is_online
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch therapist availability: ${error.message}`);
    }

    const userData = therapist?.user as any;
    const isOnline = Array.isArray(userData) ? userData[0]?.is_online : (userData?.is_online ?? false);
    const isActive = therapist?.is_active ?? false;

    return {
      available: isOnline && isActive,
      is_online: isOnline,
      is_active: isActive,
    };
  }
  async findNearby(
    lat: number,
    lng: number,
    radius: number = 50000,
    city?: string,
    district?: string,
  ) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.rpc('get_nearby_therapists', {
      lat,
      lng,
      radius_meters: radius,
      client_city: city,
      client_district: district,
    });

    if (error) {
      throw new Error(`Failed to fetch nearby therapists: ${error.message}`);
    }

    return data;
  }
}

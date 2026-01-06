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
        const aZones = a.service_zones ? (typeof a.service_zones === 'string' ? JSON.parse(a.service_zones) : a.service_zones) : [];
        const bZones = b.service_zones ? (typeof b.service_zones === 'string' ? JSON.parse(b.service_zones) : b.service_zones) : [];

        // Check if quarter matches (case-insensitive for robustness)
        const aMatches = Array.isArray(aZones) && aZones.some((z: string) => z.toLowerCase() === quarter.toLowerCase());
        const bMatches = Array.isArray(bZones) && bZones.some((z: string) => z.toLowerCase() === quarter.toLowerCase());

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
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // 1. Get therapist's availability for this day of week
    const { data: availability, error: availError } = await supabase
      .from('availability')
      .select('*')
      .eq('therapist_id', id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single();

    if (availError && availError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw new Error(`Failed to fetch availability: ${availError.message}`);
    }

    if (!availability) {
      return []; // No availability for this day
    }

    // 2. Get existing bookings for this therapist on this date
    // We need to query bookings that overlap with the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('scheduled_at, duration')
      .eq('therapist_id', id)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .neq('status', 'CANCELLED')
      .neq('status', 'DECLINED');

    if (bookingsError) {
      throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
    }

    // 3. Generate slots
    const slots = [];
    const [startHour, startMinute] = availability.start_time.split(':').map(Number);
    const [endHour, endMinute] = availability.end_time.split(':').map(Number);

    let currentSlot = new Date(date);
    currentSlot.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    // Default slot duration: 60 minutes (can be adjusted or made dynamic)
    const slotDuration = 60;

    while (currentSlot < endTime) {
      const slotEnd = new Date(currentSlot.getTime() + slotDuration * 60000);

      if (slotEnd > endTime) break;

      // Check if this slot overlaps with any existing booking
      const isBooked = bookings?.some((booking) => {
        const bookingStart = new Date(booking.scheduled_at);
        const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);

        return (
          (currentSlot >= bookingStart && currentSlot < bookingEnd) || // Slot starts inside booking
          (slotEnd > bookingStart && slotEnd <= bookingEnd) || // Slot ends inside booking
          (currentSlot <= bookingStart && slotEnd >= bookingEnd) // Slot encompasses booking
        );
      });

      if (!isBooked) {
        slots.push(currentSlot.toTimeString().slice(0, 5));
      }

      // Move to next slot (e.g., every 60 mins)
      currentSlot = new Date(currentSlot.getTime() + 60 * 60000);
    }

    return slots;
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

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SalonsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

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

  async findOne(id: string, userId?: string) {
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

    if (data && userId) {
      this.eventEmitter.emit('profile.viewed', {
        providerId: data.id,
        providerType: 'salon',
        userId: userId,
      });
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
  async getAvailability(id: string, date: string) {
    const supabase = this.supabaseService.getClient();
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dayOfWeek];

    // 1. Get salon's opening hours
    const { data: salon, error: salonError } = await supabase
      .from('salons')
      .select('opening_hours')
      .eq('id', id)
      .single();

    if (salonError) {
      throw new Error(`Failed to fetch salon: ${salonError.message}`);
    }

    const openingHours = salon.opening_hours as any;
    if (!openingHours || !openingHours[dayName] || !openingHours[dayName].open) {
      return []; // Closed on this day
    }

    const dayHours = openingHours[dayName];
    // Format attendu: { open: "09:00", close: "19:00" }

    // 2. Get existing bookings for this salon on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('scheduled_at, duration')
      .eq('salon_id', id)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .neq('status', 'CANCELLED')
      .neq('status', 'DECLINED');

    if (bookingsError) {
      throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
    }

    // 3. Generate slots
    const slots = [];
    const [startHour, startMinute] = dayHours.open.split(':').map(Number);
    const [endHour, endMinute] = dayHours.close.split(':').map(Number);

    let currentSlot = new Date(date);
    currentSlot.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    // Default slot duration: 60 minutes
    const slotDuration = 60;

    while (currentSlot < endTime) {
      const slotEnd = new Date(currentSlot.getTime() + slotDuration * 60000);

      if (slotEnd > endTime) break;

      // Check if this slot overlaps with any existing booking
      // Note: For salons, we might want to check capacity (number of therapists)
      // But for MVP, we'll assume simple slot booking or check if ALL therapists are busy
      // For now, let's keep it simple: if there's a booking, we might still allow it if multiple therapists
      // BUT, to be safe and simple: let's assume 1 concurrent booking per slot for now unless we check therapist availability
      // IMPROVEMENT: Check if there is AT LEAST ONE therapist available at this time.
      // For this MVP step, let's just return the slots based on opening hours.
      // Real implementation should check therapist availability within the salon.

      // Let's check if we have too many bookings at this time?
      // Or simply return slots and let the booking fail if no therapist is available?
      // Better approach for MVP: Just return opening hours slots.
      // Refinement: Check if specific therapist is requested in booking? No, here we check salon availability.

      // Let's just return slots based on opening hours for now, as salon capacity is complex.
      // Or better: check if there are overlapping bookings.

      const overlappingBookings = bookings?.filter((booking) => {
        const bookingStart = new Date(booking.scheduled_at);
        const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);

        return (
          (currentSlot >= bookingStart && currentSlot < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (currentSlot <= bookingStart && slotEnd >= bookingEnd)
        );
      });

      // If we have many bookings, maybe we are full?
      // Let's assume a capacity of 3 for now if not specified
      const CAPACITY = 3;
      if (!overlappingBookings || overlappingBookings.length < CAPACITY) {
        slots.push(currentSlot.toTimeString().slice(0, 5));
      }

      currentSlot = new Date(currentSlot.getTime() + 60 * 60000);
    }

    return slots;
  }
}

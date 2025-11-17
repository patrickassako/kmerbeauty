import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateBookingDto } from './bookings.controller';

@Injectable()
export class BookingsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createBookingDto: CreateBookingDto) {
    const supabase = this.supabaseService.getClient();

    // Créer le booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          user_id: createBookingDto.user_id,
          therapist_id: createBookingDto.therapist_id || null,
          salon_id: createBookingDto.salon_id || null,
          scheduled_at: createBookingDto.scheduled_at,
          duration: createBookingDto.duration,
          location_type: createBookingDto.location_type,
          quarter: createBookingDto.quarter,
          street: createBookingDto.street,
          landmark: createBookingDto.landmark,
          city: createBookingDto.city,
          region: createBookingDto.region,
          latitude: createBookingDto.latitude,
          longitude: createBookingDto.longitude,
          instructions: createBookingDto.instructions,
          subtotal: createBookingDto.subtotal,
          travel_fee: createBookingDto.travel_fee || 0,
          tip: createBookingDto.tip || 0,
          total: createBookingDto.total,
          notes: createBookingDto.notes,
          status: 'PENDING',
        },
      ])
      .select('*')
      .single();

    if (bookingError) {
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    // Créer les booking items (services)
    if (createBookingDto.items && createBookingDto.items.length > 0) {
      const bookingItems = createBookingDto.items.map((item) => ({
        booking_id: booking.id,
        service_name: item.service_name,
        price: item.price,
        duration: item.duration,
      }));

      const { error: itemsError } = await supabase
        .from('booking_items')
        .insert(bookingItems);

      if (itemsError) {
        // Si erreur lors de la création des items, supprimer le booking
        await supabase.from('bookings').delete().eq('id', booking.id);
        throw new Error(`Failed to create booking items: ${itemsError.message}`);
      }
    }

    // Récupérer les infos du prestataire
    let providerData = null;
    if (createBookingDto.therapist_id) {
      const { data: therapist } = await supabase
        .from('therapists')
        .select('id, profile_image, city')
        .eq('id', createBookingDto.therapist_id)
        .single();

      if (therapist) {
        const { data: user } = await supabase
          .from('users')
          .select('first_name, last_name, phone')
          .eq('id', therapist.id)
          .single();

        providerData = { ...therapist, user };
      }
    } else if (createBookingDto.salon_id) {
      const { data: salon } = await supabase
        .from('salons')
        .select('id, name_fr, name_en, logo, city')
        .eq('id', createBookingDto.salon_id)
        .single();
      providerData = salon;
    }

    // Récupérer les booking items créés
    const { data: items } = await supabase
      .from('booking_items')
      .select('*')
      .eq('booking_id', booking.id);

    return {
      ...booking,
      items: items || [],
      provider: providerData,
    };
  }

  async findAll(userId?: string) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }

    // Pour chaque booking, récupérer les items et le prestataire
    const bookingsWithDetails = await Promise.all(
      data.map(async (booking) => {
        // Récupérer les booking items avec les infos du service
        const { data: items } = await supabase
          .from('booking_items')
          .select('*, service:services(id, images)')
          .eq('booking_id', booking.id);

        // Récupérer les infos du prestataire
        let providerData = null;
        if (booking.therapist_id) {
          const { data: therapist } = await supabase
            .from('therapists')
            .select('id, profile_image, city')
            .eq('id', booking.therapist_id)
            .single();

          if (therapist) {
            const { data: user } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('id', therapist.id)
              .single();

            providerData = { ...therapist, user };
          }
        } else if (booking.salon_id) {
          const { data: salon } = await supabase
            .from('salons')
            .select('id, name_fr, name_en, logo, city')
            .eq('id', booking.salon_id)
            .single();
          providerData = salon;
        }

        return {
          ...booking,
          items: items || [],
          provider: providerData,
        };
      }),
    );

    return bookingsWithDetails;
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch booking: ${error.message}`);
    }

    // Récupérer les booking items avec les infos du service
    const { data: items } = await supabase
      .from('booking_items')
      .select('*, service:services(id, images)')
      .eq('booking_id', data.id);

    // Récupérer les infos du prestataire
    let providerData = null;
    if (data.therapist_id) {
      const { data: therapist } = await supabase
        .from('therapists')
        .select('id, profile_image, city, region, rating')
        .eq('id', data.therapist_id)
        .single();

      if (therapist) {
        const { data: user } = await supabase
          .from('users')
          .select('first_name, last_name, phone, email')
          .eq('id', therapist.id)
          .single();

        providerData = { ...therapist, user };
      }
    } else if (data.salon_id) {
      const { data: salon } = await supabase
        .from('salons')
        .select('id, name_fr, name_en, logo, cover_image, city, region, rating')
        .eq('id', data.salon_id)
        .single();

      if (salon) {
        const { data: user } = await supabase
          .from('users')
          .select('phone, email')
          .eq('id', salon.id)
          .single();

        providerData = { ...salon, user };
      }
    }

    return {
      ...data,
      items: items || [],
      provider: providerData,
    };
  }

  async cancel(id: string, reason?: string) {
    const supabase = this.supabaseService.getClient();

    // Mettre à jour le statut de la réservation
    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to cancel booking: ${error.message}`);
    }

    // Récupérer les booking items avec les infos du service
    const { data: items } = await supabase
      .from('booking_items')
      .select('*, service:services(id, images)')
      .eq('booking_id', data.id);

    // Récupérer les infos du prestataire
    let providerData = null;
    if (data.therapist_id) {
      const { data: therapist } = await supabase
        .from('therapists')
        .select('id, profile_image, city, region, rating')
        .eq('id', data.therapist_id)
        .single();

      if (therapist) {
        const { data: user } = await supabase
          .from('users')
          .select('first_name, last_name, phone, email')
          .eq('id', therapist.id)
          .single();

        providerData = { ...therapist, user };
      }
    } else if (data.salon_id) {
      const { data: salon } = await supabase
        .from('salons')
        .select('id, name_fr, name_en, logo, cover_image, city, region, rating')
        .eq('id', data.salon_id)
        .single();

      if (salon) {
        const { data: user } = await supabase
          .from('users')
          .select('phone, email')
          .eq('id', salon.id)
          .single();

        providerData = { ...salon, user };
      }
    }

    return {
      ...data,
      items: items || [],
      provider: providerData,
    };
  }

  async findForContractor(contractorId: string, status?: string) {
    const supabase = this.supabaseService.getClient();

    console.log('🔍 [BookingsService] Finding bookings for contractor:', contractorId);
    console.log('🔍 [BookingsService] Status filter:', status || 'none');

    // Récupérer d'abord le user_id et therapist_id associés à ce contractor
    const { data: contractorProfile, error: contractorError } = await supabase
      .from('contractor_profiles')
      .select('user_id')
      .eq('id', contractorId)
      .single();

    if (contractorError) {
      console.error('❌ [BookingsService] Contractor profile not found:', contractorError);
      throw new Error(`Contractor profile not found: ${contractorError.message}`);
    }

    console.log('✅ [BookingsService] Contractor user_id:', contractorProfile.user_id);

    // Récupérer le therapist_id associé
    const { data: therapist } = await supabase
      .from('therapists')
      .select('id')
      .eq('user_id', contractorProfile.user_id)
      .single();

    const therapistId = therapist?.id;
    console.log('🔍 [BookingsService] Associated therapist_id:', therapistId || 'none');

    // Construire la requête OR pour chercher dans les 3 champs possibles
    const orConditions = [
      `contractor_id.eq.${contractorId}`,
      `salon_id.eq.${contractorId}`,
    ];

    if (therapistId) {
      orConditions.push(`therapist_id.eq.${therapistId}`);
    }

    console.log('🔍 [BookingsService] OR conditions:', orConditions.join(' OR '));

    // Récupérer les bookings pour ce prestataire
    let query = supabase
      .from('bookings')
      .select('*')
      .or(orConditions.join(','))
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [BookingsService] Error fetching bookings:', error);
      throw new Error(`Failed to fetch contractor bookings: ${error.message}`);
    }

    console.log('📦 [BookingsService] Found', data?.length || 0, 'bookings');

    // Pour chaque booking, récupérer les items et les infos du client
    const bookingsWithDetails = await Promise.all(
      data.map(async (booking) => {
        console.log('📋 [BookingsService] Processing booking:', booking.id, '| Status:', booking.status);

        // Récupérer les booking items
        const { data: items, error: itemsError } = await supabase
          .from('booking_items')
          .select('*, service:services(id, images)')
          .eq('booking_id', booking.id);

        if (itemsError) {
          console.error('❌ [BookingsService] Error fetching items for booking', booking.id, ':', itemsError);
        } else {
          console.log('✅ [BookingsService] Found', items?.length || 0, 'items for booking', booking.id);
        }

        // Récupérer les infos du client
        const { data: client, error: clientError } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, phone, avatar')
          .eq('id', booking.user_id)
          .single();

        if (clientError) {
          console.error('❌ [BookingsService] Error fetching client for booking', booking.id, ':', clientError);
        } else {
          console.log('✅ [BookingsService] Found client for booking', booking.id, ':', client?.id);
        }

        return {
          ...booking,
          items: items || [],
          client: client || null,
        };
      }),
    );

    console.log('✅ [BookingsService] Returning', bookingsWithDetails.length, 'bookings with details');
    return bookingsWithDetails;
  }

  async confirmBooking(id: string) {
    const supabase = this.supabaseService.getClient();

    console.log('✅ [BookingsService] Confirming booking:', id);

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'CONFIRMED' })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('❌ [BookingsService] Error confirming booking:', error);
      throw new Error(`Failed to confirm booking: ${error.message}`);
    }

    console.log('✅ [BookingsService] Booking confirmed successfully');
    return data;
  }

  async declineBooking(id: string, reason: string) {
    const supabase = this.supabaseService.getClient();

    console.log('🚫 [BookingsService] Declining booking:', id, '| Reason:', reason);

    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('❌ [BookingsService] Error declining booking:', error);
      throw new Error(`Failed to decline booking: ${error.message}`);
    }

    console.log('✅ [BookingsService] Booking declined successfully');
    return data;
  }
}

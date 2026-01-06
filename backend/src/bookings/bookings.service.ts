import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateBookingDto } from './bookings.controller';

@Injectable()
export class BookingsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

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
        .select('id, user_id, profile_image, city')
        .eq('id', createBookingDto.therapist_id)
        .single();

      if (therapist) {
        const { data: user } = await supabase
          .from('users')
          .select('first_name, last_name, phone')
          .eq('id', therapist.user_id)
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
        // Récupérer les booking items (SANS JOIN - booking_items n'a pas de FK vers services)
        const { data: items } = await supabase
          .from('booking_items')
          .select('*')
          .eq('booking_id', booking.id);

        // Pour chaque item, récupérer l'image du service en cherchant par nom
        const itemsWithImages = await Promise.all(
          (items || []).map(async (item) => {
            // Chercher le service par nom (name_fr ou name_en)
            const { data: services } = await supabase
              .from('services')
              .select('id, name_fr, name_en, images')
              .or(`name_fr.eq.${item.service_name},name_en.eq.${item.service_name}`)
              .limit(1);

            const service = services && services.length > 0 ? services[0] : null;
            const firstImage = service?.images && service.images.length > 0 ? service.images[0] : null;

            return {
              ...item,
              service_image: firstImage,
            };
          }),
        );

        // Récupérer les infos du prestataire
        let providerData = null;
        if (booking.therapist_id) {
          const { data: therapist } = await supabase
            .from('therapists')
            .select('id, user_id, profile_image, city, rating')
            .eq('id', booking.therapist_id)
            .single();

          if (therapist) {
            const { data: user } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('id', therapist.user_id)
              .single();

            providerData = { ...therapist, user };
          }
        } else if (booking.salon_id) {
          const { data: salon } = await supabase
            .from('salons')
            .select('id, name_fr, name_en, logo, city, rating')
            .eq('id', booking.salon_id)
            .single();
          providerData = salon;
        }

        return {
          ...booking,
          items: itemsWithImages || [],
          provider: providerData,
        };
      }),
    );

    return bookingsWithDetails;
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();

    console.log('🔍 [BookingsService] Fetching booking:', id);

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch booking: ${error.message}`);
    }

    console.log('✅ [BookingsService] Found booking:', data.id, '| user_id:', data.user_id);

    // Récupérer les booking items (SANS JOIN - booking_items n'a pas de FK vers services)
    const { data: items } = await supabase
      .from('booking_items')
      .select('*')
      .eq('booking_id', data.id);

    console.log('✅ [BookingsService] Found', items?.length || 0, 'items for booking');

    // Pour chaque item, récupérer l'image du service en cherchant par nom
    const itemsWithImages = await Promise.all(
      (items || []).map(async (item) => {
        // Chercher le service par nom (name_fr ou name_en)
        const { data: services } = await supabase
          .from('services')
          .select('id, name_fr, name_en, images')
          .or(`name_fr.eq.${item.service_name},name_en.eq.${item.service_name}`)
          .limit(1);

        const service = services && services.length > 0 ? services[0] : null;
        const firstImage = service?.images && service.images.length > 0 ? service.images[0] : null;

        if (service) {
          console.log('✅ [BookingsService] Found service', service.id, 'for item', item.service_name, '| image:', firstImage);
        } else {
          console.log('⚠️ [BookingsService] No service found for item:', item.service_name);
        }

        return {
          ...item,
          service_image: firstImage,
        };
      }),
    );

    // Récupérer les infos du client
    const { data: client, error: clientError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, phone, avatar')
      .eq('id', data.user_id)
      .single();

    if (clientError) {
      console.error('❌ [BookingsService] Error fetching client:', clientError);
    } else {
      console.log('✅ [BookingsService] Found client:', client?.id, '| name:', client?.first_name, client?.last_name);
    }

    // Récupérer les infos du prestataire
    let providerData = null;
    if (data.therapist_id) {
      const { data: therapist } = await supabase
        .from('therapists')
        .select('id, user_id, profile_image, city, region, rating')
        .eq('id', data.therapist_id)
        .single();

      if (therapist) {
        const { data: user } = await supabase
          .from('users')
          .select('first_name, last_name, phone, email')
          .eq('id', therapist.user_id)
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

    console.log('✅ [BookingsService] Returning booking with client and', itemsWithImages.length, 'items with images');

    return {
      ...data,
      items: itemsWithImages || [],
      client: client || null,
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

    // Récupérer les booking items (SANS JOIN - booking_items n'a pas de FK vers services)
    const { data: items } = await supabase
      .from('booking_items')
      .select('*')
      .eq('booking_id', data.id);

    // Récupérer les infos du prestataire
    let providerData = null;
    if (data.therapist_id) {
      const { data: therapist } = await supabase
        .from('therapists')
        .select('id, user_id, profile_image, city, region, rating')
        .eq('id', data.therapist_id)
        .single();

      if (therapist) {
        const { data: user } = await supabase
          .from('users')
          .select('first_name, last_name, phone, email')
          .eq('id', therapist.user_id)
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

    // Check if it's a therapist
    const { data: therapist } = await supabase
      .from('therapists')
      .select('id, user_id')
      .eq('id', contractorId)
      .single();

    // Check if it's a salon
    const { data: salon } = await supabase
      .from('salons')
      .select('id')
      .eq('id', contractorId)
      .single();

    if (!therapist && !salon) {
      console.warn('⚠️ [BookingsService] Provider not found in therapists or salons tables. Checking legacy contractor_profiles...');
    }

    // Build OR conditions
    const orConditions = [
      `contractor_id.eq.${contractorId}`, // Legacy support
    ];

    if (therapist) {
      orConditions.push(`therapist_id.eq.${contractorId}`);
    }

    if (salon) {
      orConditions.push(`salon_id.eq.${contractorId}`);
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

        // Récupérer les booking items (SANS JOIN car booking_items n'a pas de FK vers services)
        const { data: items, error: itemsError } = await supabase
          .from('booking_items')
          .select('*')
          .eq('booking_id', booking.id);

        if (itemsError) {
          console.error('❌ [BookingsService] Error fetching items for booking', booking.id, ':', itemsError);
        } else {
          console.log('✅ [BookingsService] Found', items?.length || 0, 'items for booking', booking.id);
        }

        // Pour chaque item, récupérer l'image du service en cherchant par nom
        const itemsWithImages = await Promise.all(
          (items || []).map(async (item) => {
            // Chercher le service par nom (name_fr ou name_en)
            const { data: services } = await supabase
              .from('services')
              .select('id, name_fr, name_en, images')
              .or(`name_fr.eq.${item.service_name},name_en.eq.${item.service_name}`)
              .limit(1);

            const service = services && services.length > 0 ? services[0] : null;
            const firstImage = service?.images && service.images.length > 0 ? service.images[0] : null;

            return {
              ...item,
              service_image: firstImage,
            };
          }),
        );

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
          items: itemsWithImages || [],
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

    // Emit event for credit debit
    // Determine provider type and ID
    let providerId = data.therapist_id;
    let providerType = 'therapist';

    if (data.salon_id) {
      providerId = data.salon_id;
      providerType = 'salon';
    }

    if (providerId) {
      this.eventEmitter.emit('booking.confirmed', {
        providerId,
        providerType,
        bookingId: id,
      });
    }

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

  async completeBooking(id: string) {
    const supabase = this.supabaseService.getClient();

    console.log('✅ [BookingsService] Completing booking:', id);

    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'COMPLETED',
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('❌ [BookingsService] Error completing booking:', error);
      throw new Error(`Failed to complete booking: ${error.message}`);
    }

    console.log('✅ [BookingsService] Booking completed successfully');
    return data;
  }
  async createAgentBooking(dto: any) {
    const supabase = this.supabaseService.getClient();

    console.log('🤖 [BookingsService] Creating Agent Booking for:', dto.customerPhone);

    // 1. Find or Create User
    let userId = null;
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('phone', dto.customerPhone)
      .single();

    if (existingUser) {
      console.log('✅ [BookingsService] Found existing user:', existingUser.id);
      userId = existingUser.id;
    } else {
      console.log('🆕 [BookingsService] Creating new guest user');

      // Generate a UUID for the new user
      const newUserId = crypto.randomUUID();

      // Insert directly into public.users table (bypass auth for guest users)
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: newUserId,
          phone: dto.customerPhone,
          email: `guest_${Date.now()}@kmerbeauty.guest`, // Placeholder email
          password: 'GUEST_USER_NO_PASSWORD', // Placeholder - not usable
          first_name: dto.customerName || 'Guest',
          last_name: '',
          role: 'CLIENT',
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ [BookingsService] Failed to create guest user:', insertError.message);
        throw new Error(`Failed to create guest user: ${insertError.message}`);
      }

      userId = insertedUser.id;
      console.log('✅ [BookingsService] Guest user created:', userId);
    }

    // 2. Calculate Prices & Details
    let total = 0;
    let duration = 0;
    const bookingItems = [];

    // Fetch service info
    if (dto.serviceIds && dto.serviceIds.length > 0) {
      for (const serviceId of dto.serviceIds) {
        // Try to find therapist specifics first
        let price = 0;
        let serviceDuration = 0;
        let serviceName = '';

        if (dto.therapistId) {
          const { data: ts } = await supabase
            .from('therapist_services')
            .select('price, duration, service:services(name_fr, base_price, duration)')
            .eq('therapist_id', dto.therapistId)
            .eq('service_id', serviceId)
            .single();

          if (ts) {
            price = ts.price || (ts.service as any).base_price;
            serviceDuration = ts.duration || (ts.service as any).duration;
            serviceName = (ts.service as any).name_fr;
          } else {
            // Fallback to base service
            const { data: s } = await supabase.from('services').select('name_fr, base_price, duration').eq('id', serviceId).single();
            if (s) {
              price = s.base_price;
              serviceDuration = s.duration;
              serviceName = s.name_fr;
            }
          }
        } else {
          // No therapist yet, use base prices
          const { data: s } = await supabase.from('services').select('name_fr, base_price, duration').eq('id', serviceId).single();
          if (s) {
            price = s.base_price;
            serviceDuration = s.duration;
            serviceName = s.name_fr;
          }
        }

        total += price;
        duration += serviceDuration;
        bookingItems.push({
          service_id: serviceId,
          service_name: serviceName,
          price: price,
          duration: serviceDuration
        });
      }
    }

    // 3. Create Booking Object
    const createBookingDto: CreateBookingDto = {
      user_id: userId,
      therapist_id: dto.therapistId, // Can be null
      salon_id: dto.salonId, // Can be null
      scheduled_at: dto.scheduledAt,
      duration: duration,
      location_type: 'HOME', // Default to HOME for agent usually? Or input?
      quarter: dto.quarter,
      city: dto.city,
      street: dto.street,
      subtotal: total,
      total: total, // Add travel fee if logic exists
      items: bookingItems,
      region: 'Centre', // Default or derive from city
      status: 'PENDING',
      notes: dto.notes, // Notes de réservation du client
    } as any; // Cast to avoid strict type issues with missing optional fields

    return this.create(createBookingDto);
  }

  async startBooking(id: string) {
    const supabase = this.supabaseService.getClient();

    console.log('✅ [BookingsService] Starting booking:', id);

    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'IN_PROGRESS',
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('❌ [BookingsService] Error starting booking:', error);
      throw new Error(`Failed to start booking: ${error.message}`);
    }

    console.log('✅ [BookingsService] Booking started successfully');
    return data;
  }
}

import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateBookingDto } from './bookings.controller';

@Injectable()
export class BookingsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createBookingDto: CreateBookingDto) {
    const supabase = this.supabaseService.getClient();

    // Créer le booking d'abord
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          user_id: createBookingDto.user_id,
          service_id: createBookingDto.service_id,
          provider_id: createBookingDto.provider_id,
          provider_type: createBookingDto.provider_type,
          scheduled_date: createBookingDto.scheduled_date,
          scheduled_time: createBookingDto.scheduled_time,
          price: createBookingDto.price,
          notes: createBookingDto.notes,
          status: 'pending',
        },
      ])
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create booking: ${error.message}`);
    }

    // Récupérer les infos du service séparément
    const { data: serviceData } = await supabase
      .from('services')
      .select('id, name_fr, name_en, duration, base_price, images')
      .eq('id', createBookingDto.service_id)
      .single();

    // Récupérer les infos du prestataire
    let providerData = null;
    if (createBookingDto.provider_type === 'therapist') {
      const { data: therapist } = await supabase
        .from('therapists')
        .select(
          `
          id,
          user:user_id (
            first_name,
            last_name,
            phone
          ),
          profile_image,
          city
        `,
        )
        .eq('id', createBookingDto.provider_id)
        .single();
      providerData = therapist;
    } else {
      const { data: salon } = await supabase
        .from('salons')
        .select(
          `
          id,
          name_fr,
          name_en,
          logo,
          city
        `,
        )
        .eq('id', createBookingDto.provider_id)
        .single();
      providerData = salon;
    }

    return {
      ...data,
      service: serviceData,
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

    // Pour chaque booking, récupérer les infos du service et du prestataire
    const bookingsWithProviders = await Promise.all(
      data.map(async (booking) => {
        // Récupérer le service
        const { data: serviceData } = await supabase
          .from('services')
          .select('id, name_fr, name_en, duration, base_price, images')
          .eq('id', booking.service_id)
          .single();
        let providerData = null;
        if (booking.provider_type === 'therapist') {
          const { data: therapist } = await supabase
            .from('therapists')
            .select(
              `
              id,
              user:user_id (
                first_name,
                last_name
              ),
              profile_image,
              city
            `,
            )
            .eq('id', booking.provider_id)
            .single();
          providerData = therapist;
        } else {
          const { data: salon } = await supabase
            .from('salons')
            .select(
              `
              id,
              name_fr,
              name_en,
              logo,
              city
            `,
            )
            .eq('id', booking.provider_id)
            .single();
          providerData = salon;
        }

        return {
          ...booking,
          service: serviceData,
          provider: providerData,
        };
      }),
    );

    return bookingsWithProviders;
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

    // Récupérer les infos du service séparément
    const { data: serviceData } = await supabase
      .from('services')
      .select(
        'id, name_fr, name_en, description_fr, description_en, duration, base_price, images, category',
      )
      .eq('id', data.service_id)
      .single();

    // Récupérer les infos du prestataire
    let providerData = null;
    if (data.provider_type === 'therapist') {
      const { data: therapist } = await supabase
        .from('therapists')
        .select(
          `
          id,
          user:user_id (
            first_name,
            last_name,
            phone,
            email
          ),
          profile_image,
          city,
          region,
          rating
        `,
        )
        .eq('id', data.provider_id)
        .single();
      providerData = therapist;
    } else {
      const { data: salon } = await supabase
        .from('salons')
        .select(
          `
          id,
          name_fr,
          name_en,
          logo,
          cover_image,
          city,
          region,
          rating,
          user:user_id (
            phone,
            email
          )
        `,
        )
        .eq('id', data.provider_id)
        .single();
      providerData = salon;
    }

    return {
      ...data,
      service: serviceData,
      provider: providerData,
    };
  }
}

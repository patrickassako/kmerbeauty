import { Injectable, OnModuleInit } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateContractorProfileDto,
  UpdateContractorProfileDto,
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  CreateBreakDto,
  CreateExceptionDto,
  CreateContractorServiceDto,
  UpdateContractorServiceDto,
  DashboardStatsDto,
} from './dto/contractor.dto';

@Injectable()
export class ContractorService implements OnModuleInit {
  constructor(private supabaseService: SupabaseService) {}

  async onModuleInit() {
    // Create contractor-files bucket if it doesn't exist
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      const supabase = this.supabaseService.getClient();

      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === 'contractor-files');

      if (!bucketExists) {
        // Create bucket
        const { data, error } = await supabase.storage.createBucket('contractor-files', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });

        if (error) {
          console.error('Failed to create contractor-files bucket:', error);
        } else {
          console.log('✅ Created contractor-files bucket');
        }
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
    }
  }

  // =====================================================
  // CONTRACTOR PROFILE
  // =====================================================

  async createProfile(dto: CreateContractorProfileDto) {
    const supabase = this.supabaseService.getClient();

    console.log('🆕 Creating new contractor profile');
    console.log('📦 DTO received:', JSON.stringify(dto, null, 2));

    // Force is_active to false for new profiles (requires admin validation)
    const profileData = {
      ...dto,
      is_active: false,
      is_verified: false,
    };

    const { data, error } = await supabase
      .from('contractor_profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating profile:', error);
      throw new Error(error.message);
    }

    console.log('✅ Profile created successfully:', data.id);

    // Also update user role
    await supabase
      .from('users')
      .update({ role: 'CONTRACTOR' })
      .eq('id', dto.user_id);

    // Sync to therapists table is now handled by PostgreSQL trigger
    // with SECURITY DEFINER to bypass RLS policies
    console.log('✅ Sync to therapists will be handled by trigger');

    return data;
  }

  async getProfile(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('contractor_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return data;
  }

  async getProfileById(contractorId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('contractor_profiles')
      .select(`
        *,
        user:users(id, full_name, email, phone, profile_picture, location)
      `)
      .eq('id', contractorId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateProfile(userId: string, dto: UpdateContractorProfileDto) {
    const supabase = this.supabaseService.getClient();

    console.log('🔄 Updating profile for user:', userId);
    console.log('📦 Profile data:', JSON.stringify(dto, null, 2));

    const { data, error } = await supabase
      .from('contractor_profiles')
      .update(dto)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating profile:', error);
      throw new Error(error.message);
    }

    console.log('✅ Profile updated successfully');

    // Sync to therapists table is now handled by PostgreSQL trigger
    // with SECURITY DEFINER to bypass RLS policies
    console.log('✅ Sync to therapists will be handled by trigger');

    return data;
  }

  private async syncToTherapists(contractorProfile: any) {
    const supabase = this.supabaseService.getClient();

    try {
      // Extract location from first service zone if available
      let latitude = 0;
      let longitude = 0;
      let city = 'Unknown';
      let region = 'Unknown';

      if (contractorProfile.service_zones && Array.isArray(contractorProfile.service_zones)) {
        const firstZone = contractorProfile.service_zones[0];
        if (typeof firstZone === 'string') {
          // If it's just a string (neighborhood name), use it as city
          city = firstZone;
          region = firstZone;
        } else if (firstZone?.location) {
          // If it's an object with location data
          latitude = firstZone.location.lat || 0;
          longitude = firstZone.location.lng || 0;
          city = firstZone.location.address || 'Unknown';
          region = firstZone.location.address || 'Unknown';
        }
      }

      // Calculate experience (years) from bio length (rough estimate)
      const experience = contractorProfile.professional_experience
        ? Math.max(1, Math.floor(contractorProfile.professional_experience.length / 100))
        : 1;

      // Check if therapist already exists
      const { data: existingTherapist } = await supabase
        .from('therapists')
        .select('id')
        .eq('user_id', contractorProfile.user_id)
        .single();

      const therapistData = {
        user_id: contractorProfile.user_id,
        bio_fr: contractorProfile.professional_experience || '',
        bio_en: contractorProfile.professional_experience || '',
        experience: experience,
        is_licensed: contractorProfile.qualifications_proof?.length > 0 || false,
        license_number: contractorProfile.siret_number || null,
        is_mobile: true,
        travel_radius: 20,
        travel_fee: 0,
        latitude: latitude,
        longitude: longitude,
        city: city,
        region: region,
        portfolio_images: contractorProfile.portfolio_images || [],
        profile_image: contractorProfile.profile_picture || null,
        is_active: contractorProfile.is_active ?? true,
        updated_at: new Date().toISOString(),
      };

      if (existingTherapist) {
        // Update existing therapist
        const { error } = await supabase
          .from('therapists')
          .update(therapistData)
          .eq('user_id', contractorProfile.user_id);

        if (error) {
          console.error('❌ Error updating therapist:', error);
          throw error;
        }
      } else {
        // Create new therapist with location geometry
        const { error } = await supabase
          .from('therapists')
          .insert({
            ...therapistData,
            location: `POINT(${longitude} ${latitude})`,
            created_at: new Date().toISOString(),
          });

        if (error) {
          console.error('❌ Error creating therapist:', error);
          throw error;
        }
      }

      console.log('✅ Therapist record synced for user:', contractorProfile.user_id);
    } catch (error) {
      console.error('❌ Error syncing to therapists table:', error);
      // Don't throw - we don't want to fail the contractor profile operation
      // if therapist sync fails
    }
  }

  async listContractors(filters?: {
    types_of_services?: string[];
    location?: { lat: number; lng: number; radius: number };
    is_verified?: boolean;
  }) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('contractor_profiles')
      .select(`
        *,
        user:users(id, full_name, email, phone, profile_picture, location)
      `)
      .eq('is_active', true);

    if (filters?.is_verified !== undefined) {
      query = query.eq('is_verified', filters.is_verified);
    }

    if (filters?.types_of_services && filters.types_of_services.length > 0) {
      query = query.overlaps('types_of_services', filters.types_of_services);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
  }

  async uploadFile(
    file: any,
    userId: string,
    fileType: string,
  ) {
    const supabase = this.supabaseService.getClient();

    // Generate a unique filename
    const timestamp = Date.now();
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}/${fileType}_${timestamp}.${fileExt}`;

    // Determine the bucket based on file type
    const bucket = 'contractor-files';

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return {
      url: publicUrl,
      fileName: fileName,
      fileType: fileType,
    };
  }

  // =====================================================
  // AVAILABILITY
  // =====================================================

  async setAvailability(dto: CreateAvailabilityDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('contractor_availability')
      .upsert(dto, { onConflict: 'contractor_id,day_of_week' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getAvailability(contractorId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('contractor_availability')
      .select('*')
      .eq('contractor_id', contractorId)
      .order('day_of_week', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }

  async updateAvailability(
    contractorId: string,
    dayOfWeek: number,
    dto: UpdateAvailabilityDto,
  ) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('contractor_availability')
      .update(dto)
      .eq('contractor_id', contractorId)
      .eq('day_of_week', dayOfWeek)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async resetAvailability(contractorId: string) {
    const supabase = this.supabaseService.getClient();

    // Delete all availability
    await supabase
      .from('contractor_availability')
      .delete()
      .eq('contractor_id', contractorId);

    // Create default 9-5 schedule
    const defaultSchedule = [];
    for (let day = 0; day < 7; day++) {
      if (day < 5) {
        // Monday to Friday
        defaultSchedule.push({
          contractor_id: contractorId,
          day_of_week: day,
          is_working: true,
          start_time: '09:00',
          end_time: '17:00',
        });
      } else {
        // Weekend
        defaultSchedule.push({
          contractor_id: contractorId,
          day_of_week: day,
          is_working: false,
        });
      }
    }

    const { data, error } = await supabase
      .from('contractor_availability')
      .insert(defaultSchedule)
      .select();

    if (error) throw new Error(error.message);
    return data;
  }

  // =====================================================
  // BREAKS
  // =====================================================

  async addBreak(dto: CreateBreakDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('contractor_breaks')
      .insert(dto)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getBreaks(contractorId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('contractor_breaks')
      .select('*')
      .eq('contractor_id', contractorId)
      .order('day_of_week', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteBreak(breakId: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('contractor_breaks')
      .delete()
      .eq('id', breakId);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  // =====================================================
  // EXCEPTIONS
  // =====================================================

  async addException(dto: CreateExceptionDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('contractor_exceptions')
      .upsert(dto, { onConflict: 'contractor_id,exception_date' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getExceptions(contractorId: string, startDate?: string, endDate?: string) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('contractor_exceptions')
      .select('*')
      .eq('contractor_id', contractorId);

    if (startDate) {
      query = query.gte('exception_date', startDate);
    }

    if (endDate) {
      query = query.lte('exception_date', endDate);
    }

    const { data, error } = await query.order('exception_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteException(exceptionId: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('contractor_exceptions')
      .delete()
      .eq('id', exceptionId);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  // =====================================================
  // CONTRACTOR SERVICES
  // =====================================================

  async addService(dto: CreateContractorServiceDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('contractor_services')
      .insert(dto)
      .select(`
        *,
        service:services(*)
      `)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getServices(contractorId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('contractor_services')
      .select(`
        *,
        service:services(*)
      `)
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  async updateService(serviceId: string, dto: UpdateContractorServiceDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('contractor_services')
      .update(dto)
      .eq('id', serviceId)
      .select(`
        *,
        service:services(*)
      `)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteService(serviceId: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('contractor_services')
      .delete()
      .eq('id', serviceId);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  // =====================================================
  // DASHBOARD & STATS
  // =====================================================

  async getDashboardStats(
    contractorId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<DashboardStatsDto> {
    const supabase = this.supabaseService.getClient();

    console.log('📊 Getting dashboard stats for contractor:', contractorId);
    console.log('   Start date:', startDate);
    console.log('   End date:', endDate);

    // Get basic stats from function
    const { data: statsArray, error: statsError } = await supabase
      .rpc('get_contractor_dashboard_stats', {
        p_contractor_id: contractorId,
        p_start_date: startDate || null,
        p_end_date: endDate || null,
      });

    if (statsError) {
      console.error('❌ Error getting dashboard stats:', statsError);
      throw new Error(statsError.message);
    }

    console.log('📦 Stats data received:', JSON.stringify(statsArray, null, 2));

    if (!statsArray || statsArray.length === 0) {
      throw new Error('No stats data returned');
    }

    // RPC returns a TABLE, so we get the first row
    const stats = statsArray[0];

    // Type the stats response
    const typedStats = stats as {
      total_income: string;
      total_proposals: string;
      completed_bookings: string;
      total_clients: string;
      upcoming_appointments: string;
    };

    // Get earnings chart data (safely, return empty if table doesn't exist)
    let earnings: any[] = [];
    try {
      const { data: earningsData, error: earningsError } = await supabase
        .from('contractor_earnings')
        .select('created_at, net_amount')
        .eq('contractor_id', contractorId)
        .eq('payment_status', 'PAID')
        .gte('created_at', startDate || '2000-01-01')
        .lte('created_at', endDate || '2100-01-01')
        .order('created_at', { ascending: true });

      if (earningsError && !earningsError.message.includes('does not exist')) {
        console.error('⚠️  Error fetching earnings chart:', earningsError.message);
      } else if (earningsData) {
        earnings = earningsData;
      }
    } catch (e) {
      console.log('⚠️  Earnings table not available, using empty data');
    }

    // Get bookings chart data (safely, return empty if table doesn't exist)
    let bookings: any[] = [];
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('scheduled_at, status')
        .eq('contractor_id', contractorId)
        .eq('status', 'COMPLETED')
        .gte('scheduled_at', startDate || '2000-01-01')
        .lte('scheduled_at', endDate || '2100-01-01')
        .order('scheduled_at', { ascending: true });

      if (bookingsError && !bookingsError.message.includes('does not exist')) {
        console.error('⚠️  Error fetching bookings chart:', bookingsError.message);
      } else if (bookingsData) {
        bookings = bookingsData;
      }
    } catch (e) {
      console.log('⚠️  Bookings table not available, using empty data');
    }

    // Process chart data
    const earningsChart = this.aggregateDataByDate(earnings, 'net_amount');
    const bookingsChart = this.aggregateDataByDate(bookings, 'count');

    return {
      total_income: parseFloat(typedStats.total_income || '0'),
      total_proposals: parseInt(typedStats.total_proposals || '0'),
      completed_bookings: parseInt(typedStats.completed_bookings || '0'),
      total_clients: parseInt(typedStats.total_clients || '0'),
      upcoming_appointments: parseInt(typedStats.upcoming_appointments || '0'),
      earnings_chart: earningsChart,
      bookings_chart: bookingsChart,
    };
  }

  async getUpcomingAppointments(contractorId: string, dayFilter?: string) {
    const supabase = this.supabaseService.getClient();

    console.log('📅 Getting upcoming appointments for contractor:', contractorId);

    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          user:users(id, full_name, email, phone, profile_picture),
          service:services(id, name_fr, name_en, category)
        `)
        .eq('contractor_id', contractorId)
        .eq('status', 'CONFIRMED')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });

      if (dayFilter) {
        // Filter by day of week
        // This would need to be done client-side or with a more complex query
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error getting appointments:', error);
        // Return empty array if table doesn't exist yet
        if (error.message.includes('relationship') || error.message.includes('schema cache')) {
          console.log('⚠️  Bookings table not ready yet, returning empty array');
          return [];
        }
        throw new Error(error.message);
      }

      console.log('✅ Found', data?.length || 0, 'upcoming appointments');
      return data || [];
    } catch (error) {
      console.error('❌ Exception in getUpcomingAppointments:', error);
      // Return empty array instead of throwing for schema errors
      return [];
    }
  }

  async getEarnings(contractorId: string, startDate?: string, endDate?: string) {
    const supabase = this.supabaseService.getClient();

    console.log('💰 Getting earnings for contractor:', contractorId);

    try {
      let query = supabase
        .from('contractor_earnings')
        .select(`
          *,
          booking:bookings(
            scheduled_at,
            service:services(name)
          )
        `)
        .eq('contractor_id', contractorId)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error getting earnings:', error);
        // Return empty array if table doesn't exist yet
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log('⚠️  Earnings table not ready yet, returning empty array');
          return [];
        }
        throw new Error(error.message);
      }

      console.log('✅ Found', data?.length || 0, 'earnings records');
      return data || [];
    } catch (error) {
      console.error('❌ Exception in getEarnings:', error);
      return [];
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private aggregateDataByDate(
    data: any[],
    field: 'net_amount',
  ): Array<{ date: string; amount: number }>;
  private aggregateDataByDate(
    data: any[],
    field: 'count',
  ): Array<{ date: string; count: number }>;
  private aggregateDataByDate(
    data: any[],
    field: 'net_amount' | 'count',
  ): Array<{ date: string; amount: number } | { date: string; count: number }> {
    const aggregated: Record<string, number> = {};

    data.forEach((item) => {
      const dateKey =
        field === 'net_amount'
          ? item.created_at?.split('T')[0]
          : item.scheduled_at?.split('T')[0];

      if (!dateKey) return;

      if (!aggregated[dateKey]) {
        aggregated[dateKey] = 0;
      }

      if (field === 'net_amount') {
        aggregated[dateKey] += parseFloat(item.net_amount || 0);
      } else {
        aggregated[dateKey] += 1;
      }
    });

    return Object.entries(aggregated).map(([date, value]) => {
      if (field === 'net_amount') {
        return { date, amount: value };
      } else {
        return { date, count: value };
      }
    });
  }

  async checkAvailability(
    contractorId: string,
    dateTime: string,
    duration: number,
  ): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.rpc('check_contractor_availability', {
      p_contractor_id: contractorId,
      p_date_time: dateTime,
      p_duration: duration,
    });

    if (error) throw new Error(error.message);
    return data;
  }
}

import { Injectable } from '@nestjs/common';
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
export class ContractorService {
  constructor(private supabaseService: SupabaseService) {}

  // =====================================================
  // CONTRACTOR PROFILE
  // =====================================================

  async createProfile(dto: CreateContractorProfileDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('contractor_profiles')
      .insert(dto)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Also update user role
    await supabase
      .from('users')
      .update({ role: 'CONTRACTOR' })
      .eq('id', dto.user_id);

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

    const { data, error } = await supabase
      .from('contractor_profiles')
      .update(dto)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
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
        service:services(
          *,
          category:categories(*)
        )
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

    // Get basic stats from function
    const { data: stats, error: statsError } = await supabase
      .rpc('get_contractor_dashboard_stats', {
        p_contractor_id: contractorId,
        p_start_date: startDate || null,
        p_end_date: endDate || null,
      })
      .single();

    if (statsError) throw new Error(statsError.message);

    // Type the stats response
    const typedStats = stats as {
      total_income: string;
      total_proposals: string;
      completed_bookings: string;
      total_clients: string;
      upcoming_appointments: string;
    };

    // Get earnings chart data
    const { data: earnings, error: earningsError } = await supabase
      .from('contractor_earnings')
      .select('created_at, net_amount')
      .eq('contractor_id', contractorId)
      .eq('payment_status', 'PAID')
      .gte('created_at', startDate || '2000-01-01')
      .lte('created_at', endDate || '2100-01-01')
      .order('created_at', { ascending: true });

    if (earningsError) throw new Error(earningsError.message);

    // Get bookings chart data
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('scheduled_at, status')
      .eq('contractor_id', contractorId)
      .eq('status', 'COMPLETED')
      .gte('scheduled_at', startDate || '2000-01-01')
      .lte('scheduled_at', endDate || '2100-01-01')
      .order('scheduled_at', { ascending: true });

    if (bookingsError) throw new Error(bookingsError.message);

    // Process chart data
    const earningsChart = this.aggregateDataByDate(earnings || [], 'net_amount');
    const bookingsChart = this.aggregateDataByDate(bookings || [], 'count');

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

    let query = supabase
      .from('bookings')
      .select(`
        *,
        user:users(id, full_name, email, phone, profile_picture),
        service:services(name, category:categories(name))
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

    if (error) throw new Error(error.message);
    return data;
  }

  async getEarnings(contractorId: string, startDate?: string, endDate?: string) {
    const supabase = this.supabaseService.getClient();

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

    if (error) throw new Error(error.message);
    return data;
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

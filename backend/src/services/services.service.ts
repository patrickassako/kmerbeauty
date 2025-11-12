import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ServicesService {
  constructor(private readonly supabaseService: SupabaseService) {}

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

    return data;
  }
}

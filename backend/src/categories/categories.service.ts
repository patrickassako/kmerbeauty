import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('category_translations')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data;
  }
}

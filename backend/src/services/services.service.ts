import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ServicesService {
  constructor(private readonly supabaseService: SupabaseService) { }

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

    // provider_count is now denormalized and auto-maintained by triggers
    // No need for N+1 queries - just return the data directly
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

    // No need for additional COUNT queries
    return data;
  }

  async findNearbyProviders(
    serviceId: string | null,
    lat: number,
    lng: number,
    radius: number = 50000,
    city?: string,
    district?: string,
  ) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.rpc('get_nearby_providers', {
      lat,
      lng,
      radius_meters: radius,
      client_city: city,
      client_district: district,
      filter_service_id: serviceId,
    });

    if (error) {
      throw new Error(`Failed to fetch nearby providers: ${error.message}`);
    }

    return data;
  }

  /**
   * Fuzzy search for services based on query term
   * Handles synonyms, partial matches, and common variations
   */
  async search(query: string) {
    const supabase = this.supabaseService.getClient();

    // Normalize query
    const normalizedQuery = query.toLowerCase().trim();

    // Synonym mapping: common terms -> category or service keywords
    const synonymMap: Record<string, { keywords: string[], category?: string }> = {
      // Coiffure / Hair
      'coiffure': { keywords: ['coiffure', 'coupe', 'cheveux', 'hair'], category: 'HAIRDRESSING' },
      'coupe': { keywords: ['coupe', 'coiffure', 'cheveux'], category: 'HAIRDRESSING' },
      'cheveux': { keywords: ['cheveux', 'coiffure', 'coupe', 'brushing'], category: 'HAIRDRESSING' },
      'hair': { keywords: ['hair', 'coiffure', 'haircut'], category: 'HAIRDRESSING' },
      'tresse': { keywords: ['tresse', 'braids', 'coiffure'], category: 'HAIRDRESSING' },
      'braids': { keywords: ['tresse', 'braids'], category: 'HAIRDRESSING' },
      'brushing': { keywords: ['brushing', 'coiffure'], category: 'HAIRDRESSING' },
      'lissage': { keywords: ['lissage', 'cheveux'], category: 'HAIRDRESSING' },

      // Massage
      'massage': { keywords: ['massage', 'relaxation', 'détente', 'bien-être'], category: 'WELLNESS_MASSAGE' },
      'relaxation': { keywords: ['massage', 'relaxation', 'spa'], category: 'WELLNESS_MASSAGE' },
      'détente': { keywords: ['massage', 'détente', 'relaxation'], category: 'WELLNESS_MASSAGE' },
      'spa': { keywords: ['spa', 'massage', 'wellness'], category: 'WELLNESS_MASSAGE' },

      // Nails
      'ongles': { keywords: ['ongles', 'manucure', 'pédicure', 'nail'], category: 'NAIL_CARE' },
      'manucure': { keywords: ['manucure', 'ongles', 'nail'], category: 'NAIL_CARE' },
      'pédicure': { keywords: ['pédicure', 'ongles', 'pedicure'], category: 'NAIL_CARE' },
      'nail': { keywords: ['nail', 'ongles', 'manucure'], category: 'NAIL_CARE' },
      'vernis': { keywords: ['vernis', 'ongles', 'manucure'], category: 'NAIL_CARE' },

      // Makeup
      'maquillage': { keywords: ['maquillage', 'makeup', 'beauté'], category: 'MAKEUP' },
      'makeup': { keywords: ['makeup', 'maquillage'], category: 'MAKEUP' },

      // Facial
      'visage': { keywords: ['visage', 'facial', 'soin'], category: 'FACIAL' },
      'facial': { keywords: ['facial', 'visage', 'soin'], category: 'FACIAL' },
      'soin': { keywords: ['soin', 'facial', 'visage'], category: 'FACIAL' },
      'gommage': { keywords: ['gommage', 'facial', 'visage'], category: 'FACIAL' },

      // Waxing / Epilation
      'épilation': { keywords: ['épilation', 'waxing', 'cire'], category: 'WAXING' },
      'waxing': { keywords: ['waxing', 'épilation'], category: 'WAXING' },
      'cire': { keywords: ['cire', 'épilation', 'waxing'], category: 'WAXING' },

      // Barber
      'barbe': { keywords: ['barbe', 'barbier', 'beard'], category: 'BARBER' },
      'barbier': { keywords: ['barbier', 'barbe', 'barber'], category: 'BARBER' },
      'barber': { keywords: ['barber', 'barbier', 'barbe'], category: 'BARBER' },
      'rasage': { keywords: ['rasage', 'barbe', 'barbier'], category: 'BARBER' },

      // Eyes
      'yeux': { keywords: ['yeux', 'sourcils', 'cils'], category: 'EYE_CARE' },
      'sourcils': { keywords: ['sourcils', 'yeux', 'eyebrows'], category: 'EYE_CARE' },
      'cils': { keywords: ['cils', 'yeux', 'lashes'], category: 'EYE_CARE' },
      'lashes': { keywords: ['lashes', 'cils'], category: 'EYE_CARE' },
    };

    // Check if query matches a synonym
    let searchTerms: string[] = [normalizedQuery];
    let categoryFilter: string | null = null;

    if (synonymMap[normalizedQuery]) {
      searchTerms = synonymMap[normalizedQuery].keywords;
      categoryFilter = synonymMap[normalizedQuery].category || null;
    }

    // Build OR conditions for ILIKE search
    let { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search services: ${error.message}`);
    }

    // Filter results with fuzzy matching
    const results = (data || []).filter(service => {
      const nameFr = (service.name_fr || '').toLowerCase();
      const nameEn = (service.name_en || '').toLowerCase();
      const descFr = (service.description_fr || '').toLowerCase();
      const descEn = (service.description_en || '').toLowerCase();
      const category = (service.category || '').toLowerCase();

      // Check if any search term matches
      for (const term of searchTerms) {
        if (
          nameFr.includes(term) ||
          nameEn.includes(term) ||
          descFr.includes(term) ||
          descEn.includes(term) ||
          category.toLowerCase().includes(term)
        ) {
          return true;
        }
      }

      // Check category match
      if (categoryFilter && service.category === categoryFilter) {
        return true;
      }

      return false;
    });

    // Sort by relevance (exact name match first)
    results.sort((a, b) => {
      const aNameMatch = (a.name_fr || '').toLowerCase().includes(normalizedQuery) ? 1 : 0;
      const bNameMatch = (b.name_fr || '').toLowerCase().includes(normalizedQuery) ? 1 : 0;
      return bNameMatch - aNameMatch;
    });

    return results;
  }
}

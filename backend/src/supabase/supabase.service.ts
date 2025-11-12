import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabaseClient: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Service Role Key must be provided');
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  getClient(): SupabaseClient {
    return this.supabaseClient;
  }

  // Méthodes helper pour les opérations courantes
  get auth() {
    return this.supabaseClient.auth;
  }

  get storage() {
    return this.supabaseClient.storage;
  }

  // Accès direct aux tables
  from(table: string) {
    return this.supabaseClient.from(table);
  }

  // Pour les requêtes RPC (fonctions PostgreSQL)
  rpc(fn: string, params?: object) {
    return this.supabaseClient.rpc(fn, params);
  }
}

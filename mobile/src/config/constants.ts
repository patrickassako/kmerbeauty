// Configuration API
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Configuration Supabase
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Pays et devise
export const DEFAULT_COUNTRY = process.env.EXPO_PUBLIC_DEFAULT_COUNTRY || 'CM';
export const DEFAULT_CURRENCY = process.env.EXPO_PUBLIC_DEFAULT_CURRENCY || 'XAF';
export const DEFAULT_LANGUAGE = process.env.EXPO_PUBLIC_DEFAULT_LANGUAGE || 'fr';
export const DEFAULT_CITY = process.env.EXPO_PUBLIC_DEFAULT_CITY || 'Douala';

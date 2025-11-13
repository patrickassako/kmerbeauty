// ============================================
// Types de base de données pour KmerServices
// ============================================

export type UserRole = 'CLIENT' | 'PROVIDER' | 'ADMIN';
export type Language = 'FRENCH' | 'ENGLISH';
export type LocationType = 'HOME' | 'SALON';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type PaymentMethod = 'ORANGE_MONEY' | 'MTN_MOBILE_MONEY' | 'CARD' | 'CASH';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
export type MessageType = 'TEXT' | 'IMAGE' | 'SERVICE_SUGGESTION' | 'SYSTEM';
export type GiftCardStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';

export type Category =
  | 'HAIRDRESSING'
  | 'EYE_CARE'
  | 'WELLNESS_MASSAGE'
  | 'FACIAL'
  | 'NAIL_CARE'
  | 'MAKEUP'
  | 'WAXING'
  | 'BARBER'
  | 'OTHER';

// ============================================
// User
// ============================================

export interface User {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  role: UserRole;
  language: Language;
  city?: string;
  region?: string;
  balance?: number; // Pour les prestataires
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// Service (Catalogue global)
// ============================================

export interface Service {
  id: string;
  name_fr: string;
  name_en: string;
  description_fr?: string;
  description_en?: string;
  category: Category;
  images?: string[];
  components?: any; // JSON
  purpose_fr?: string;
  purpose_en?: string;
  ideal_for_fr?: string;
  ideal_for_en?: string;
  duration: number; // en minutes
  base_price: number; // XAF
  priority: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Service Package
// ============================================

export interface ServicePackage {
  id: string;
  name_fr: string;
  name_en: string;
  description_fr?: string;
  description_en?: string;
  category: Category;
  images?: string[];
  base_price: number; // XAF
  base_duration: number; // Minutes
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PackageService {
  id: string;
  package_id: string;
  service_id: string;
  sequence: number;
  created_at: string;
}

// ============================================
// Therapist (Prestataire indépendant)
// ============================================

export interface Therapist {
  id: string;
  user_id: string;
  profile_image?: string;
  bio_fr?: string;
  bio_en?: string;
  experience: number; // Années
  is_licensed: boolean;
  license_number?: string;
  is_mobile: boolean;
  travel_radius: number; // km
  travel_fee: number; // XAF
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  portfolio_images?: string[];
  salon_id?: string;
  rating: number;
  review_count: number;
  booking_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Service-specific fields (when filtered by serviceId)
  service_price?: number;
  service_duration?: number;

  // Relations
  user?: User;
  services?: TherapistService[];
  packages?: TherapistPackage[];
  gallery?: ProviderGallery[];
  work_zones?: WorkZone[];
  salon?: Salon;
}

export interface TherapistService {
  id: string;
  therapist_id: string;
  service_id: string;
  price?: number; // Prix personnalisé (XAF)
  duration?: number; // Durée personnalisée
  is_active: boolean;

  // Relations
  service?: Service;
}

export interface TherapistPackage {
  id: string;
  therapist_id: string;
  package_id: string;
  price?: number; // Prix personnalisé (XAF)
  duration?: number; // Durée personnalisée
  is_active: boolean;
  created_at: string;

  // Relations
  package?: ServicePackage;
}

// ============================================
// Salon (Institut)
// ============================================

export interface Salon {
  id: string;
  user_id: string;
  name_fr: string;
  name_en: string;
  description_fr?: string;
  description_en?: string;
  quarter: string;
  street?: string;
  landmark: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  logo?: string;
  cover_image?: string;
  ambiance_images?: string[];
  established_year?: number;
  features?: any; // JSON
  opening_hours?: any; // JSON
  rating: number;
  review_count: number;
  service_count: number;
  years_experience?: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;

  // Service-specific fields (when filtered by serviceId)
  service_price?: number;
  service_duration?: number;

  // Relations
  user?: User;
  services?: SalonService[];
  packages?: SalonPackage[];
  gallery?: ProviderGallery[];
}

export interface SalonService {
  id: string;
  salon_id: string;
  service_id: string;
  price?: number; // Prix personnalisé (XAF)
  duration?: number; // Durée personnalisée
  is_active: boolean;

  // Relations
  service?: Service;
}

export interface SalonPackage {
  id: string;
  salon_id: string;
  package_id: string;
  price?: number; // Prix personnalisé (XAF)
  duration?: number; // Durée personnalisée
  is_active: boolean;
  created_at: string;

  // Relations
  package?: ServicePackage;
}

// ============================================
// Provider Gallery
// ============================================

export interface ProviderGallery {
  id: string;
  therapist_id?: string;
  salon_id?: string;
  image_url: string;
  caption_fr?: string;
  caption_en?: string;
  service_id?: string;
  display_order: number;
  created_at: string;

  // Relations
  service?: Service;
}

// ============================================
// Work Zones (Zones de travail)
// ============================================

export interface WorkZone {
  id: string;
  therapist_id: string;
  quarter?: string;
  city: string;
  region: string;
  is_active: boolean;
  created_at: string;
}

// ============================================
// Booking
// ============================================

export interface Booking {
  id: string;
  user_id: string;
  therapist_id?: string;
  salon_id?: string;
  scheduled_at: string;
  duration: number;
  location_type: LocationType;
  quarter?: string;
  street?: string;
  landmark?: string;
  city: string;
  region: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
  subtotal: number;
  travel_fee: number;
  tip: number;
  total: number;
  status: BookingStatus;
  cancelled_at?: string;
  cancel_reason?: string;
  created_at: string;
  updated_at: string;

  // Relations
  user?: User;
  therapist?: Therapist;
  salon?: Salon;
  items?: BookingItem[];
  payment?: Payment;
}

export interface BookingItem {
  id: string;
  booking_id: string;
  service_name: string;
  price: number;
  duration: number;
  created_at: string;
}

// ============================================
// Payment
// ============================================

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  flutterwave_id?: string;
  flutterwave_tx_ref?: string;
  mobile_number?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

// ============================================
// Chat
// ============================================

export interface Chat {
  id: string;
  booking_id?: string; // Peut être null si chat avant commande
  client_id: string;
  provider_id: string;
  last_message?: string;
  last_message_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  client?: User;
  provider?: User;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: MessageType;
  attachments?: string[];
  is_read: boolean;
  read_at?: string;
  created_at: string;

  // Relations
  sender?: User;
}

// ============================================
// Provider Contact Unlock
// ============================================

export interface ProviderContactUnlock {
  id: string;
  client_id: string;
  provider_id: string;
  booking_id: string;
  unlocked_at: string;
}

// ============================================
// Gift Card
// ============================================

export interface GiftCard {
  id: string;
  code: string;
  value: number; // XAF
  title_fr: string;
  title_en: string;
  description_fr?: string;
  description_en?: string;
  applicable_categories?: Category[];
  min_order_amount?: number;
  valid_from: string;
  valid_until: string;
  status: GiftCardStatus;
  owner_id?: string;
  purchaser_id?: string;
  used_booking_id?: string;
  used_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Review
// ============================================

export interface Review {
  id: string;
  user_id: string;
  therapist_id?: string;
  salon_id?: string;
  rating: number;
  comment?: string;
  cleanliness?: number;
  professionalism?: number;
  value?: number;
  created_at: string;
  updated_at: string;

  // Relations
  user?: User;
}

// ============================================
// Types utilitaires
// ============================================

// Résultat de recherche avec distance
export interface ServiceWithProviders extends Service {
  providers: Array<{
    type: 'therapist' | 'salon';
    id: string;
    name: string;
    rating: number;
    review_count: number;
    price: number;
    duration: number;
    distance?: number; // en km
    city: string;
    region: string;
  }>;
}

export interface PackageWithProviders extends ServicePackage {
  services: Service[];
  providers: Array<{
    type: 'therapist' | 'salon';
    id: string;
    name: string;
    rating: number;
    review_count: number;
    price: number;
    duration: number;
    distance?: number; // en km
    city: string;
    region: string;
  }>;
}

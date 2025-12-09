
// Core Data Models
export interface Service {
    id: string;
    name_fr: string;
    name_en: string;
    description_fr?: string;
    description_en?: string;
    category: string;
    images: string[];
    duration: number;
    base_price: number;
    purpose_fr?: string;
    purpose_en?: string;
    ideal_for_fr?: string;
    ideal_for_en?: string;
    provider_count?: number;
    components?: string[];
    created_at: string;
    updated_at: string;
}

export interface Therapist {
    id: string;
    user_id: string;
    bio_fr?: string;
    bio_en?: string;
    experience: number;
    is_licensed: boolean;
    license_number?: string;
    is_mobile: boolean;
    travel_radius: number;
    travel_fee: number;
    latitude: number;
    longitude: number;
    city: string;
    region: string;
    portfolio_images: string[];
    salon_id?: string;
    rating: number;
    review_count: number;
    booking_count: number;
    is_active: boolean;
    user?: {
        id: string;
        first_name: string;
        last_name: string;
        avatar?: string;
        phone: string;
        email?: string;
    };
    salon?: {
        id: string;
        name_fr: string;
        name_en: string;
        quarter?: string;
        city?: string;
    };
    education?: Array<{
        id: string;
        title: string;
        institution?: string;
        year?: number;
    }>;
}

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
    ambiance_images: string[];
    established_year?: number;
    features?: any;
    opening_hours?: any;
    rating: number;
    review_count: number;
    service_count: number;
    is_active: boolean;
    is_verified: boolean;
    user?: {
        id: string;
        first_name: string;
        last_name: string;
        phone: string;
        email?: string;
    };
}

export interface TherapistService {
    service_id: string;
    therapist_id: string;
    price: number;
    duration: number;
    is_active: boolean;
    service: Service;
}

export interface SalonService {
    service_id: string;
    salon_id: string;
    price: number;
    duration: number;
    is_active: boolean;
    service: Service;
}

// Categories
export interface CategoryTranslation {
    category: string;
    name_fr: string;
    name_en: string;
    description_fr?: string;
    description_en?: string;
}

// Bookings
export interface BookingItem {
    id?: string;
    booking_id?: string;
    service_id: string;
    service_name: string;
    price: number;
    duration: number;
    created_at?: string;
    service_image?: string; // Première image du service récupérée par le backend
    service?: {
        id: string;
        images: string[];
    };
}

export interface Booking {
    id: string;
    user_id: string;
    therapist_id?: string;
    salon_id?: string;
    scheduled_at: string;
    duration: number;
    location_type: 'HOME' | 'SALON';
    quarter?: string;
    street?: string;
    landmark?: string;
    city: string;
    region: string;
    latitude?: number;
    longitude?: number;
    instructions?: string;
    subtotal: number;
    travel_fee?: number;
    tip?: number;
    total: number;
    status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
    cancelled_at?: string;
    cancel_reason?: string;
    created_at: string;
    updated_at: string;
    items?: BookingItem[];
    provider?: any;
    client?: {
        id: string;
        first_name: string;
        last_name: string;
        email?: string;
        phone?: string;
        avatar?: string;
    };
}

export interface CreateBookingDto {
    user_id: string;
    therapist_id?: string;
    salon_id?: string;
    scheduled_at: string;
    duration: number;
    location_type: 'HOME' | 'SALON';
    quarter?: string;
    street?: string;
    landmark?: string;
    city: string;
    region: string;
    latitude?: number;
    longitude?: number;
    instructions?: string;
    subtotal: number;
    travel_fee?: number;
    tip?: number;
    total: number;
    notes?: string;
    items: BookingItem[];
}

// Chat
export interface ChatMessage {
    id: string;
    chat_id: string;
    sender_id: string;
    content: string;
    type: 'TEXT' | 'IMAGE' | 'VOICE' | 'SERVICE_SUGGESTION' | 'SYSTEM';
    attachments?: string[];
    reply_to_message_id?: string;
    duration_seconds?: number; // Pour les messages vocaux
    offer_data?: {
        service_name: string;
        description?: string;
        price: number;
        duration: number;
        custom_fields?: Record<string, any>;
    };
    is_read: boolean;
    read_at?: string;
    created_at: string;
}

export interface Chat {
    id: string;
    booking_id: string;
    client_id: string;
    provider_id: string;
    last_message?: string;
    last_message_at?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    unread_count?: number;
    client?: {
        id: string;
        first_name?: string;
        last_name?: string;
        email?: string;
        avatar?: string;
    };
    provider?: {
        id: string;
        first_name?: string;
        last_name?: string;
        email?: string;
        avatar?: string;
    };
    other_user?: {
        id: string;
        first_name?: string;
        last_name?: string;
        email?: string;
        avatar?: string;
    };
    other_user_type?: 'client' | 'provider';
}

export interface SendMessageDto {
    sender_id: string;
    content: string;
    type?: 'TEXT' | 'IMAGE' | 'VOICE' | 'SERVICE_SUGGESTION' | 'SYSTEM';
    attachments?: string[];
    reply_to_message_id?: string;
    duration_seconds?: number;
    offer_data?: {
        service_name: string;
        description?: string;
        price: number;
        duration: number;
        custom_fields?: Record<string, any>;
    };
}

export interface ChatOffer {
    id: string;
    message_id: string;
    chat_id: string;
    service_name: string;
    description?: string;
    price: number;
    duration: number;
    custom_fields?: Record<string, any>;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
    booking_id?: string;
    expires_at?: string;
    client_response?: string;
    responded_at?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateOfferDto {
    chat_id: string;
    sender_id: string;
    service_name: string;
    description?: string;
    price: number;
    duration: number;
    custom_fields?: Record<string, any>;
    expires_in_hours?: number;
}

// Reviews
export interface Review {
    id: string;
    rating: number;
    comment?: string;
    cleanliness?: number;
    professionalism?: number;
    value?: number;
    created_at: string;
    user: {
        id: string;
        first_name: string;
        last_name: string;
        avatar?: string;
    };
}

export interface CreateReviewDto {
    user_id: string;
    therapist_id?: string;
    salon_id?: string;
    rating: number;
    comment?: string;
    cleanliness?: number;
    professionalism?: number;
    value?: number;
}

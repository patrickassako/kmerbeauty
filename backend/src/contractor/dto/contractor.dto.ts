export interface ServiceZone {
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  radius: number; // in kilometers
}

export interface IdCardUrls {
  front?: string;
  back?: string;
}

export class CreateContractorProfileDto {
  user_id: string;
  business_name?: string;
  siret_number?: string;
  legal_status?: string;
  qualifications_proof?: string[];
  professional_experience?: string;
  types_of_services?: string[];
  id_card_url?: string | IdCardUrls;  // Support both string and object
  insurance_url?: string;
  training_certificates?: string[];
  portfolio_images?: string[];
  confidentiality_accepted?: boolean;
  terms_accepted?: boolean;
  languages_spoken?: string[];
  available_transportation?: string[];
  service_zones?: ServiceZone[] | string[];  // Support both formats
}

export class UpdateContractorProfileDto {
  business_name?: string;
  siret_number?: string;
  legal_status?: string;
  qualifications_proof?: string[];
  professional_experience?: string;
  types_of_services?: string[];
  id_card_url?: string | IdCardUrls;  // Support both string and object
  insurance_url?: string;
  training_certificates?: string[];
  portfolio_images?: string[];
  confidentiality_accepted?: boolean;
  terms_accepted?: boolean;
  languages_spoken?: string[];
  available_transportation?: string[];
  service_zones?: ServiceZone[] | string[];  // Support both formats
  profile_completed?: boolean;
}

export class CreateAvailabilityDto {
  contractor_id: string;
  day_of_week: number; // 0-6
  is_working: boolean;
  start_time?: string; // HH:MM format
  end_time?: string;
}

export class UpdateAvailabilityDto {
  is_working?: boolean;
  start_time?: string;
  end_time?: string;
}

export class CreateBreakDto {
  contractor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export class CreateExceptionDto {
  contractor_id: string;
  exception_date: string; // YYYY-MM-DD
  is_available: boolean;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

export class CreateContractorServiceDto {
  contractor_id: string;
  service_id: string;
  price: number;
  duration: number; // minutes
  description?: string;
}

export class UpdateContractorServiceDto {
  price?: number;
  duration?: number;
  description?: string;
  is_active?: boolean;
}

export interface DashboardStatsDto {
  total_income: number;
  total_proposals: number;
  completed_bookings: number;
  total_clients: number;
  upcoming_appointments: number;
  earnings_chart?: Array<{
    date: string;
    amount: number;
  }>;
  bookings_chart?: Array<{
    date: string;
    count: number;
  }>;
  clients_chart?: Array<{
    date: string;
    count: number;
  }>;
}

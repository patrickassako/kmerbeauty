export interface ProposalLocation {
  address: string;
  lat: number;
  lng: number;
}

export class CreateProposalDto {
  client_id: string;
  contractor_id: string;
  service_name: string;
  description?: string;
  requested_date?: string; // ISO date string
  location?: ProposalLocation;
  proposed_price?: number;
  estimated_duration?: number; // minutes
  expires_at?: string; // ISO date string, default 48h
}

export class UpdateProposalDto {
  status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';
  contractor_response?: string;
  proposed_price?: number;
  estimated_duration?: number;
}

export class RespondToProposalDto {
  status: 'ACCEPTED' | 'DECLINED';
  contractor_response?: string;
  proposed_price?: number; // Counter offer
  estimated_duration?: number;
}

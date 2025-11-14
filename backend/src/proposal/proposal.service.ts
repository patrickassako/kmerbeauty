import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateProposalDto,
  UpdateProposalDto,
  RespondToProposalDto,
} from './dto/proposal.dto';

@Injectable()
export class ProposalService {
  constructor(private supabaseService: SupabaseService) {}

  async createProposal(dto: CreateProposalDto) {
    const supabase = this.supabaseService.getClient();

    // Set default expiration to 48 hours if not provided
    if (!dto.expires_at) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);
      dto.expires_at = expiresAt.toISOString();
    }

    const { data, error } = await supabase
      .from('proposals')
      .insert(dto)
      .select(`
        *,
        client:users!proposals_client_id_fkey(id, full_name, email, profile_picture),
        contractor:contractor_profiles(
          *,
          user:users(id, full_name, email, profile_picture)
        )
      `)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getProposal(proposalId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        client:users!proposals_client_id_fkey(id, full_name, email, profile_picture),
        contractor:contractor_profiles(
          *,
          user:users(id, full_name, email, profile_picture)
        )
      `)
      .eq('id', proposalId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getProposalsForClient(clientId: string, status?: string) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('proposals')
      .select(`
        *,
        contractor:contractor_profiles(
          *,
          user:users(id, full_name, email, profile_picture)
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
  }

  async getProposalsForContractor(contractorId: string, status?: string) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('proposals')
      .select(`
        *,
        client:users!proposals_client_id_fkey(id, full_name, email, phone, profile_picture)
      `)
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
  }

  async respondToProposal(proposalId: string, dto: RespondToProposalDto) {
    const supabase = this.supabaseService.getClient();

    const updateData: any = {
      status: dto.status,
      contractor_response: dto.contractor_response,
      responded_at: new Date().toISOString(),
    };

    if (dto.proposed_price !== undefined) {
      updateData.proposed_price = dto.proposed_price;
    }

    if (dto.estimated_duration !== undefined) {
      updateData.estimated_duration = dto.estimated_duration;
    }

    const { data, error } = await supabase
      .from('proposals')
      .update(updateData)
      .eq('id', proposalId)
      .select(`
        *,
        client:users!proposals_client_id_fkey(id, full_name, email, profile_picture),
        contractor:contractor_profiles(
          *,
          user:users(id, full_name, email, profile_picture)
        )
      `)
      .single();

    if (error) throw new Error(error.message);

    // If accepted, potentially create a booking (implement later if needed)
    if (dto.status === 'ACCEPTED') {
      // TODO: Create booking or notify client to proceed with booking
    }

    return data;
  }

  async updateProposal(proposalId: string, dto: UpdateProposalDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('proposals')
      .update(dto)
      .eq('id', proposalId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async cancelProposal(proposalId: string, userId: string) {
    const supabase = this.supabaseService.getClient();

    // Verify the user owns this proposal
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select('client_id')
      .eq('id', proposalId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    if (proposal.client_id !== userId) {
      throw new Error('Unauthorized to cancel this proposal');
    }

    const { data, error } = await supabase
      .from('proposals')
      .update({ status: 'CANCELLED' })
      .eq('id', proposalId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async expireOldProposals() {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('proposals')
      .update({ status: 'EXPIRED' })
      .eq('status', 'PENDING')
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) throw new Error(error.message);
    return data;
  }
}

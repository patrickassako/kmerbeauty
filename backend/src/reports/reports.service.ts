import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateReportDto, BlockUserDto, UserReport, UserBlock } from './dto/reports.dto';

@Injectable()
export class ReportsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    /**
     * Create a new report
     */
    async createReport(reporterId: string, dto: CreateReportDto): Promise<UserReport> {
        const supabase = this.supabaseService.getClient();

        // Prevent self-reporting
        if (reporterId === dto.reported_id) {
            throw new BadRequestException('Vous ne pouvez pas vous signaler vous-même');
        }

        // Check if already reported (pending)
        const { data: existingReport } = await supabase
            .from('user_reports')
            .select('id')
            .eq('reporter_id', reporterId)
            .eq('reported_id', dto.reported_id)
            .eq('status', 'pending')
            .single();

        if (existingReport) {
            throw new ConflictException('Vous avez déjà signalé cet utilisateur. Le signalement est en cours de traitement.');
        }

        // Create report
        const { data, error } = await supabase
            .from('user_reports')
            .insert({
                reporter_id: reporterId,
                reported_id: dto.reported_id,
                reason: dto.reason,
                description: dto.description,
                screenshot_url: dto.screenshot_url,
                context_type: dto.context_type,
                context_id: dto.context_id,
                status: 'pending',
            })
            .select(`
                *,
                reported_user:users!user_reports_reported_id_fkey(id, first_name, last_name, avatar)
            `)
            .single();

        if (error) {
            console.error('Error creating report:', error);
            throw new BadRequestException('Erreur lors de la création du signalement');
        }

        return data;
    }

    /**
     * Get user's sent reports
     */
    async getMyReports(userId: string): Promise<UserReport[]> {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('user_reports')
            .select(`
                *,
                reported_user:users!user_reports_reported_id_fkey(id, first_name, last_name, avatar)
            `)
            .eq('reporter_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reports:', error);
            throw new BadRequestException('Erreur lors de la récupération des signalements');
        }

        return data || [];
    }

    /**
     * Block a user
     */
    async blockUser(blockerId: string, blockedId: string, dto?: BlockUserDto): Promise<UserBlock> {
        const supabase = this.supabaseService.getClient();

        // Prevent self-blocking
        if (blockerId === blockedId) {
            throw new BadRequestException('Vous ne pouvez pas vous bloquer vous-même');
        }

        // Check if already blocked
        const { data: existingBlock } = await supabase
            .from('user_blocks')
            .select('id')
            .eq('blocker_id', blockerId)
            .eq('blocked_id', blockedId)
            .single();

        if (existingBlock) {
            throw new ConflictException('Cet utilisateur est déjà bloqué');
        }

        // Create block
        const { data, error } = await supabase
            .from('user_blocks')
            .insert({
                blocker_id: blockerId,
                blocked_id: blockedId,
                reason: dto?.reason,
            })
            .select(`
                *,
                blocked_user:users!user_blocks_blocked_id_fkey(id, first_name, last_name, avatar)
            `)
            .single();

        if (error) {
            console.error('Error blocking user:', error);
            throw new BadRequestException('Erreur lors du blocage');
        }

        return data;
    }

    /**
     * Unblock a user
     */
    async unblockUser(blockerId: string, blockedId: string): Promise<{ success: boolean }> {
        const supabase = this.supabaseService.getClient();

        const { error } = await supabase
            .from('user_blocks')
            .delete()
            .eq('blocker_id', blockerId)
            .eq('blocked_id', blockedId);

        if (error) {
            console.error('Error unblocking user:', error);
            throw new BadRequestException('Erreur lors du déblocage');
        }

        return { success: true };
    }

    /**
     * Get list of blocked users
     */
    async getBlockedUsers(userId: string): Promise<UserBlock[]> {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('user_blocks')
            .select(`
                *,
                blocked_user:users!user_blocks_blocked_id_fkey(id, first_name, last_name, avatar)
            `)
            .eq('blocker_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching blocked users:', error);
            throw new BadRequestException('Erreur lors de la récupération des utilisateurs bloqués');
        }

        return data || [];
    }

    /**
     * Check if a user is blocked
     */
    async isBlocked(blockerId: string, blockedId: string): Promise<{ isBlocked: boolean }> {
        const supabase = this.supabaseService.getClient();

        const { data } = await supabase
            .from('user_blocks')
            .select('id')
            .eq('blocker_id', blockerId)
            .eq('blocked_id', blockedId)
            .single();

        return { isBlocked: !!data };
    }

    /**
     * Check mutual block (either direction)
     */
    async isMutuallyBlocked(userId1: string, userId2: string): Promise<{ isBlocked: boolean }> {
        const supabase = this.supabaseService.getClient();

        console.log(`[ReportsService] Checking mutual block between ${userId1} and ${userId2}`);

        const { data, error } = await supabase
            .from('user_blocks')
            .select('id')
            .or(`and(blocker_id.eq.${userId1},blocked_id.eq.${userId2}),and(blocker_id.eq.${userId2},blocked_id.eq.${userId1})`);

        if (error) {
            console.error('[ReportsService] Error checking mutual block:', error);
            return { isBlocked: false }; // Fail open if error? Or throw?
        }

        console.log(`[ReportsService] Block check result:`, data);

        return { isBlocked: !!(data && data.length > 0) };
    }

    /**
     * Get IDs of all blocked users (both directions)
     * Used for filtering in chat/booking queries
     */
    async getBlockedUserIds(userId: string): Promise<string[]> {
        const supabase = this.supabaseService.getClient();

        // Get users I blocked
        const { data: myBlocks } = await supabase
            .from('user_blocks')
            .select('blocked_id')
            .eq('blocker_id', userId);

        // Get users who blocked me
        const { data: blockedByOthers } = await supabase
            .from('user_blocks')
            .select('blocker_id')
            .eq('blocked_id', userId);

        const blockedIds = new Set<string>();

        myBlocks?.forEach(b => blockedIds.add(b.blocked_id));
        blockedByOthers?.forEach(b => blockedIds.add(b.blocker_id));

        return Array.from(blockedIds);
    }
}

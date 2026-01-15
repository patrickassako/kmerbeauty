import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateStoryDto, StoryResponseDto } from './dto/stories.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class StoriesService {
    constructor(private readonly supabase: SupabaseService) { }

    /**
     * Create a new story (24h expiration)
     */
    async create(
        userId: string,
        providerType: 'therapist' | 'salon',
        dto: CreateStoryDto,
    ): Promise<StoryResponseDto> {
        // Get provider ID
        let therapistId: string | undefined;
        let salonId: string | undefined;

        if (providerType === 'therapist') {
            const { data: therapist } = await this.supabase
                .from('therapists')
                .select('id')
                .eq('user_id', userId)
                .single();
            if (!therapist) throw new ForbiddenException('User is not a therapist');
            therapistId = therapist.id;
        } else {
            const { data: salon } = await this.supabase
                .from('salons')
                .select('id')
                .eq('user_id', userId)
                .single();
            if (!salon) throw new ForbiddenException('User is not a salon owner');
            salonId = salon.id;
        }

        // Create story with 24h expiration
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const { data: story, error } = await this.supabase
            .from('stories')
            .insert({
                therapistId,
                salonId,
                mediaType: dto.mediaType,
                mediaUrl: dto.mediaUrl,
                thumbnailUrl: dto.thumbnailUrl,
                caption: dto.caption,
                textContent: dto.textContent,
                backgroundColor: dto.backgroundColor || '#000000',
                textColor: dto.textColor || '#FFFFFF',
                expiresAt: expiresAt.toISOString(),
            })
            .select()
            .single();

        if (error) throw error;
        return this.formatStoryResponse(story);
    }

    /**
     * Get all active stories (for home feed)
     */
    async getAll(userId?: string): Promise<StoryResponseDto[]> {
        const { data: stories, error } = await this.supabase
            .from('stories')
            .select(`
        *,
        therapist:therapists(id, profile_image, user:users(first_name, avatar)),
        salon:salons(id, name, logo)
      `)
            .eq('isActive', true)
            .gt('expiresAt', new Date().toISOString())
            .order('createdAt', { ascending: false });

        if (error) throw error;

        // Get viewed status if userId provided
        let viewedStoryIds: string[] = [];
        if (userId) {
            const { data: views } = await this.supabase
                .from('story_views')
                .select('storyId')
                .eq('userId', userId);
            viewedStoryIds = views?.map((v: any) => v.storyId) || [];
        }

        return stories.map((story: any) =>
            this.formatStoryResponse(story, viewedStoryIds.includes(story.id))
        );
    }

    /**
     * Get story by ID
     */
    async getById(id: string, userId?: string): Promise<StoryResponseDto> {
        const { data: story, error } = await this.supabase
            .from('stories')
            .select(`
        *,
        therapist:therapists(id, profile_image, user:users(first_name, avatar)),
        salon:salons(id, name, logo)
      `)
            .eq('id', id)
            .single();

        if (error || !story) throw new NotFoundException('Story not found');

        let isViewed = false;
        if (userId) {
            const { data: view } = await this.supabase
                .from('story_views')
                .select('id')
                .eq('storyId', id)
                .eq('userId', userId)
                .single();
            isViewed = !!view;
        }

        return this.formatStoryResponse(story, isViewed);
    }

    /**
     * Mark story as viewed
     */
    async markViewed(storyId: string, userId: string): Promise<void> {
        // Check story exists
        const { data: story } = await this.supabase
            .from('stories')
            .select('id')
            .eq('id', storyId)
            .single();

        if (!story) throw new NotFoundException('Story not found');

        // Upsert view
        await this.supabase
            .from('story_views')
            .upsert(
                { storyId, userId, viewedAt: new Date().toISOString() },
                { onConflict: 'storyId,userId' }
            );

        // Increment view count
        await this.supabase.rpc('increment_story_view_count', { story_id: storyId });
    }

    /**
     * Delete story (owner only)
     */
    async delete(id: string, userId: string): Promise<void> {
        const { data: story } = await this.supabase
            .from('stories')
            .select(`
        id,
        therapist:therapists(user_id),
        salon:salons(user_id)
      `)
            .eq('id', id)
            .single();

        if (!story) throw new NotFoundException('Story not found');

        // Check ownership
        const isOwner =
            (story.therapist && story.therapist.user_id === userId) ||
            (story.salon && story.salon.user_id === userId);

        if (!isOwner) throw new ForbiddenException('Not authorized to delete this story');

        await this.supabase.from('stories').delete().eq('id', id);
    }

    /**
     * Get provider's own stories
     */
    async getMine(userId: string): Promise<StoryResponseDto[]> {
        // Find therapist or salon
        const { data: therapist } = await this.supabase
            .from('therapists')
            .select('id')
            .eq('user_id', userId)
            .single();

        const { data: salon } = await this.supabase
            .from('salons')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!therapist && !salon) return [];

        let query = this.supabase
            .from('stories')
            .select(`
        *,
        therapist:therapists(id, profile_image, user:users(first_name, avatar)),
        salon:salons(id, name, logo)
      `)
            .order('createdAt', { ascending: false });

        if (therapist) {
            query = query.eq('therapistId', therapist.id);
        } else if (salon) {
            query = query.eq('salonId', salon.id);
        }

        const { data: stories, error } = await query;
        if (error) throw error;

        return stories.map((story: any) => this.formatStoryResponse(story));
    }

    /**
     * Cron job: Delete expired stories (runs every hour)
     */
    @Cron(CronExpression.EVERY_HOUR)
    async deleteExpiredStories(): Promise<void> {
        const { count } = await this.supabase
            .from('stories')
            .delete()
            .lt('expiresAt', new Date().toISOString());

        if (count && count > 0) {
            console.log(`Deleted ${count} expired stories`);
        }
    }

    /**
     * Format story response
     */
    private formatStoryResponse(story: any, isViewed?: boolean): StoryResponseDto {
        const provider = story.therapist
            ? {
                id: story.therapist.id,
                name: story.therapist.user?.first_name || 'Provider',
                image: story.therapist.profile_image || story.therapist.user?.avatar,
                type: 'therapist' as const,
            }
            : story.salon
                ? {
                    id: story.salon.id,
                    name: story.salon.name,
                    image: story.salon.logo,
                    type: 'salon' as const,
                }
                : undefined;

        return {
            id: story.id,
            therapistId: story.therapistId,
            salonId: story.salonId,
            mediaType: story.mediaType,
            mediaUrl: story.mediaUrl,
            thumbnailUrl: story.thumbnailUrl,
            caption: story.caption,
            textContent: story.textContent,
            backgroundColor: story.backgroundColor,
            textColor: story.textColor,
            isActive: story.isActive,
            expiresAt: story.expiresAt,
            viewCount: story.viewCount,
            createdAt: story.createdAt,
            isViewed,
            provider,
        };
    }
}

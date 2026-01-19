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
        salon:salons(*)
      `)
            .eq('isActive', true)
            .gt('expiresAt', new Date().toISOString())
            .order('createdAt', { ascending: false });

        if (error) throw error;

        // Get viewed/liked status if userId provided
        let viewedStoryIds: string[] = [];
        let likedStoryIds: string[] = [];

        if (userId) {
            const { data: views } = await this.supabase
                .from('story_views')
                .select('storyId')
                .eq('userId', userId);
            viewedStoryIds = views?.map((v: any) => v.storyId) || [];

            const { data: likes } = await this.supabase
                .from('story_likes')
                .select('storyId')
                .eq('userId', userId);
            likedStoryIds = likes?.map((l: any) => l.storyId) || [];
        }

        return stories.map((story: any) =>
            this.formatStoryResponse(
                story,
                viewedStoryIds.includes(story.id),
                likedStoryIds.includes(story.id)
            )
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
        salon:salons(*)
      `)
            .eq('id', id)
            .single();

        if (error || !story) throw new NotFoundException('Story not found');

        let isViewed = false;
        let isLiked = false;
        if (userId) {
            const { data: view } = await this.supabase
                .from('story_views')
                .select('id')
                .eq('storyId', id)
                .eq('userId', userId)
                .single();
            isViewed = !!view;

            const { data: like } = await this.supabase
                .from('story_likes')
                .select('id')
                .eq('storyId', id)
                .eq('userId', userId)
                .single();
            isLiked = !!like;
        }

        return this.formatStoryResponse(story, isViewed, isLiked);
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
     * Like a story
     */
    async like(storyId: string, userId: string): Promise<{ success: boolean; likeCount: number }> {
        // Check story exists
        const { data: story } = await this.supabase
            .from('stories')
            .select('id, likeCount')
            .eq('id', storyId)
            .single();

        if (!story) throw new NotFoundException('Story not found');

        // Check if already liked
        const { data: existingLike } = await this.supabase
            .from('story_likes')
            .select('id')
            .eq('storyId', storyId)
            .eq('userId', userId)
            .single();

        if (existingLike) {
            return { success: true, likeCount: story.likeCount };
        }

        // Create like
        await this.supabase
            .from('story_likes')
            .insert({ storyId, userId });

        // Increment like count manually since we might not have RPC
        const newCount = (story.likeCount || 0) + 1;
        await this.supabase
            .from('stories')
            .update({ likeCount: newCount })
            .eq('id', storyId);

        return { success: true, likeCount: newCount };
    }

    /**
     * Unlike a story
     */
    async unlike(storyId: string, userId: string): Promise<{ success: boolean; likeCount: number }> {
        // Check story exists
        const { data: story } = await this.supabase
            .from('stories')
            .select('id, likeCount')
            .eq('id', storyId)
            .single();

        if (!story) throw new NotFoundException('Story not found');

        // Delete like
        const { error } = await this.supabase
            .from('story_likes')
            .delete()
            .eq('storyId', storyId)
            .eq('userId', userId);

        if (error) {
            // Probably wasn't liked
            return { success: true, likeCount: story.likeCount };
        }

        // Decrement like count
        const newCount = Math.max(0, (story.likeCount || 0) - 1);
        await this.supabase
            .from('stories')
            .update({ likeCount: newCount })
            .eq('id', storyId);

        return { success: true, likeCount: newCount };
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

        // Check ownership - relations come as arrays from Supabase
        const therapist = (story as any).therapist;
        const salon = (story as any).salon;
        const isOwner =
            (therapist && therapist.user_id === userId) ||
            (salon && salon.user_id === userId);

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
        salon:salons(*)
      `)
            .order('createdAt', { ascending: false });

        if (therapist) {
            query = query.eq('therapistId', therapist.id);
        } else if (salon) {
            query = query.eq('salonId', salon.id);
        }

        const { data: stories, error } = await query;
        if (error) throw error;

        return stories.map((story: any) => this.formatStoryResponse(story, false, false));
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
    private formatStoryResponse(story: any, isViewed?: boolean, isLiked?: boolean): StoryResponseDto {
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
                    name: story.salon.name_fr || story.salon.name_en,
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
            likeCount: story.likeCount,
            createdAt: story.createdAt,
            isViewed,
            isLiked,
            provider,
        };
    }
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoryDto, StoryResponseDto } from './dto/stories.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class StoriesService {
    constructor(private readonly prisma: PrismaService) { }

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
            const therapist = await this.prisma.therapist.findUnique({
                where: { userId },
            });
            if (!therapist) throw new ForbiddenException('User is not a therapist');
            therapistId = therapist.id;
        } else {
            const salon = await this.prisma.salon.findUnique({
                where: { userId },
            });
            if (!salon) throw new ForbiddenException('User is not a salon owner');
            salonId = salon.id;
        }

        // Create story with 24h expiration
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const story = await this.prisma.story.create({
            data: {
                therapistId,
                salonId,
                mediaType: dto.mediaType,
                mediaUrl: dto.mediaUrl,
                thumbnailUrl: dto.thumbnailUrl,
                caption: dto.caption,
                expiresAt,
            },
            include: {
                therapist: {
                    include: { user: true },
                },
                salon: true,
            },
        });

        return this.formatStoryResponse(story);
    }

    /**
     * Get all active stories (for home feed)
     */
    async getAll(userId?: string): Promise<StoryResponseDto[]> {
        const stories = await this.prisma.story.findMany({
            where: {
                isActive: true,
                expiresAt: { gt: new Date() },
            },
            include: {
                therapist: {
                    include: { user: true },
                },
                salon: true,
                views: userId ? {
                    where: { userId },
                } : false,
            },
            orderBy: { createdAt: 'desc' },
        });

        return stories.map((story) => this.formatStoryResponse(story, userId));
    }

    /**
     * Get story by ID
     */
    async getById(id: string, userId?: string): Promise<StoryResponseDto> {
        const story = await this.prisma.story.findUnique({
            where: { id },
            include: {
                therapist: {
                    include: { user: true },
                },
                salon: true,
                views: userId ? {
                    where: { userId },
                } : false,
            },
        });

        if (!story) throw new NotFoundException('Story not found');

        return this.formatStoryResponse(story, userId);
    }

    /**
     * Mark story as viewed
     */
    async markViewed(storyId: string, userId: string): Promise<void> {
        // Check story exists
        const story = await this.prisma.story.findUnique({ where: { id: storyId } });
        if (!story) throw new NotFoundException('Story not found');

        // Create view (ignore if already exists)
        await this.prisma.storyView.upsert({
            where: {
                storyId_userId: { storyId, userId },
            },
            create: { storyId, userId },
            update: {},
        });

        // Increment view count
        await this.prisma.story.update({
            where: { id: storyId },
            data: { viewCount: { increment: 1 } },
        });
    }

    /**
     * Delete story (owner only)
     */
    async delete(id: string, userId: string): Promise<void> {
        const story = await this.prisma.story.findUnique({
            where: { id },
            include: {
                therapist: true,
                salon: true,
            },
        });

        if (!story) throw new NotFoundException('Story not found');

        // Check ownership
        const isOwner =
            (story.therapist && story.therapist.userId === userId) ||
            (story.salon && story.salon.userId === userId);

        if (!isOwner) throw new ForbiddenException('Not authorized to delete this story');

        await this.prisma.story.delete({ where: { id } });
    }

    /**
     * Get provider's own stories
     */
    async getMine(userId: string): Promise<StoryResponseDto[]> {
        // Find therapist or salon
        const therapist = await this.prisma.therapist.findUnique({ where: { userId } });
        const salon = await this.prisma.salon.findUnique({ where: { userId } });

        if (!therapist && !salon) {
            return [];
        }

        const stories = await this.prisma.story.findMany({
            where: {
                OR: [
                    { therapistId: therapist?.id },
                    { salonId: salon?.id },
                ],
            },
            include: {
                therapist: {
                    include: { user: true },
                },
                salon: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return stories.map((story) => this.formatStoryResponse(story));
    }

    /**
     * Cron job: Delete expired stories (runs every hour)
     */
    @Cron(CronExpression.EVERY_HOUR)
    async deleteExpiredStories(): Promise<void> {
        const result = await this.prisma.story.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });

        if (result.count > 0) {
            console.log(`Deleted ${result.count} expired stories`);
        }
    }

    /**
     * Format story response
     */
    private formatStoryResponse(story: any, userId?: string): StoryResponseDto {
        const provider = story.therapist
            ? {
                id: story.therapist.id,
                name: story.therapist.user?.firstName || 'Provider',
                image: story.therapist.profileImage || story.therapist.user?.avatar,
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
            isActive: story.isActive,
            expiresAt: story.expiresAt,
            viewCount: story.viewCount,
            createdAt: story.createdAt,
            isViewed: userId ? (story.views?.length > 0) : undefined,
            provider,
        };
    }
}

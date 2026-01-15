import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackDto, UpdatePackDto, PackResponseDto } from './dto/packs.dto';

@Injectable()
export class PacksService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create a new promotional pack
     */
    async create(
        userId: string,
        providerType: 'therapist' | 'salon',
        dto: CreatePackDto,
    ): Promise<PackResponseDto> {
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

        const pack = await this.prisma.promotionalPack.create({
            data: {
                therapistId,
                salonId,
                title: dto.title,
                subtitle: dto.subtitle,
                description: dto.description,
                imageUrl: dto.imageUrl,
                badge: dto.badge,
                ctaText: dto.ctaText || 'Réserver',
                ctaLink: dto.ctaLink,
                serviceId: dto.serviceId,
                discountType: dto.discountType,
                discountValue: dto.discountValue,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                targetCities: dto.targetCities || [],
            },
            include: {
                therapist: {
                    include: { user: true },
                },
                salon: true,
            },
        });

        return this.formatPackResponse(pack);
    }

    /**
     * Get all active packs (optionally filtered by city)
     */
    async getAll(city?: string): Promise<PackResponseDto[]> {
        const now = new Date();

        const packs = await this.prisma.promotionalPack.findMany({
            where: {
                isActive: true,
                startDate: { lte: now },
                OR: [
                    { endDate: null },
                    { endDate: { gte: now } },
                ],
                ...(city && {
                    OR: [
                        { targetCities: { isEmpty: true } },
                        { targetCities: { has: city } },
                    ],
                }),
            },
            include: {
                therapist: {
                    include: { user: true },
                },
                salon: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return packs.map((pack) => this.formatPackResponse(pack));
    }

    /**
     * Get pack by ID
     */
    async getById(id: string): Promise<PackResponseDto> {
        const pack = await this.prisma.promotionalPack.findUnique({
            where: { id },
            include: {
                therapist: {
                    include: { user: true },
                },
                salon: true,
            },
        });

        if (!pack) throw new NotFoundException('Pack not found');

        return this.formatPackResponse(pack);
    }

    /**
     * Update pack
     */
    async update(id: string, userId: string, dto: UpdatePackDto): Promise<PackResponseDto> {
        const pack = await this.prisma.promotionalPack.findUnique({
            where: { id },
            include: {
                therapist: true,
                salon: true,
            },
        });

        if (!pack) throw new NotFoundException('Pack not found');

        // Check ownership
        const isOwner =
            (pack.therapist && pack.therapist.userId === userId) ||
            (pack.salon && pack.salon.userId === userId);

        if (!isOwner) throw new ForbiddenException('Not authorized to update this pack');

        const updated = await this.prisma.promotionalPack.update({
            where: { id },
            data: {
                title: dto.title,
                subtitle: dto.subtitle,
                description: dto.description,
                imageUrl: dto.imageUrl,
                badge: dto.badge,
                ctaText: dto.ctaText,
                ctaLink: dto.ctaLink,
                serviceId: dto.serviceId,
                discountType: dto.discountType,
                discountValue: dto.discountValue,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                targetCities: dto.targetCities,
                isActive: dto.isActive,
            },
            include: {
                therapist: {
                    include: { user: true },
                },
                salon: true,
            },
        });

        return this.formatPackResponse(updated);
    }

    /**
     * Delete pack
     */
    async delete(id: string, userId: string): Promise<void> {
        const pack = await this.prisma.promotionalPack.findUnique({
            where: { id },
            include: {
                therapist: true,
                salon: true,
            },
        });

        if (!pack) throw new NotFoundException('Pack not found');

        // Check ownership
        const isOwner =
            (pack.therapist && pack.therapist.userId === userId) ||
            (pack.salon && pack.salon.userId === userId);

        if (!isOwner) throw new ForbiddenException('Not authorized to delete this pack');

        await this.prisma.promotionalPack.delete({ where: { id } });
    }

    /**
     * Track pack click
     */
    async trackClick(id: string): Promise<void> {
        await this.prisma.promotionalPack.update({
            where: { id },
            data: { clickCount: { increment: 1 } },
        });
    }

    /**
     * Get provider's own packs
     */
    async getMine(userId: string): Promise<PackResponseDto[]> {
        const therapist = await this.prisma.therapist.findUnique({ where: { userId } });
        const salon = await this.prisma.salon.findUnique({ where: { userId } });

        if (!therapist && !salon) {
            return [];
        }

        const packs = await this.prisma.promotionalPack.findMany({
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

        return packs.map((pack) => this.formatPackResponse(pack));
    }

    /**
     * Format pack response
     */
    private formatPackResponse(pack: any): PackResponseDto {
        const provider = pack.therapist
            ? {
                id: pack.therapist.id,
                name: pack.therapist.user?.firstName || 'Provider',
                image: pack.therapist.profileImage || pack.therapist.user?.avatar,
                type: 'therapist' as const,
            }
            : pack.salon
                ? {
                    id: pack.salon.id,
                    name: pack.salon.name,
                    image: pack.salon.logo,
                    type: 'salon' as const,
                }
                : undefined;

        return {
            id: pack.id,
            therapistId: pack.therapistId,
            salonId: pack.salonId,
            title: pack.title,
            subtitle: pack.subtitle,
            description: pack.description,
            imageUrl: pack.imageUrl,
            badge: pack.badge,
            ctaText: pack.ctaText,
            ctaLink: pack.ctaLink,
            serviceId: pack.serviceId,
            discountType: pack.discountType,
            discountValue: pack.discountValue,
            startDate: pack.startDate,
            endDate: pack.endDate,
            isActive: pack.isActive,
            targetCities: pack.targetCities,
            viewCount: pack.viewCount,
            clickCount: pack.clickCount,
            createdAt: pack.createdAt,
            provider,
        };
    }
}

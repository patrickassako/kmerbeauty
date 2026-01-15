import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreatePackDto, UpdatePackDto, PackResponseDto } from './dto/packs.dto';

@Injectable()
export class PacksService {
    constructor(private readonly supabase: SupabaseService) { }

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

        const { data: pack, error } = await this.supabase
            .from('promotional_packs')
            .insert({
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
                endDate: dto.endDate,
                targetCities: dto.targetCities || [],
            })
            .select()
            .single();

        if (error) throw error;
        return this.formatPackResponse(pack);
    }

    /**
     * Get all active packs (optionally filtered by city)
     */
    async getAll(city?: string): Promise<PackResponseDto[]> {
        const now = new Date().toISOString();

        let query = this.supabase
            .from('promotional_packs')
            .select(`
        *,
        therapist:therapists(id, profile_image, user:users(first_name, avatar)),
        salon:salons(id, salon_name:name, logo)
      `)
            .eq('is_active', true)
            .lte('start_date', now)
            .order('created_at', { ascending: false });

        const { data: packs, error } = await query;
        if (error) throw error;

        // Filter by end date and city in memory
        const filtered = packs.filter((pack: any) => {
            if (pack.end_date && new Date(pack.end_date) < new Date()) return false;
            if (city && pack.target_cities?.length > 0 && !pack.target_cities.includes(city)) return false;
            return true;
        });

        return filtered.map((pack: any) => this.formatPackResponse(pack));
    }

    /**
     * Get pack by ID
     */
    async getById(id: string): Promise<PackResponseDto> {
        const { data: pack, error } = await this.supabase
            .from('promotional_packs')
            .select(`
        *,
        therapist:therapists(id, profile_image, user:users(first_name, avatar)),
        salon:salons(id, salon_name:name, logo)
      `)
            .eq('id', id)
            .single();

        if (error || !pack) throw new NotFoundException('Pack not found');

        return this.formatPackResponse(pack);
    }

    /**
     * Update pack
     */
    async update(id: string, userId: string, dto: UpdatePackDto): Promise<PackResponseDto> {
        const { data: pack } = await this.supabase
            .from('promotional_packs')
            .select(`
        id,
        therapist:therapists(user_id),
        salon:salons(user_id)
      `)
            .eq('id', id)
            .single();

        if (!pack) throw new NotFoundException('Pack not found');

        // Check ownership - relations come as objects from Supabase
        const therapist = (pack as any).therapist;
        const salon = (pack as any).salon;
        const isOwner =
            (therapist && therapist.user_id === userId) ||
            (salon && salon.user_id === userId);

        if (!isOwner) throw new ForbiddenException('Not authorized to update this pack');

        const { data: updated, error } = await this.supabase
            .from('promotional_packs')
            .update({
                title: dto.title,
                subtitle: dto.subtitle,
                description: dto.description,
                image_url: dto.imageUrl,
                badge: dto.badge,
                cta_text: dto.ctaText,
                cta_link: dto.ctaLink,
                service_id: dto.serviceId,
                discount_type: dto.discountType,
                discount_value: dto.discountValue,
                end_date: dto.endDate,
                target_cities: dto.targetCities,
                is_active: dto.isActive,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this.formatPackResponse(updated);
    }

    /**
     * Delete pack
     */
    async delete(id: string, userId: string): Promise<void> {
        const { data: pack } = await this.supabase
            .from('promotional_packs')
            .select(`
        id,
        therapist:therapists(user_id),
        salon:salons(user_id)
      `)
            .eq('id', id)
            .single();

        if (!pack) throw new NotFoundException('Pack not found');

        // Check ownership - relations come as objects from Supabase
        const therapist = (pack as any).therapist;
        const salon = (pack as any).salon;
        const isOwner =
            (therapist && therapist.user_id === userId) ||
            (salon && salon.user_id === userId);

        if (!isOwner) throw new ForbiddenException('Not authorized to delete this pack');

        await this.supabase.from('promotional_packs').delete().eq('id', id);
    }

    /**
     * Track pack click
     */
    async trackClick(id: string): Promise<void> {
        await this.supabase.rpc('increment_pack_click_count', { pack_id: id });
    }

    /**
     * Get provider's own packs
     */
    async getMine(userId: string): Promise<PackResponseDto[]> {
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
            .from('promotional_packs')
            .select(`
        *,
        therapist:therapists(id, profile_image, user:users(first_name, avatar)),
        salon:salons(id, salon_name:name, logo)
      `)
            .order('created_at', { ascending: false });

        if (therapist) {
            query = query.eq('therapist_id', therapist.id);
        } else if (salon) {
            query = query.eq('salon_id', salon.id);
        }

        const { data: packs, error } = await query;
        if (error) throw error;

        return packs.map((pack: any) => this.formatPackResponse(pack));
    }

    /**
     * Format pack response
     */
    private formatPackResponse(pack: any): PackResponseDto {
        const provider = pack.therapist
            ? {
                id: pack.therapist.id,
                name: pack.therapist.user?.first_name || 'Provider',
                image: pack.therapist.profile_image || pack.therapist.user?.avatar,
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

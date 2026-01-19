import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface PackageResponseDto {
    id: string;
    nameFr: string;
    nameEn: string;
    descriptionFr?: string;
    descriptionEn?: string;
    category: string;
    images: string[];
    basePrice: number;
    baseDuration: number;
    priority: number;
    isActive: boolean;
    services?: {
        id: string;
        nameFr: string;
        nameEn: string;
        images: string[];
        sequence: number;
    }[];
    // Salon-specific pricing
    salonPrice?: number;
    salonDuration?: number;
}

@Injectable()
export class ServicePackagesService {
    constructor(private readonly supabase: SupabaseService) { }

    /**
     * Get all active service packages with their included services
     */
    async getAll(category?: string): Promise<PackageResponseDto[]> {
        let query = this.supabase
            .from('service_packages')
            .select(`
        *,
        package_services(
          sequence,
          service:services(id, name_fr, name_en, images)
        )
      `)
            .eq('is_active', true)
            .order('priority', { ascending: false });

        if (category) {
            query = query.eq('category', category);
        }

        const { data: packages, error } = await query;
        if (error) throw error;

        return packages.map((pkg: any) => this.formatPackageResponse(pkg));
    }

    /**
     * Get featured/special offer packages (high priority)
     */
    async getFeatured(limit: number = 5): Promise<PackageResponseDto[]> {
        const { data: packages, error } = await this.supabase
            .from('service_packages')
            .select(`
        *,
        package_services(
          sequence,
          service:services(id, name_fr, name_en, images)
        )
      `)
            .eq('is_active', true)
            .gt('priority', 0)
            .order('priority', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return packages.map((pkg: any) => this.formatPackageResponse(pkg));
    }

    /**
     * Get package by ID with services
     */
    async getById(id: string): Promise<PackageResponseDto> {
        const { data: pkg, error } = await this.supabase
            .from('service_packages')
            .select(`
        *,
        package_services(
          sequence,
          service:services(id, name_fr, name_en, images, description_fr, description_en)
        )
      `)
            .eq('id', id)
            .single();

        if (error) throw error;

        return this.formatPackageResponse(pkg);
    }

    /**
     * Get packages offered by a specific salon with their custom pricing
     */
    async getBySalon(salonId: string): Promise<PackageResponseDto[]> {
        const { data: salonPackages, error } = await this.supabase
            .from('salon_packages')
            .select(`
        price,
        duration,
        is_active,
        package:service_packages(
          *,
          package_services(
            sequence,
            service:services(id, name_fr, name_en, images)
          )
        )
      `)
            .eq('salon_id', salonId)
            .eq('is_active', true);

        if (error) throw error;

        return salonPackages
            .filter((sp: any) => sp.package && sp.package.is_active)
            .map((sp: any) => ({
                ...this.formatPackageResponse(sp.package),
                salonPrice: sp.price,
                salonDuration: sp.duration,
            }));
    }

    /**
     * Get packages offered by a specific therapist (via salon if they belong to one)
     */
    async getByTherapist(therapistId: string): Promise<PackageResponseDto[]> {
        // First get therapist's salon if any
        const { data: therapist } = await this.supabase
            .from('therapists')
            .select('salon_id')
            .eq('id', therapistId)
            .single();

        if (!therapist?.salon_id) {
            return [];
        }

        return this.getBySalon(therapist.salon_id);
    }

    /**
     * Get all providers (salons and therapists) offering a specific package
     */
    async getProvidersByPackage(packageId: string): Promise<any[]> {
        // Fetch salons offering this package
        const { data: salonPackages, error: salonError } = await this.supabase
            .from('salon_packages')
            .select(`
        price,
        duration,
        is_active,
        salon:salons(
          id,
          name_fr,
          name_en,
          quarter,
          street,
          landmark,
          city,
          region,
          latitude,
          longitude,
          logo,
          cover_image,
          ambiance_images,
          rating,
          review_count
        )
      `)
            .eq('package_id', packageId)
            .eq('is_active', true);

        if (salonError) throw salonError;

        // Fetch therapists offering this package
        const { data: therapistPackages, error: therapistError } = await this.supabase
            .from('therapist_packages')
            .select(`
        price,
        duration,
        is_active,
        therapist:therapists(
          id,
          business_name,
          service_zones,
          profile_picture,
          portfolio_images
        )
      `)
            .eq('package_id', packageId)
            .eq('is_active', true);

        if (therapistError) throw therapistError;

        // Format salon providers
        const salonProviders = (salonPackages || [])
            .filter((sp: any) => sp.salon)
            .map((sp: any) => ({
                id: sp.salon.id,
                type: 'salon',
                nameFr: sp.salon.name_fr,
                nameEn: sp.salon.name_en,
                quarter: sp.salon.quarter,
                street: sp.salon.street,
                landmark: sp.salon.landmark,
                city: sp.salon.city,
                region: sp.salon.region,
                latitude: sp.salon.latitude,
                longitude: sp.salon.longitude,
                rating: sp.salon.rating || 0,
                reviewCount: sp.salon.review_count || 0,
                images: [sp.salon.logo, sp.salon.cover_image, ...(sp.salon.ambiance_images || [])].filter(Boolean),
                packagePrice: sp.price,
                packageDuration: sp.duration,
            }));

        // Format therapist providers
        const therapistProviders = (therapistPackages || [])
            .filter((tp: any) => tp.therapist)
            .map((tp: any) => {
                const serviceZones = tp.therapist.service_zones || [];
                const primaryZone = serviceZones[0] || {};

                return {
                    id: tp.therapist.id,
                    type: 'therapist',
                    nameFr: tp.therapist.business_name,
                    nameEn: tp.therapist.business_name,
                    quarter: primaryZone.district || '',
                    street: '',
                    landmark: '',
                    city: primaryZone.city || '',
                    region: '', // Therapists don't have region in service_zones
                    latitude: primaryZone.latitude || 0,
                    longitude: primaryZone.longitude || 0,
                    rating: 0, // TODO: Calculate from reviews
                    reviewCount: 0, // TODO: Count reviews
                    images: [tp.therapist.profile_picture, ...(tp.therapist.portfolio_images || [])].filter(Boolean),
                    packagePrice: tp.price,
                    packageDuration: tp.duration,
                };
            });

        // Combine and return both
        return [...salonProviders, ...therapistProviders];
    }

    /**
     * Format package response
     */
    private formatPackageResponse(pkg: any): PackageResponseDto {
        const services = (pkg.package_services || [])
            .sort((a: any, b: any) => a.sequence - b.sequence)
            .map((ps: any) => ({
                id: ps.service?.id,
                nameFr: ps.service?.name_fr,
                nameEn: ps.service?.name_en,
                images: ps.service?.images || [],
                sequence: ps.sequence,
            }))
            .filter((s: any) => s.id);

        return {
            id: pkg.id,
            nameFr: pkg.name_fr,
            nameEn: pkg.name_en,
            descriptionFr: pkg.description_fr,
            descriptionEn: pkg.description_en,
            category: pkg.category,
            images: pkg.images || [],
            basePrice: parseFloat(pkg.base_price),
            baseDuration: pkg.base_duration,
            priority: pkg.priority || 0,
            isActive: pkg.is_active,
            services,
        };
    }
}

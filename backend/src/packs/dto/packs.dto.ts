import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray, IsDateString } from 'class-validator';

export enum DiscountType {
    PERCENTAGE = 'PERCENTAGE',
    FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export class CreatePackDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    subtitle?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    imageUrl: string;

    @IsOptional()
    @IsString()
    badge?: string;

    @IsOptional()
    @IsString()
    ctaText?: string;

    @IsOptional()
    @IsString()
    ctaLink?: string;

    @IsOptional()
    @IsString()
    serviceId?: string;

    @IsOptional()
    @IsEnum(DiscountType)
    discountType?: DiscountType;

    @IsOptional()
    @IsNumber()
    discountValue?: number;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    targetCities?: string[];
}

export class UpdatePackDto extends CreatePackDto {
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class PackResponseDto {
    id: string;
    therapistId?: string;
    salonId?: string;
    title: string;
    subtitle?: string;
    description?: string;
    imageUrl: string;
    badge?: string;
    ctaText: string;
    ctaLink?: string;
    serviceId?: string;
    discountType?: DiscountType;
    discountValue?: number;
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
    targetCities: string[];
    viewCount: number;
    clickCount: number;
    createdAt: Date;
    provider?: {
        id: string;
        name: string;
        image: string;
        type: 'therapist' | 'salon';
    };
}

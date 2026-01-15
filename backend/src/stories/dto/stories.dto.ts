import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum StoryMediaType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    TEXT = 'TEXT',
}

export class CreateStoryDto {
    @IsEnum(StoryMediaType)
    mediaType: StoryMediaType;

    @IsOptional()
    @IsString()
    mediaUrl?: string;

    @IsOptional()
    @IsString()
    thumbnailUrl?: string;

    @IsOptional()
    @IsString()
    caption?: string;

    @IsOptional()
    @IsString()
    textContent?: string;

    @IsOptional()
    @IsString()
    backgroundColor?: string;

    @IsOptional()
    @IsString()
    textColor?: string;
}

export class StoryResponseDto {
    id: string;
    therapistId?: string;
    salonId?: string;
    mediaType: StoryMediaType;
    mediaUrl?: string;
    thumbnailUrl?: string;
    caption?: string;
    textContent?: string;
    backgroundColor?: string;
    textColor?: string;
    isActive: boolean;
    expiresAt: Date;
    viewCount: number;
    createdAt: Date;
    isViewed?: boolean;
    provider?: {
        id: string;
        name: string;
        image: string;
        type: 'therapist' | 'salon';
    };
}

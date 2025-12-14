import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export enum ReportReason {
    HARASSMENT = 'harassment',
    SPAM = 'spam',
    INAPPROPRIATE = 'inappropriate',
    SCAM = 'scam',
    SUSPICIOUS = 'suspicious',
    OTHER = 'other',
}

export enum ContextType {
    CHAT = 'chat',
    BOOKING = 'booking',
    PROFILE = 'profile',
}

export class CreateReportDto {
    @IsUUID()
    reported_id: string;

    @IsEnum(ReportReason)
    reason: ReportReason;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    screenshot_url?: string;

    @IsOptional()
    @IsEnum(ContextType)
    context_type?: ContextType;

    @IsOptional()
    @IsUUID()
    context_id?: string;
}

export class BlockUserDto {
    @IsOptional()
    @IsString()
    reason?: string;
}

export interface UserReport {
    id: string;
    reporter_id: string;
    reported_id: string;
    reason: ReportReason;
    description?: string;
    screenshot_url?: string;
    context_type?: ContextType;
    context_id?: string;
    status: string;
    created_at: string;
    reported_user?: {
        id: string;
        first_name: string;
        last_name: string;
        avatar?: string;
    };
}

export interface UserBlock {
    id: string;
    blocker_id: string;
    blocked_id: string;
    reason?: string;
    created_at: string;
    blocked_user?: {
        id: string;
        first_name: string;
        last_name: string;
        avatar?: string;
    };
}

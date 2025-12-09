import { IsEmail, IsString, MinLength, IsEnum, IsPhoneNumber, IsOptional } from 'class-validator';

export enum UserRole {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
  SUPPORT = 'SUPPORT',
  MODERATOR = 'MODERATOR',
}

export enum Language {
  FRENCH = 'FRENCH',
  ENGLISH = 'ENGLISH',
}

export class SignUpDto {
  @IsEmail()
  email: string;

  @IsPhoneNumber('CM') // Format Cameroun: +237XXXXXXXXX
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsEnum(Language)
  language?: Language = Language.FRENCH;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  @IsOptional()
  @IsString()
  region?: string;

  // Therapist/Provider specific fields
  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  bio?: string; // Maps to bio_fr/bio_en

  @IsOptional()
  experience?: number;

  @IsOptional()
  isMobile?: boolean;

  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;

  @IsOptional()
  serviceZones?: any[]; // For now accept any array, can be refined
}

export class SignInDto {
  @IsString()
  emailOrPhone: string; // Peut être email ou téléphone

  @IsString()
  password: string;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    language: Language;
  };
}

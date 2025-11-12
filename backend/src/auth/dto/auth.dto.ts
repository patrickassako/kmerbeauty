import { IsEmail, IsString, MinLength, IsEnum, IsPhoneNumber, IsOptional } from 'class-validator';

export enum UserRole {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
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
  region?: string;
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

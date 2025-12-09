import { IsOptional, IsString } from 'class-validator';

export class SearchServicesDto {
    @IsOptional()
    @IsString()
    category?: string;
}

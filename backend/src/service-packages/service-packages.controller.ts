import {
    Controller,
    Get,
    Param,
    Query,
} from '@nestjs/common';
import { ServicePackagesService } from './service-packages.service';

@Controller('service-packages')
export class ServicePackagesController {
    constructor(private readonly servicePackagesService: ServicePackagesService) { }

    @Get()
    async getAll(@Query('category') category?: string) {
        return this.servicePackagesService.getAll(category);
    }

    @Get('featured')
    async getFeatured(@Query('limit') limit?: string) {
        return this.servicePackagesService.getFeatured(limit ? parseInt(limit) : 5);
    }

    @Get(':id')
    async getById(@Param('id') id: string) {
        return this.servicePackagesService.getById(id);
    }

    @Get('salon/:salonId')
    async getBySalon(@Param('salonId') salonId: string) {
        return this.servicePackagesService.getBySalon(salonId);
    }

    @Get('therapist/:therapistId')
    async getByTherapist(@Param('therapistId') therapistId: string) {
        return this.servicePackagesService.getByTherapist(therapistId);
    }
}

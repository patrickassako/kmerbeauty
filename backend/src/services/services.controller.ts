import { Controller, Get, Param, Query } from '@nestjs/common';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) { }

  @Get('search')
  async search(@Query('q') query: string) {
    if (!query || query.trim().length === 0) {
      return this.servicesService.findAll();
    }
    return this.servicesService.search(query);
  }

  @Get()
  async findAll(@Query('category') category?: string) {
    return this.servicesService.findAll(category);
  }

  @Get('nearby-providers')
  async findAllNearbyProviders(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
    @Query('city') city?: string,
    @Query('district') district?: string,
  ) {
    return this.servicesService.findNearbyProviders(
      null,
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseInt(radius) : undefined,
      city,
      district,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Get(':id/providers/nearby')
  async findNearbyProviders(
    @Param('id') id: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
    @Query('city') city?: string,
    @Query('district') district?: string,
  ) {
    return this.servicesService.findNearbyProviders(
      id,
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseInt(radius) : undefined,
      city,
      district,
    );
  }
}

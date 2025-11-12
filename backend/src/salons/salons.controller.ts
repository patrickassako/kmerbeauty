import { Controller, Get, Param, Query } from '@nestjs/common';
import { SalonsService } from './salons.service';

@Controller('salons')
export class SalonsController {
  constructor(private readonly salonsService: SalonsService) {}

  @Get()
  async findAll(
    @Query('city') city?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.salonsService.findAll(city, serviceId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.salonsService.findOne(id);
  }

  @Get(':id/services')
  async getServices(@Param('id') id: string) {
    return this.salonsService.getServices(id);
  }

  @Get(':id/therapists')
  async getTherapists(@Param('id') id: string) {
    return this.salonsService.getTherapists(id);
  }
}

import { Controller, Get, Param, Query } from '@nestjs/common';
import { TherapistsService } from './therapists.service';

@Controller('therapists')
export class TherapistsController {
  constructor(private readonly therapistsService: TherapistsService) {}

  @Get()
  async findAll(
    @Query('city') city?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.therapistsService.findAll(city, serviceId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.therapistsService.findOne(id);
  }

  @Get(':id/services')
  async getServices(@Param('id') id: string) {
    return this.therapistsService.getServices(id);
  }
}

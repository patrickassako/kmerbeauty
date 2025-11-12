import { Controller, Get, Param, Query } from '@nestjs/common';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async findAll(@Query('category') category?: string) {
    return this.servicesService.findAll(category);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }
}

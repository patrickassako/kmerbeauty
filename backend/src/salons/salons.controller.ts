import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { SalonsService } from './salons.service';
import { Request } from 'express';

@Controller('salons')
export class SalonsController {
  constructor(private readonly salonsService: SalonsService) { }

  @Get()
  async findAll(
    @Query('city') city?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.salonsService.findAll(city, serviceId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    // Extract user ID from request if authenticated
    let userId = (req as any).user?.id;

    // If no user from guard, try to decode token manually
    if (!userId && req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        if (token) {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
          const payload = JSON.parse(jsonPayload);
          userId = payload.sub; // Supabase uses 'sub' for user ID
        }
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }

    console.log(`[SalonsController] findOne called for ${id}, viewer: ${userId}`);
    return this.salonsService.findOne(id, userId);
  }

  @Get(':id/services')
  async getServices(@Param('id') id: string) {
    return this.salonsService.getServices(id);
  }

  @Get(':id/therapists')
  async getTherapists(@Param('id') id: string) {
    return this.salonsService.getTherapists(id);
  }

  @Get(':id/availability')
  async getAvailability(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    return this.salonsService.getAvailability(id, date);
  }
}

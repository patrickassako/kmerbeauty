import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { TherapistsService } from './therapists.service';
import { Request } from 'express';

@Controller('therapists')
export class TherapistsController {
  constructor(private readonly therapistsService: TherapistsService) { }

  @Get('nearby')
  async findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
    @Query('city') city?: string,
    @Query('district') district?: string,
  ) {
    return this.therapistsService.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseInt(radius) : undefined,
      city,
      district,
    );
  }

  @Get()
  async findAll(
    @Query('city') city?: string,
    @Query('quarter') quarter?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.therapistsService.findAll(city, serviceId, quarter);
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

    console.log(`[TherapistsController] findOne called for ${id}, viewer: ${userId}`);
    return this.therapistsService.findOne(id, userId);
  }

  @Get(':id/services')
  async getServices(@Param('id') id: string) {
    return this.therapistsService.getServices(id);
  }

  @Get(':id/availability')
  async getAvailability(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    return this.therapistsService.getAvailability(id, date);
  }
}

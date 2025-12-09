import { Controller, Get, Post, Body, Param, Query, Patch } from '@nestjs/common';
import { BookingsService } from './bookings.service';

export interface BookingItemDto {
  service_id: string;
  service_name: string;
  price: number;
  duration: number;
}

export interface CreateBookingDto {
  user_id: string;
  therapist_id?: string;
  salon_id?: string;
  scheduled_at: string; // ISO date string
  duration: number; // Total duration in minutes
  location_type: 'HOME' | 'SALON';
  quarter?: string;
  street?: string;
  landmark?: string;
  city: string;
  region: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
  subtotal: number;
  travel_fee?: number;
  tip?: number;
  total: number;
  notes?: string;
  items: BookingItemDto[]; // Services in the booking
}

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  @Post()
  async create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  async findAll(@Query('userId') userId?: string) {
    return this.bookingsService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.bookingsService.cancel(id, body.reason);
  }

  @Get('contractor/:contractorId')
  async findForContractor(
    @Param('contractorId') contractorId: string,
    @Query('status') status?: string,
  ) {
    console.log('📥 [BookingsController] GET /bookings/contractor/' + contractorId);
    console.log('📥 [BookingsController] Status filter:', status || 'none');
    const result = await this.bookingsService.findForContractor(contractorId, status);
    console.log('📤 [BookingsController] Returning', result?.length || 0, 'bookings');
    return result;
  }

  @Patch(':id/confirm')
  async confirm(@Param('id') id: string) {
    console.log('📥 [BookingsController] PATCH /bookings/' + id + '/confirm');
    return this.bookingsService.confirmBooking(id);
  }

  @Patch(':id/decline')
  async decline(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    console.log('📥 [BookingsController] PATCH /bookings/' + id + '/decline');
    return this.bookingsService.declineBooking(id, body.reason);
  }

  @Patch(':id/complete')
  async complete(@Param('id') id: string) {
    console.log('📥 [BookingsController] PATCH /bookings/' + id + '/complete');
    return this.bookingsService.completeBooking(id);
  }

  @Patch(':id/start')
  async start(@Param('id') id: string) {
    console.log('📥 [BookingsController] PATCH /bookings/' + id + '/start');
    return this.bookingsService.startBooking(id);
  }
}

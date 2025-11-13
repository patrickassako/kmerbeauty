import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';

export interface CreateBookingDto {
  user_id: string;
  service_id: string;
  provider_id: string;
  provider_type: 'therapist' | 'salon';
  scheduled_date: string;
  scheduled_time: string;
  price: number;
  notes?: string;
}

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

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
}

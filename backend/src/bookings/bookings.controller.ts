import { Controller, Get, Post, Body, Param, Query, Patch, Headers, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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

export interface AgentBookingDto {
  customerPhone: string;
  customerName?: string;
  serviceIds: string[];
  therapistId?: string;
  salonId?: string;
  scheduledAt: string;
  city: string;
  quarter?: string;
  street?: string;
  notes?: string; // Notes de réservation du client
}

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  @Post()
  async create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Post('agent')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Stricter: 10 requests per minute for agent endpoint
  async createAgentBooking(
    @Body() body: AgentBookingDto,
    @Headers('x-agent-key') agentKey: string,
  ) {
    // 1. Validate API Key
    const validAgentKey = process.env.WHATSAPP_AGENT_KEY;
    if (!validAgentKey || agentKey !== validAgentKey) {
      console.warn('🚫 [BookingsController] Invalid or missing agent key');
      throw new UnauthorizedException('Invalid or missing agent key');
    }

    // 2. Validate phone number format (Cameroon: +237XXXXXXXXX)
    const phoneRegex = /^\+237[0-9]{9}$/;
    if (!body.customerPhone || !phoneRegex.test(body.customerPhone)) {
      throw new BadRequestException('Invalid phone number format. Expected: +237XXXXXXXXX');
    }

    // 3. Validate required fields
    if (!body.serviceIds || body.serviceIds.length === 0) {
      throw new BadRequestException('At least one serviceId is required');
    }
    if (!body.scheduledAt) {
      throw new BadRequestException('scheduledAt is required');
    }
    if (!body.city) {
      throw new BadRequestException('city is required');
    }

    console.log('✅ [BookingsController] Agent booking request validated');
    return this.bookingsService.createAgentBooking(body);
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

  // ============ AGENT ENDPOINTS ============

  /**
   * Get all bookings for a client by phone number
   */
  @Get('agent/client/:phone')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async getClientBookings(
    @Param('phone') phone: string,
    @Headers('x-agent-key') agentKey: string,
  ) {
    const validAgentKey = process.env.WHATSAPP_AGENT_KEY;
    if (!validAgentKey || agentKey !== validAgentKey) {
      throw new UnauthorizedException('Invalid or missing agent key');
    }

    return this.bookingsService.findByPhone(phone);
  }

  /**
   * Modify a booking via agent (change date, notes, etc.)
   */
  @Patch('agent/:id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async modifyAgentBooking(
    @Param('id') id: string,
    @Body() body: { scheduledAt?: string; notes?: string; quarter?: string; street?: string },
    @Headers('x-agent-key') agentKey: string,
  ) {
    const validAgentKey = process.env.WHATSAPP_AGENT_KEY;
    if (!validAgentKey || agentKey !== validAgentKey) {
      throw new UnauthorizedException('Invalid or missing agent key');
    }

    return this.bookingsService.updateAgentBooking(id, body);
  }

  /**
   * Cancel a booking via agent
   */
  @Patch('agent/:id/cancel')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async cancelAgentBooking(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Headers('x-agent-key') agentKey: string,
  ) {
    const validAgentKey = process.env.WHATSAPP_AGENT_KEY;
    if (!validAgentKey || agentKey !== validAgentKey) {
      throw new UnauthorizedException('Invalid or missing agent key');
    }

    return this.bookingsService.cancel(id, body.reason || 'Annulé via WhatsApp');
  }
}

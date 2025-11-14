import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ContractorService } from './contractor.service';
import {
  CreateContractorProfileDto,
  UpdateContractorProfileDto,
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  CreateBreakDto,
  CreateExceptionDto,
  CreateContractorServiceDto,
  UpdateContractorServiceDto,
} from './dto/contractor.dto';

@Controller('contractors')
export class ContractorController {
  constructor(private readonly contractorService: ContractorService) {}

  // =====================================================
  // PROFILE ENDPOINTS
  // =====================================================

  @Post('profile')
  async createProfile(@Body() createDto: CreateContractorProfileDto) {
    return this.contractorService.createProfile(createDto);
  }

  @Get('profile/user/:userId')
  async getProfile(@Param('userId') userId: string) {
    return this.contractorService.getProfile(userId);
  }

  @Get('profile/:contractorId')
  async getProfileById(@Param('contractorId') contractorId: string) {
    return this.contractorService.getProfileById(contractorId);
  }

  @Put('profile/:userId')
  async updateProfile(
    @Param('userId') userId: string,
    @Body() updateDto: UpdateContractorProfileDto,
  ) {
    return this.contractorService.updateProfile(userId, updateDto);
  }

  @Get()
  async listContractors(
    @Query('types_of_services') typesOfServices?: string,
    @Query('is_verified') isVerified?: string,
  ) {
    const filters: any = {};

    if (typesOfServices) {
      filters.types_of_services = typesOfServices.split(',');
    }

    if (isVerified !== undefined) {
      filters.is_verified = isVerified === 'true';
    }

    return this.contractorService.listContractors(filters);
  }

  // =====================================================
  // AVAILABILITY ENDPOINTS
  // =====================================================

  @Post('availability')
  async setAvailability(@Body() createDto: CreateAvailabilityDto) {
    return this.contractorService.setAvailability(createDto);
  }

  @Get(':contractorId/availability')
  async getAvailability(@Param('contractorId') contractorId: string) {
    return this.contractorService.getAvailability(contractorId);
  }

  @Put(':contractorId/availability/:dayOfWeek')
  async updateAvailability(
    @Param('contractorId') contractorId: string,
    @Param('dayOfWeek') dayOfWeek: string,
    @Body() updateDto: UpdateAvailabilityDto,
  ) {
    return this.contractorService.updateAvailability(
      contractorId,
      parseInt(dayOfWeek),
      updateDto,
    );
  }

  @Post(':contractorId/availability/reset')
  async resetAvailability(@Param('contractorId') contractorId: string) {
    return this.contractorService.resetAvailability(contractorId);
  }

  // =====================================================
  // BREAKS ENDPOINTS
  // =====================================================

  @Post('breaks')
  async addBreak(@Body() createDto: CreateBreakDto) {
    return this.contractorService.addBreak(createDto);
  }

  @Get(':contractorId/breaks')
  async getBreaks(@Param('contractorId') contractorId: string) {
    return this.contractorService.getBreaks(contractorId);
  }

  @Delete('breaks/:breakId')
  async deleteBreak(@Param('breakId') breakId: string) {
    return this.contractorService.deleteBreak(breakId);
  }

  // =====================================================
  // EXCEPTIONS ENDPOINTS
  // =====================================================

  @Post('exceptions')
  async addException(@Body() createDto: CreateExceptionDto) {
    return this.contractorService.addException(createDto);
  }

  @Get(':contractorId/exceptions')
  async getExceptions(
    @Param('contractorId') contractorId: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.contractorService.getExceptions(contractorId, startDate, endDate);
  }

  @Delete('exceptions/:exceptionId')
  async deleteException(@Param('exceptionId') exceptionId: string) {
    return this.contractorService.deleteException(exceptionId);
  }

  // =====================================================
  // SERVICES ENDPOINTS
  // =====================================================

  @Post('services')
  async addService(@Body() createDto: CreateContractorServiceDto) {
    return this.contractorService.addService(createDto);
  }

  @Get(':contractorId/services')
  async getServices(@Param('contractorId') contractorId: string) {
    return this.contractorService.getServices(contractorId);
  }

  @Put('services/:serviceId')
  async updateService(
    @Param('serviceId') serviceId: string,
    @Body() updateDto: UpdateContractorServiceDto,
  ) {
    return this.contractorService.updateService(serviceId, updateDto);
  }

  @Delete('services/:serviceId')
  async deleteService(@Param('serviceId') serviceId: string) {
    return this.contractorService.deleteService(serviceId);
  }

  // =====================================================
  // DASHBOARD ENDPOINTS
  // =====================================================

  @Get(':contractorId/dashboard')
  async getDashboard(
    @Param('contractorId') contractorId: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.contractorService.getDashboardStats(contractorId, startDate, endDate);
  }

  @Get(':contractorId/appointments')
  async getUpcomingAppointments(
    @Param('contractorId') contractorId: string,
    @Query('day') dayFilter?: string,
  ) {
    return this.contractorService.getUpcomingAppointments(contractorId, dayFilter);
  }

  @Get(':contractorId/earnings')
  async getEarnings(
    @Param('contractorId') contractorId: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.contractorService.getEarnings(contractorId, startDate, endDate);
  }

  @Post(':contractorId/check-availability')
  async checkAvailability(
    @Param('contractorId') contractorId: string,
    @Body() body: { date_time: string; duration: number },
  ) {
    return {
      available: await this.contractorService.checkAvailability(
        contractorId,
        body.date_time,
        body.duration,
      ),
    };
  }
}

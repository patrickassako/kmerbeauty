import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PacksService } from './packs.service';
import { CreatePackDto, UpdatePackDto, PackResponseDto } from './dto/packs.dto';

@Controller('packs')
export class PacksController {
    constructor(private readonly packsService: PacksService) { }

    @Get()
    async getAll(@Query('city') city?: string): Promise<PackResponseDto[]> {
        return this.packsService.getAll(city);
    }

    @Get('my')
    @UseGuards(AuthGuard)
    async getMine(@Request() req): Promise<PackResponseDto[]> {
        return this.packsService.getMine(req.user.id);
    }

    @Get(':id')
    async getById(@Param('id') id: string): Promise<PackResponseDto> {
        return this.packsService.getById(id);
    }

    @Post()
    @UseGuards(AuthGuard)
    async create(
        @Request() req,
        @Body() dto: CreatePackDto,
        @Query('providerType') providerType: 'therapist' | 'salon' = 'therapist',
    ): Promise<PackResponseDto> {
        return this.packsService.create(req.user.id, providerType, dto);
    }

    @Put(':id')
    @UseGuards(AuthGuard)
    async update(
        @Param('id') id: string,
        @Request() req,
        @Body() dto: UpdatePackDto,
    ): Promise<PackResponseDto> {
        return this.packsService.update(id, req.user.id, dto);
    }

    @Post(':id/click')
    async trackClick(@Param('id') id: string): Promise<{ success: boolean }> {
        await this.packsService.trackClick(id);
        return { success: true };
    }

    @Delete(':id')
    @UseGuards(AuthGuard)
    async delete(
        @Param('id') id: string,
        @Request() req,
    ): Promise<{ success: boolean }> {
        await this.packsService.delete(id, req.user.id);
        return { success: true };
    }
}

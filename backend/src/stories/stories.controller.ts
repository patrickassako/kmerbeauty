import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    UseGuards,
    Request,
    Query,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StoriesService } from './stories.service';
import { CreateStoryDto, StoryResponseDto } from './dto/stories.dto';

@Controller('stories')
export class StoriesController {
    constructor(private readonly storiesService: StoriesService) { }

    @Get()
    async getAll(@Request() req): Promise<StoryResponseDto[]> {
        const userId = req.user?.id;
        return this.storiesService.getAll(userId);
    }

    @Get('my')
    @UseGuards(AuthGuard)
    async getMine(@Request() req): Promise<StoryResponseDto[]> {
        return this.storiesService.getMine(req.user.id);
    }

    @Get(':id')
    async getById(
        @Param('id') id: string,
        @Request() req,
    ): Promise<StoryResponseDto> {
        const userId = req.user?.id;
        return this.storiesService.getById(id, userId);
    }

    @Post()
    @UseGuards(AuthGuard)
    async create(
        @Request() req,
        @Body() dto: CreateStoryDto,
        @Query('providerType') providerType: 'therapist' | 'salon' = 'therapist',
    ): Promise<StoryResponseDto> {
        return this.storiesService.create(req.user.id, providerType, dto);
    }

    @Post(':id/view')
    @UseGuards(AuthGuard)
    async markViewed(
        @Param('id') id: string,
        @Request() req,
    ): Promise<{ success: boolean }> {
        await this.storiesService.markViewed(id, req.user.id);
        return { success: true };
    }

    @Delete(':id')
    @UseGuards(AuthGuard)
    async delete(
        @Param('id') id: string,
        @Request() req,
    ): Promise<{ success: boolean }> {
        await this.storiesService.delete(id, req.user.id);
        return { success: true };
    }
}

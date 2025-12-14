import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto, BlockUserDto } from './dto/reports.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    /**
     * Create a new report
     * POST /reports
     */
    @Post()
    async createReport(@Request() req, @Body() dto: CreateReportDto) {
        return this.reportsService.createReport(req.user.id, dto);
    }

    /**
     * Get my sent reports
     * GET /reports/my
     */
    @Get('my')
    async getMyReports(@Request() req) {
        return this.reportsService.getMyReports(req.user.id);
    }

    /**
     * Block a user
     * POST /reports/blocks/:userId
     */
    @Post('blocks/:userId')
    async blockUser(
        @Request() req,
        @Param('userId') userId: string,
        @Body() dto?: BlockUserDto,
    ) {
        return this.reportsService.blockUser(req.user.id, userId, dto);
    }

    /**
     * Unblock a user
     * DELETE /reports/blocks/:userId
     */
    @Delete('blocks/:userId')
    async unblockUser(@Request() req, @Param('userId') userId: string) {
        return this.reportsService.unblockUser(req.user.id, userId);
    }

    /**
     * Get list of blocked users
     * GET /reports/blocks
     */
    @Get('blocks')
    async getBlockedUsers(@Request() req) {
        return this.reportsService.getBlockedUsers(req.user.id);
    }

    /**
     * Check if a specific user is blocked
     * GET /reports/blocks/check/:userId
     */
    @Get('blocks/check/:userId')
    async checkIfBlocked(@Request() req, @Param('userId') userId: string) {
        return this.reportsService.isBlocked(req.user.id, userId);
    }

    /**
     * Check mutual block (either direction)
     * GET /reports/blocks/mutual/:userId
     */
    @Get('blocks/mutual/:userId')
    async checkMutualBlock(@Request() req, @Param('userId') userId: string) {
        return this.reportsService.isMutuallyBlocked(req.user.id, userId);
    }
}

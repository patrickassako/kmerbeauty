import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CreditsService } from './credits.service';
// Assuming AuthGuard exists, if not I will skip it for now or import from auth module
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { InteractionTrackingService } from './interaction-tracking.service';

@Controller('credits')
export class CreditsController {
    constructor(
        private readonly creditsService: CreditsService,
        private readonly interactionTrackingService: InteractionTrackingService
    ) { }

    @Get('balance/:providerId')
    async getBalance(
        @Param('providerId') providerId: string,
        @Query('type') type: 'therapist' | 'salon',
    ) {
        return this.creditsService.getBalance(providerId, type);
    }

    @Get('transactions/:providerId')
    async getTransactions(
        @Param('providerId') providerId: string,
        @Query('type') type: 'therapist' | 'salon',
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        return this.creditsService.getTransactions(providerId, type, page, limit);
    }

    @Get('packs')
    async getPacks() {
        return this.creditsService.getPacks();
    }

    @Post('track')
    async trackInteraction(@Body() body: {
        providerId: string,
        providerType: 'therapist' | 'salon',
        interactionType: string,
        userId: string, // Can be guest ID
        referenceId?: string, // Optional custom reference (e.g. bookingId)
        metadata?: any
    }) {
        console.log(`[CreditsController] Manual track request: ${body.interactionType} for ${body.providerId} by ${body.userId}`);

        // Use provided referenceId or fallback to userId
        const refId = body.referenceId || body.userId;

        await this.interactionTrackingService.debitCredits(
            body.providerId,
            body.providerType,
            body.interactionType,
            refId,
            { ...body.metadata, userId: body.userId, source: 'web_manual_tracking' }
        );

        return { success: true };
    }
}

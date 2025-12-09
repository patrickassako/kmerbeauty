import { Controller, Post, Body, Get, Param, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('initiate')
    async initiatePayment(@Body() body: any) {
        if (!body.amount || !body.email || !body.providerId || !body.packId) {
            throw new BadRequestException('Missing required fields');
        }

        return await this.paymentsService.initiatePayment(body);
    }

    @Get('verify/:transactionId')
    async verifyPayment(@Param('transactionId') transactionId: string) {
        return this.paymentsService.verifyPayment(transactionId);
    }

    // TEST ONLY: Manually complete a payment
    @Post('test/complete/:transactionId')
    async testCompletePayment(@Param('transactionId') transactionId: string) {
        return this.paymentsService.manuallyCompletePayment(transactionId);
    }

    @Post('webhook/flutterwave')
    async handleFlutterwaveWebhook(
        @Body() body: any,
        @Body('event') event: string,
        @Body('data') data: any,
    ) {
        // Flutterwave sends different event types
        // We're interested in 'charge.completed' for successful payments
        if (event === 'charge.completed' && data?.status === 'successful') {
            try {
                const transactionId = data.id;
                await this.paymentsService.verifyPayment(transactionId.toString());
                return { status: 'success', message: 'Payment processed' };
            } catch (error) {
                console.error('Webhook processing error:', error);
                return { status: 'error', message: error.message };
            }
        }

        return { status: 'ignored', message: 'Event not processed' };
    }
}

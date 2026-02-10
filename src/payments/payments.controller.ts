import {
    Controller,
    Post,
    Body,
    UseGuards,
    Request,
    Headers,
    BadRequestException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @UseGuards(JwtAuthGuard)
    @Post('checkout')
    async createCheckout(@Body('auctionId') auctionId: string, @Request() req: any) {
        return this.paymentsService.createCheckoutSession(auctionId, req.user.userId);
    }

    @Post('webhook')
    async handleWebhook(
        @Headers('stripe-signature') signature: string,
        @Request() req: any,
    ) {
        const rawReq = req as RawBodyRequest<ExpressRequest>;
        if (!signature) {
            throw new BadRequestException('Missing stripe-signature header');
        }
        if (!rawReq.rawBody) {
            throw new BadRequestException('Missing raw body');
        }
        return this.paymentsService.handleWebhook(signature, rawReq.rawBody);
    }
}

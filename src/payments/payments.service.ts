import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Auction } from '../auctions/entities/auction.entity';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    private stripe: Stripe;

    constructor(
        private configService: ConfigService,
        @InjectRepository(Auction)
        private auctionsRepository: Repository<Auction>,
        private transactionsService: TransactionsService,
    ) {
        const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (!stripeKey) {
            throw new Error('STRIPE_SECRET_KEY is not defined');
        }
        this.stripe = new Stripe(stripeKey, {
            apiVersion: '2025-01-27' as any,
        });
    }

    async createCheckoutSession(auctionId: string, userId: string) {
        const auction = await this.auctionsRepository.findOne({
            where: { id: auctionId },
            relations: ['seller'],
        });

        if (!auction) {
            throw new NotFoundException('Auction not found');
        }

        if (auction.status !== 'ended' || auction.winnerId !== userId) {
            throw new BadRequestException('You are not the winner of this auction or it hasn\'t ended');
        }

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: auction.title,
                            description: auction.description,
                            images: [auction.imageUrl],
                        },
                        unit_amount: Math.round(Number(auction.currentPrice) * 100), // Stripe expects cents

                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${this.configService.get('FRONTEND_URL')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${this.configService.get('FRONTEND_URL')}/checkout/cancel`,
            metadata: {
                auctionId: auction.id,
                buyerId: userId,
                sellerId: auction.sellerId,
            },
        });

        return { url: session.url };
    }

    async handleWebhook(signature: string, payload: Buffer) {
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
        }
        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                webhookSecret,
            );
        } catch (err) {
            throw new BadRequestException(`Webhook Error: ${err.message}`);
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            await this.processSuccessfulPayment(session);
        }

        return { received: true };
    }

    private async processSuccessfulPayment(session: Stripe.Checkout.Session) {
        const metadata = session.metadata;
        if (!metadata) {
            this.logger.error('No metadata in Stripe session');
            return;
        }
        const { auctionId, buyerId, sellerId } = metadata;
        const amount = (session.amount_total || 0) / 100;

        // Create transaction record
        await this.transactionsService.createTransaction({
            auctionId: auctionId as string,
            buyerId: buyerId as string,
            sellerId: sellerId as string,
            amount,
            paymentMethod: session.payment_method_types[0],
            stripePaymentId: session.payment_intent as string,
            status: 'completed',
        });

        // Update auction status to completed
        await this.auctionsRepository.update(auctionId as string, { status: 'completed' as any });
    }
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Auction } from './entities/auction.entity';
import { Bid } from './entities/bid.entity';
import { BiddingGateway } from '../bids/bidding.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuctionSchedulerService {
    private readonly logger = new Logger(AuctionSchedulerService.name);

    constructor(
        @InjectRepository(Auction)
        private auctionsRepository: Repository<Auction>,
        @InjectRepository(Bid)
        private bidsRepository: Repository<Bid>,
        private biddingGateway: BiddingGateway,
        private notificationsService: NotificationsService,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        this.logger.debug('Checking for ended auctions...');

        const now = new Date();
        const endedAuctions = await this.auctionsRepository.find({
            where: {
                status: 'active',
                endTime: LessThan(now),
            },
        });

        if (endedAuctions.length === 0) {
            return;
        }

        this.logger.log(`Found ${endedAuctions.length} ended auctions. Processing...`);

        for (const auction of endedAuctions) {
            await this.processEndedAuction(auction);
        }
    }

    private async processEndedAuction(auction: Auction) {
        // Find highest bid
        const winningBid = await this.bidsRepository.findOne({
            where: { auctionId: auction.id },
            order: { amount: 'DESC' },
            relations: ['bidder'],
        });

        if (winningBid) {
            auction.winnerId = winningBid.bidderId;
            auction.currentPrice = winningBid.amount;
            winningBid.isWinning = true;
            await this.bidsRepository.save(winningBid);

            this.logger.log(`Auction ${auction.id} won by ${winningBid.bidderId} for ${winningBid.amount}`);

            // Send notification to winner
            await this.notificationsService.create({
                userId: winningBid.bidderId,
                type: 'won',
                title: 'You won an auction!',
                message: `Congratulations! You are the winner of "${auction.title}" with a bid of $${winningBid.amount}. Proceed to payment to claim your item.`,
                relatedAuctionId: auction.id,
            });

            // Send notification to seller
            await this.notificationsService.create({
                userId: auction.sellerId,
                type: 'sold',
                title: 'Item Sold!',
                message: `Great news! Your item "${auction.title}" has been sold to ${winningBid.bidder?.name || 'a buyer'} for $${winningBid.amount}.`,
                relatedAuctionId: auction.id,
            });
        } else {
            this.logger.log(`Auction ${auction.id} ended with no bids.`);
            // Send notification to seller (unsold)
            await this.notificationsService.create({
                userId: auction.sellerId,
                type: 'unsold',
                title: 'Auction Ended (No Bids)',
                message: `Your auction for "${auction.title}" has ended without any bids. You can relist the item to try again!`,
                relatedAuctionId: auction.id,
            });
        }

        auction.status = 'ended';
        await this.auctionsRepository.save(auction);

        // Broadcast end event
        this.biddingGateway.broadcastAuctionEnded(auction.id, {
            auctionId: auction.id,
            status: 'ended',
            winnerId: auction.winnerId,
            currentPrice: auction.currentPrice,
        });
    }
}

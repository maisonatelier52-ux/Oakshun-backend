import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Auction } from './entities/auction.entity';
import { Bid } from './entities/bid.entity';
import { BiddingGateway } from '../bids/bidding.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuctionSchedulerService {
    private readonly logger = new Logger(AuctionSchedulerService.name);

    constructor(
        @InjectModel(Auction.name)
        private auctionModel: Model<Auction>,
        @InjectModel(Bid.name)
        private bidModel: Model<Bid>,
        private biddingGateway: BiddingGateway,
        private notificationsService: NotificationsService,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        this.logger.debug('Checking for ended auctions...');

        const now = new Date();
        const endedAuctions = await this.auctionModel.find({
            status: 'active',
            endTime: { $lt: now },
        }).exec();

        if (endedAuctions.length === 0) {
            return;
        }

        this.logger.log(`Found ${endedAuctions.length} ended auctions. Processing...`);

        for (const auction of endedAuctions) {
            await this.processEndedAuction(auction);
        }
    }

    private async processEndedAuction(auction: any) {
        // Find highest bid
        const winningBid = await this.bidModel.findOne({ auctionId: auction._id })
            .sort({ amount: -1 })
            .populate('bidderId')
            .exec();

        if (winningBid) {
            auction.winnerId = winningBid.bidderId;
            auction.currentPrice = winningBid.amount;
            winningBid.isWinning = true;
            await winningBid.save();

            this.logger.log(`Auction ${auction._id.toString()} won by ${winningBid.bidderId._id.toString()} for ${winningBid.amount}`);

            // Send notification to winner
            await this.notificationsService.create({
                userId: winningBid.bidderId._id.toString(),
                type: 'won',
                title: 'You won an auction!',
                message: `Congratulations! You are the winner of "${auction.title}" with a bid of $${winningBid.amount}. Proceed to payment to claim your item.`,
                relatedAuctionId: auction._id.toString(),
            });

            // Send notification to seller
            await this.notificationsService.create({
                userId: auction.sellerId.toString(),
                type: 'sold',
                title: 'Item Sold!',
                message: `Great news! Your item "${auction.title}" has been sold to ${(winningBid.bidderId as any)?.name || 'a buyer'} for $${winningBid.amount}.`,
                relatedAuctionId: auction._id.toString(),
            });
        } else {
            this.logger.log(`Auction ${auction._id.toString()} ended with no bids.`);
            // Send notification to seller (unsold)
            await this.notificationsService.create({
                userId: auction.sellerId.toString(),
                type: 'unsold',
                title: 'Auction Ended (No Bids)',
                message: `Your auction for "${auction.title}" has ended without any bids. You can relist the item to try again!`,
                relatedAuctionId: auction._id.toString(),
            });
        }

        auction.status = 'ended';
        await auction.save();

        // Broadcast end event
        this.biddingGateway.broadcastAuctionEnded(auction._id.toString(), {
            auctionId: auction._id.toString(),
            status: 'ended',
            winnerId: auction.winnerId ? auction.winnerId.toString() : undefined,
            currentPrice: auction.currentPrice,
        });
    }
}

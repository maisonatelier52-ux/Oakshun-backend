import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bid } from '../auctions/entities/bid.entity';
import { Auction } from '../auctions/entities/auction.entity';
import { CreateBidDto } from '../auctions/dto/create-bid.dto';

import { BiddingGateway } from './bidding.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BidsService {
    constructor(
        @InjectRepository(Bid)
        private bidsRepository: Repository<Bid>,
        @InjectRepository(Auction)
        private auctionsRepository: Repository<Auction>,
        private biddingGateway: BiddingGateway,
        private notificationsService: NotificationsService,
    ) { }

    async placeBid(createBidDto: CreateBidDto, userId: string): Promise<Bid> {
        const { auctionId, amount } = createBidDto;

        const auction = await this.auctionsRepository.findOne({
            where: { id: auctionId },
            relations: ['seller'],
        });

        if (!auction) {
            throw new NotFoundException('Auction not found');
        }

        if (auction.status !== 'active') {
            throw new BadRequestException('Auction is not active');
        }

        if (new Date() > auction.endTime) {
            throw new BadRequestException('Auction has ended');
        }

        if (auction.sellerId === userId) {
            throw new ForbiddenException('You cannot bid on your own auction');
        }

        if (amount <= auction.currentPrice) {
            throw new BadRequestException(
                `Bid amount must be greater than current price: ${auction.currentPrice}`,
            );
        }

        // Check for outbid previous highest bidder
        const previousHighestBid = await this.getHighestBid(auctionId);

        // Update auction current price
        auction.currentPrice = amount;
        await this.auctionsRepository.save(auction);

        if (previousHighestBid && previousHighestBid.bidderId !== userId) {
            await this.notificationsService.create({
                userId: previousHighestBid.bidderId,
                type: 'outbid',
                title: 'You have been outbid!',
                message: `Someone placed a higher bid of $${amount} on "${auction.title}". Bid again to stay in the lead!`,
                relatedAuctionId: auction.id,
            });
        }

        // Mark previous winning bids as not winning (if needed logic, usually handled by simply taking the highest)
        // For now, we assume the latest valid bid is the potential winner until end.
        // In a more complex system we might want to flag the previous highest bid.

        const bid = this.bidsRepository.create({
            auctionId,
            bidderId: userId,
            amount,
            isWinning: false, // Will be set to true when auction ends
        });

        const savedBid = await this.bidsRepository.save(bid);

        // Broadcast the new bid to everyone in the auction room
        this.biddingGateway.broadcastNewBid(auctionId, {
            bidId: savedBid.id,
            amount: savedBid.amount,
            bidderId: savedBid.bidderId,
            createdAt: savedBid.createdAt
        });

        return savedBid;
    }

    async getBidsByAuction(auctionId: string): Promise<Bid[]> {
        return this.bidsRepository.find({
            where: { auctionId },
            order: { amount: 'DESC' },
            relations: ['bidder'],
        });
    }

    async getBidsByUser(userId: string): Promise<Bid[]> {
        return this.bidsRepository.find({
            where: { bidderId: userId },
            order: { createdAt: 'DESC' },
            relations: ['auction'],
        });
    }

    async getHighestBid(auctionId: string): Promise<Bid | null> {
        const bid = await this.bidsRepository.findOne({
            where: { auctionId },
            order: { amount: 'DESC' },
            relations: ['bidder'],
        });
        return bid;
    }
}

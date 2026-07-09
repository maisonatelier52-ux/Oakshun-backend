import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bid } from '../auctions/entities/bid.entity';
import { Auction } from '../auctions/entities/auction.entity';
import { CreateBidDto } from '../auctions/dto/create-bid.dto';

import { BiddingGateway } from './bidding.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BidsService {
    constructor(
        @InjectModel(Bid.name)
        private bidModel: Model<Bid>,
        @InjectModel(Auction.name)
        private auctionModel: Model<Auction>,
        private biddingGateway: BiddingGateway,
        private notificationsService: NotificationsService,
    ) { }

    async placeBid(createBidDto: CreateBidDto, userId: string): Promise<any> {
        const { auctionId, amount } = createBidDto;

        const auction = await this.auctionModel.findById(auctionId).populate('sellerId').exec();

        if (!auction) {
            throw new NotFoundException('Auction not found');
        }

        if (auction.status !== 'active') {
            throw new BadRequestException('Auction is not active');
        }

        if (new Date() > auction.endTime) {
            throw new BadRequestException('Auction has ended');
        }

        if (auction.sellerId._id.toString() === userId) {
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
        await auction.save();

        if (previousHighestBid && previousHighestBid.bidderId.toString() !== userId) {
            await this.notificationsService.create({
                userId: previousHighestBid.bidderId.toString(),
                type: 'outbid',
                title: 'You have been outbid!',
                message: `Someone placed a higher bid of $${amount} on "${auction.title}". Bid again to stay in the lead!`,
                relatedAuctionId: auction._id.toString(),
            });
        }

        const bid = new this.bidModel({
            auctionId,
            bidderId: userId,
            amount,
            isWinning: false, // Will be set to true when auction ends
        });

        const savedBid = await bid.save();

        // Broadcast the new bid to everyone in the auction room
        this.biddingGateway.broadcastNewBid(auctionId, {
            bidId: savedBid._id.toString(),
            amount: savedBid.amount,
            bidderId: savedBid.bidderId.toString(),
            createdAt: (savedBid as any).createdAt
        });

        return savedBid;
    }

    async getBidsByAuction(auctionId: string): Promise<any[]> {
        const bids = await this.bidModel
            .find({ auctionId })
            .sort({ amount: -1 })
            .populate('bidderId')
            .lean()
            .exec();
        return bids.map(bid => ({ ...bid, id: bid._id.toString(), bidder: bid.bidderId }));
    }

    async getBidsByUser(userId: string): Promise<any[]> {
        const bids = await this.bidModel
            .find({ bidderId: userId })
            .sort({ createdAt: -1 })
            .populate('auctionId')
            .lean()
            .exec();
        return bids.map(bid => ({ ...bid, id: bid._id.toString(), auction: bid.auctionId }));
    }

    async getHighestBid(auctionId: string): Promise<any | null> {
        const bid = await this.bidModel
            .findOne({ auctionId })
            .sort({ amount: -1 })
            .populate('bidderId')
            .lean()
            .exec();
        if (!bid) return null;
        return { ...bid, id: bid._id.toString(), bidder: bid.bidderId };
    }
}

import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Auction } from './entities/auction.entity';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { Bid } from './entities/bid.entity';
import { Favorite } from '../users/entities/favorite.entity';

@Injectable()
export class AuctionsService {
    constructor(
        @InjectModel(Auction.name)
        private auctionModel: Model<Auction>,
        @InjectModel(Bid.name)
        private bidModel: Model<Bid>,
        @InjectModel(Favorite.name)
        private favoriteModel: Model<Favorite>,
    ) { }

    async create(
        createAuctionDto: CreateAuctionDto,
        sellerId: string,
    ): Promise<Auction> {
        const endTime = new Date(createAuctionDto.endTime);
        if (endTime <= new Date()) {
            throw new BadRequestException('End time must be in the future');
        }

        const auction = new this.auctionModel({
            ...createAuctionDto,
            sellerId,
            currentPrice: createAuctionDto.startingPrice,
            status: 'active',
        });

        return auction.save();
    }

    async findAll(filters?: {
        category?: string;
        status?: string;
        search?: string;
        minPrice?: number;
        maxPrice?: number;
        sellerId?: string;
        page?: number;
        limit?: number;
    }): Promise<{ auctions: any[]; total: number; page: number; totalPages: number }> {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;

        const query: any = {};

        if (filters?.category) {
            query.category = filters.category;
        }
        if (filters?.status) {
            query.status = filters.status;
        }
        if (filters?.search) {
            query.$or = [
                { title: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } },
            ];
        }
        if (filters?.minPrice || filters?.maxPrice) {
            query.currentPrice = {};
            if (filters.minPrice) query.currentPrice.$gte = filters.minPrice;
            if (filters.maxPrice) query.currentPrice.$lte = filters.maxPrice;
        }
        if (filters?.sellerId) {
            query.sellerId = filters.sellerId;
        }

        const total = await this.auctionModel.countDocuments(query).exec();
        
        const auctions = await this.auctionModel
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sellerId')
            .populate('winnerId')
            .lean()
            .exec();

        // Add favoritesCount
        const auctionsWithStats = await Promise.all(
            auctions.map(async (auction) => {
                const favoritesCount = await this.favoriteModel.countDocuments({ auctionId: auction._id }).exec();
                const mapped = { ...auction, id: auction._id.toString(), favoritesCount, seller: auction.sellerId, winner: auction.winnerId };
                return mapped;
            })
        );

        return {
            auctions: auctionsWithStats,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: string): Promise<any> {
        const auction = await this.auctionModel
            .findById(id)
            .populate('sellerId')
            .populate('winnerId')
            .lean()
            .exec();

        if (!auction) {
            throw new NotFoundException(`Auction with ID ${id} not found`);
        }

        const favoritesCount = await this.favoriteModel.countDocuments({ auctionId: auction._id }).exec();
        
        return {
            ...auction,
            id: auction._id.toString(),
            seller: auction.sellerId,
            winner: auction.winnerId,
            favoritesCount
        };
    }

    async update(
        id: string,
        updateAuctionDto: UpdateAuctionDto,
        userId: string,
        userRole: string,
    ): Promise<Auction> {
        const auction = await this.auctionModel.findById(id).exec();
        if (!auction) throw new NotFoundException('Auction not found');

        if (auction.sellerId.toString() !== userId && userRole !== 'admin') {
            throw new ForbiddenException('You can only update your own auctions');
        }

        if (auction.status === 'ended' && userRole !== 'admin') {
            throw new BadRequestException('Cannot update ended auctions');
        }

        Object.assign(auction, updateAuctionDto);
        return auction.save();
    }

    async remove(id: string, userId: string, userRole: string): Promise<void> {
        const auction = await this.auctionModel.findById(id).exec();
        if (!auction) throw new NotFoundException('Auction not found');

        if (auction.sellerId.toString() !== userId && userRole !== 'admin') {
            throw new ForbiddenException('You can only delete your own auctions');
        }

        if (auction.currentPrice > auction.startingPrice && userRole !== 'admin') {
            throw new BadRequestException(
                'Cannot delete auctions that have received bids',
            );
        }

        await this.auctionModel.deleteOne({ _id: id }).exec();
    }

    async findEndingSoon(hours: number = 24): Promise<any[]> {
        const now = new Date();
        const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

        const auctions = await this.auctionModel
            .find({
                status: 'active',
                endTime: { $lt: futureTime }
            })
            .sort({ endTime: 1 })
            .limit(10)
            .populate('sellerId')
            .lean()
            .exec();

        return Promise.all(
            auctions.map(async (auction) => {
                const favoritesCount = await this.favoriteModel.countDocuments({ auctionId: auction._id }).exec();
                return { ...auction, id: auction._id.toString(), favoritesCount, seller: auction.sellerId };
            })
        );
    }

    async findByCategory(category: string): Promise<any[]> {
        const auctions = await this.auctionModel
            .find({
                category,
                status: 'active'
            })
            .sort({ createdAt: -1 })
            .populate('sellerId')
            .lean()
            .exec();

        return Promise.all(
            auctions.map(async (auction) => {
                const favoritesCount = await this.favoriteModel.countDocuments({ auctionId: auction._id }).exec();
                return { ...auction, id: auction._id.toString(), favoritesCount, seller: auction.sellerId };
            })
        );
    }

    async findBidsByAuction(auctionId: string): Promise<any[]> {
        const bids = await this.bidModel
            .find({ auctionId })
            .sort({ amount: -1 })
            .populate('bidderId')
            .lean()
            .exec();
            
        return bids.map(bid => ({ ...bid, id: bid._id.toString(), bidder: bid.bidderId }));
    }
}

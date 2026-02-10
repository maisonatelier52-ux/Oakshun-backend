import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, LessThan, MoreThan } from 'typeorm';
import { Auction } from './entities/auction.entity';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { Bid } from './entities/bid.entity';

@Injectable()
export class AuctionsService {
    constructor(
        @InjectRepository(Auction)
        private auctionsRepository: Repository<Auction>,
        @InjectRepository(Bid)
        private bidsRepository: Repository<Bid>,
    ) { }

    async create(
        createAuctionDto: CreateAuctionDto,
        sellerId: string,
    ): Promise<Auction> {
        // Validate end time is in the future
        const endTime = new Date(createAuctionDto.endTime);
        if (endTime <= new Date()) {
            throw new BadRequestException('End time must be in the future');
        }

        const auction = this.auctionsRepository.create({
            ...createAuctionDto,
            sellerId,
            currentPrice: createAuctionDto.startingPrice,
            status: 'active',
        });

        return this.auctionsRepository.save(auction);
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
    }): Promise<{ auctions: Auction[]; total: number; page: number; totalPages: number }> {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;

        const queryBuilder = this.auctionsRepository
            .createQueryBuilder('auction')
            .leftJoinAndSelect('auction.seller', 'seller')
            .leftJoinAndSelect('auction.winner', 'winner')
            .loadRelationCountAndMap('auction.favoritesCount', 'auction.favorites');

        // Apply filters
        if (filters?.category) {
            queryBuilder.andWhere('auction.category = :category', {
                category: filters.category,
            });
        }

        if (filters?.status) {
            queryBuilder.andWhere('auction.status = :status', {
                status: filters.status,
            });
        }

        if (filters?.search) {
            queryBuilder.andWhere(
                '(auction.title ILIKE :search OR auction.description ILIKE :search)',
                { search: `%${filters.search}%` },
            );
        }

        if (filters?.minPrice) {
            queryBuilder.andWhere('auction.currentPrice >= :minPrice', {
                minPrice: filters.minPrice,
            });
        }

        if (filters?.maxPrice) {
            queryBuilder.andWhere('auction.currentPrice <= :maxPrice', {
                maxPrice: filters.maxPrice,
            });
        }

        if (filters?.sellerId) {
            queryBuilder.andWhere('auction.sellerId = :sellerId', {
                sellerId: filters.sellerId,
            });
        }

        // Get total count
        const total = await queryBuilder.getCount();

        // Apply pagination and ordering
        const auctions = await queryBuilder
            .orderBy('auction.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getMany();

        return {
            auctions,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: string): Promise<Auction> {
        const auction = await this.auctionsRepository
            .createQueryBuilder('auction')
            .leftJoinAndSelect('auction.seller', 'seller')
            .leftJoinAndSelect('auction.winner', 'winner')
            .loadRelationCountAndMap('auction.favoritesCount', 'auction.favorites')
            .where('auction.id = :id', { id })
            .getOne();

        if (!auction) {
            throw new NotFoundException(`Auction with ID ${id} not found`);
        }

        return auction;
    }

    async update(
        id: string,
        updateAuctionDto: UpdateAuctionDto,
        userId: string,
        userRole: string,
    ): Promise<Auction> {
        const auction = await this.findOne(id);

        // Only seller or admin can update
        if (auction.sellerId !== userId && userRole !== 'admin') {
            throw new ForbiddenException('You can only update your own auctions');
        }

        // Prevent updating ended auctions
        if (auction.status === 'ended' && userRole !== 'admin') {
            throw new BadRequestException('Cannot update ended auctions');
        }

        Object.assign(auction, updateAuctionDto);
        return this.auctionsRepository.save(auction);
    }

    async remove(id: string, userId: string, userRole: string): Promise<void> {
        const auction = await this.findOne(id);

        // Only seller or admin can delete
        if (auction.sellerId !== userId && userRole !== 'admin') {
            throw new ForbiddenException('You can only delete your own auctions');
        }

        // Prevent deleting auctions with bids (unless admin)
        if (auction.currentPrice > auction.startingPrice && userRole !== 'admin') {
            throw new BadRequestException(
                'Cannot delete auctions that have received bids',
            );
        }

        await this.auctionsRepository.remove(auction);
    }

    async findEndingSoon(hours: number = 24): Promise<Auction[]> {
        const now = new Date();
        const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

        return this.auctionsRepository
            .createQueryBuilder('auction')
            .leftJoinAndSelect('auction.seller', 'seller')
            .loadRelationCountAndMap('auction.favoritesCount', 'auction.favorites')
            .where('auction.status = :status', { status: 'active' })
            .andWhere('auction.endTime < :futureTime', { futureTime })
            .orderBy('auction.endTime', 'ASC')
            .take(10)
            .getMany();
    }

    async findByCategory(category: string): Promise<Auction[]> {
        return this.auctionsRepository
            .createQueryBuilder('auction')
            .leftJoinAndSelect('auction.seller', 'seller')
            .loadRelationCountAndMap('auction.favoritesCount', 'auction.favorites')
            .where('auction.category = :category', { category })
            .andWhere('auction.status = :status', { status: 'active' })
            .orderBy('auction.createdAt', 'DESC')
            .getMany();
    }

    async findBidsByAuction(auctionId: string): Promise<Bid[]> {
        return this.bidsRepository.find({
            where: { auctionId },
            order: { amount: 'DESC' },
            relations: ['bidder'],
        });
    }
}

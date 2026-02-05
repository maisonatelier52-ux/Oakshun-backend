import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auction } from './entities/auction.entity';
import { CreateAuctionDto } from './dto/create-auction.dto';

@Injectable()
export class AuctionsService {
    constructor(
        @InjectRepository(Auction)
        private auctionsRepository: Repository<Auction>,
    ) { }

    async create(createAuctionDto: CreateAuctionDto, sellerId: string): Promise<Auction> {
        const auction = this.auctionsRepository.create({
            ...createAuctionDto,
            sellerId,
            status: 'active'
        });
        return this.auctionsRepository.save(auction);
    }

    async findAll(): Promise<Auction[]> {
        return this.auctionsRepository.find({
            order: { createdAt: 'DESC' },
            relations: ['seller'] // To show seller details
        });
    }
}

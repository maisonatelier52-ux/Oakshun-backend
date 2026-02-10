import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../users/entities/transaction.entity';
import { Auction } from '../auctions/entities/auction.entity';

@Injectable()
export class TransactionsService {
    constructor(
        @InjectRepository(Transaction)
        private transactionsRepository: Repository<Transaction>,
        @InjectRepository(Auction)
        private auctionsRepository: Repository<Auction>,
    ) { }

    async createTransaction(data: {
        auctionId: string;
        buyerId: string;
        sellerId: string;
        amount: number;
        paymentMethod: string;
        stripePaymentId: string;
        status: string;
    }): Promise<Transaction> {
        const transaction = this.transactionsRepository.create(data);
        return this.transactionsRepository.save(transaction);
    }

    async findByUserId(userId: string): Promise<Transaction[]> {
        return this.transactionsRepository.find({
            where: [{ buyerId: userId }, { sellerId: userId }],
            order: { createdAt: 'DESC' },
            relations: ['auction'],
        });
    }

    async findOne(id: string): Promise<Transaction> {
        const transaction = await this.transactionsRepository.findOne({
            where: { id },
            relations: ['auction', 'buyer', 'seller'],
        });
        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }
        return transaction;
    }
}

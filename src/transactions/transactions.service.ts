import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction } from '../users/entities/transaction.entity';
import { Auction } from '../auctions/entities/auction.entity';

@Injectable()
export class TransactionsService {
    constructor(
        @InjectModel(Transaction.name)
        private transactionModel: Model<Transaction>,
        @InjectModel(Auction.name)
        private auctionModel: Model<Auction>,
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
        const transaction = new this.transactionModel(data);
        return transaction.save();
    }

    async findByUserId(userId: string): Promise<any[]> {
        const transactions = await this.transactionModel
            .find({
                $or: [{ buyerId: userId }, { sellerId: userId }]
            })
            .sort({ createdAt: -1 })
            .populate('auctionId')
            .lean()
            .exec();
            
        return transactions.map(t => ({ ...t, id: t._id.toString(), auction: t.auctionId }));
    }

    async findOne(id: string): Promise<any> {
        const transaction = await this.transactionModel
            .findById(id)
            .populate('auctionId')
            .populate('buyerId')
            .populate('sellerId')
            .lean()
            .exec();
            
        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }
        
        return { 
            ...transaction, 
            id: transaction._id.toString(), 
            auction: transaction.auctionId,
            buyer: transaction.buyerId,
            seller: transaction.sellerId
        };
    }
}

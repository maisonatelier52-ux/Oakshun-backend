import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { AuctionsModule } from '../auctions/auctions.module';
import { User, UserSchema } from '../users/entities/user.entity';
import { Bid, BidSchema } from '../auctions/entities/bid.entity';
import { Transaction, TransactionSchema } from '../users/entities/transaction.entity';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Bid.name, schema: BidSchema },
            { name: Transaction.name, schema: TransactionSchema },
        ]),
        UsersModule,
        AuctionsModule
    ],
    controllers: [AdminController], 
})
export class AdminModule { }

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { AuctionsModule } from '../auctions/auctions.module';
import { User } from '../users/entities/user.entity';
import { Bid } from '../auctions/entities/bid.entity';
import { Transaction } from '../users/entities/transaction.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Bid, Transaction]),
        UsersModule,
        AuctionsModule
    ],
    controllers: [AdminController], 
})
export class AdminModule { }


import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Auction, AuctionSchema } from '../auctions/entities/auction.entity';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
    imports: [
        ConfigModule,
        MongooseModule.forFeature([{ name: Auction.name, schema: AuctionSchema }]),
        TransactionsModule,
    ],
    providers: [PaymentsService],
    controllers: [PaymentsController],
    exports: [PaymentsService],
})
export class PaymentsModule { }

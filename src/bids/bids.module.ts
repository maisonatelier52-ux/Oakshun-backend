import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BidsService } from './bids.service';
import { BidsController } from './bids.controller';
import { BiddingGateway } from './bidding.gateway';
import { Bid } from '../auctions/entities/bid.entity';
import { Auction } from '../auctions/entities/auction.entity';
import { AuctionsModule } from '../auctions/auctions.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bid, Auction]),
    forwardRef(() => AuctionsModule),
    NotificationsModule,
  ],
  controllers: [BidsController],
  providers: [BidsService, BiddingGateway],
  exports: [BidsService, BiddingGateway],
})
export class BidsModule { }

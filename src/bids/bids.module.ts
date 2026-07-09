import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BidsService } from './bids.service';
import { BidsController } from './bids.controller';
import { BiddingGateway } from './bidding.gateway';
import { Bid, BidSchema } from '../auctions/entities/bid.entity';
import { Auction, AuctionSchema } from '../auctions/entities/auction.entity';
import { AuctionsModule } from '../auctions/auctions.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bid.name, schema: BidSchema },
      { name: Auction.name, schema: AuctionSchema },
    ]),
    forwardRef(() => AuctionsModule),
    NotificationsModule,
  ],
  controllers: [BidsController],
  providers: [BidsService, BiddingGateway],
  exports: [BidsService, BiddingGateway],
})
export class BidsModule { }

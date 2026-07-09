import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuctionsController } from './auctions.controller';
import { AuctionsService } from './auctions.service';
import { Auction, AuctionSchema } from './entities/auction.entity';
import { Bid, BidSchema } from './entities/bid.entity';
import { AuctionSchedulerService } from './auctions-scheduler.service';
import { BidsModule } from '../bids/bids.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Favorite, FavoriteSchema } from '../users/entities/favorite.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auction.name, schema: AuctionSchema },
      { name: Bid.name, schema: BidSchema },
      { name: Favorite.name, schema: FavoriteSchema },
    ]),
    forwardRef(() => BidsModule),
    NotificationsModule,
  ],
  controllers: [AuctionsController],
  providers: [AuctionsService, AuctionSchedulerService],
  exports: [AuctionsService],
})
export class AuctionsModule { }

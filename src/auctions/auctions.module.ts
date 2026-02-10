import { Module, forwardRef } from '@nestjs/common';
import { AuctionsController } from './auctions.controller';
import { AuctionsService } from './auctions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auction } from './entities/auction.entity';
import { Bid } from './entities/bid.entity';
import { AuctionSchedulerService } from './auctions-scheduler.service';
import { BidsModule } from '../bids/bids.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auction, Bid]),
    forwardRef(() => BidsModule),
    NotificationsModule,
  ],
  controllers: [AuctionsController],
  providers: [AuctionsService, AuctionSchedulerService],
  exports: [AuctionsService],
})
export class AuctionsModule { }

import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { AuctionsModule } from '../auctions/auctions.module';

@Module({
    imports: [UsersModule, AuctionsModule],
    controllers: [AdminController],
})
export class AdminModule { }

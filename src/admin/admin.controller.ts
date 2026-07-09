import { Controller, Get, UseGuards, Put, Param, Delete, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from '../users/users.service';
import { AuctionsService } from '../auctions/auctions.service';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../users/entities/user.entity';
import { Model } from 'mongoose';
import { Bid } from '../auctions/entities/bid.entity';
import { Transaction } from '../users/entities/transaction.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
    constructor(
        private readonly usersService: UsersService,
        private readonly auctionsService: AuctionsService,
        @InjectModel(User.name)
        private readonly userModel: Model<User>,
        @InjectModel(Bid.name)
        private readonly bidModel: Model<Bid>,
        @InjectModel(Transaction.name)
        private readonly transactionModel: Model<Transaction>,
    ) { }

    @Get('stats')
    async getStats() {
        const usersCount = await this.usersService.countAll();
        const auctionsData = await this.auctionsService.findAll({ limit: 1000 });

        return {
            totalUsers: usersCount,
            totalAuctions: auctionsData.total,
            activeAuctions: auctionsData.auctions.filter(a => a.status === 'active').length,
            completedAuctions: auctionsData.auctions.filter(a => a.status === 'completed').length,
        };
    }

    @Get('users')
    findAllUsers() {
        return this.usersService.findAll();
    }

    @Get('users/:id/details')
    async getUserDetails(@Param('id') id: string) {
        const user = await this.usersService.findById(id);
        if (!user) throw new Error('User not found');

        const bids = await this.bidModel.find({ bidderId: id })
            .populate('auctionId')
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        const purchases = await this.transactionModel.find({ buyerId: id })
            .populate('auctionId')
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        return {
            user,
            bids: bids.map(b => ({ ...b, id: b._id.toString(), auction: b.auctionId })),
            purchases: purchases.map(p => ({ ...p, id: p._id.toString(), auction: p.auctionId })),
        };
    }

    @Put('users/:id/block')
    async blockUser(@Param('id') id: string) {
        return this.usersService.update(id, { isBlocked: true });
    }

    @Put('users/:id/unblock')
    async unblockUser(@Param('id') id: string) {
        return this.usersService.update(id, { isBlocked: false });
    }

    @Get('sellers')
    async findAllSellers() {
        return this.userModel.find({ role: 'seller' }).lean().exec();
    }

    @Get('sellers/:id/auctions')
    async getSellerAuctions(@Param('id') id: string) {
        return this.auctionsService.findAll({ sellerId: id, limit: 1000 });
    }

    @Get('auctions')
    findAllAuctions() {
        return this.auctionsService.findAll({ limit: 100 });
    }

    @Delete('auctions/:id')
    async deleteAuction(@Param('id') id: string, @Req() req: any) {
        const userId = req.user.userId || req.user.id || 'admin';
        return this.auctionsService.remove(id, userId, 'admin');
    }
}


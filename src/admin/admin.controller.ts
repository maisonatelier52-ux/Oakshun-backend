import { Controller, Get, UseGuards, Put, Param, Body, Delete, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from '../users/users.service';
import { AuctionsService } from '../auctions/auctions.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { Bid } from '../auctions/entities/bid.entity';
import { Transaction } from '../users/entities/transaction.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
    constructor(
        private readonly usersService: UsersService,
        private readonly auctionsService: AuctionsService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Bid)
        private readonly bidsRepository: Repository<Bid>,
        @InjectRepository(Transaction)
        private readonly transactionsRepository: Repository<Transaction>,
    ) { }

    @Get('stats')
    async getStats() {
        // Basic stats for now
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

        // Bids bidded on by this user
        const bids = await this.bidsRepository.find({
            where: { bidderId: id },
            relations: ['auction'],
            order: { createdAt: 'DESC' },
        });

        // Transactions (purchased products)
        const purchases = await this.transactionsRepository.find({
            where: { buyerId: id },
            relations: ['auction'],
            order: { createdAt: 'DESC' },
        });

        return {
            user,
            bids,
            purchases,
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
        return this.userRepository.find({ where: { role: 'seller' } });
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
        // req.user is populated by JwtAuthGuard
        const userId = req.user.userId || req.user.id || 'admin';
        return this.auctionsService.remove(id, userId, 'admin');
    }
}


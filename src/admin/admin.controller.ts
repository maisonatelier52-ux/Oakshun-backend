import { Controller, Get, UseGuards, Put, Param, Body, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from '../users/users.service';
import { AuctionsService } from '../auctions/auctions.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
    constructor(
        private readonly usersService: UsersService,
        private readonly auctionsService: AuctionsService,
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

    @Put('users/:id/block')
    async blockUser(@Param('id') id: string) {
        return this.usersService.update(id, { isBlocked: true });
    }

    @Put('users/:id/unblock')
    async unblockUser(@Param('id') id: string) {
        return this.usersService.update(id, { isBlocked: false });
    }

    @Get('auctions')
    findAllAuctions() {
        return this.auctionsService.findAll({ limit: 100 });
    }
}

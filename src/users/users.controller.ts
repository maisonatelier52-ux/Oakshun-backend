import { Controller, Get, Body, Patch, UseGuards, Request, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // Public endpoint - no auth required for landing page
    @Get('sellers')
    async getSellers() {
        return this.usersService.findSellers();
    }

    @Get('sellers/:id')
    async getSellerById(@Param('id') id: string) {
        return this.usersService.findSellerById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Request() req: any) {
        const userDoc = await this.usersService.findById(req.user.userId);
        if (!userDoc) {
            throw new Error('User not found');
        }
        const userObj = userDoc.toObject();
        const { password, ...result } = userObj as any;
        result.id = userObj._id.toString();
        delete result._id;
        delete result.__v;
        return { user: result };
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    async updateProfile(@Request() req: any, @Body() updates: any) {
        const allowedUpdates = {};
        if (updates.role) allowedUpdates['role'] = updates.role;

        const userDoc = await this.usersService.update(req.user.userId, allowedUpdates);
        if (!userDoc) {
            throw new Error('User not found');
        }
        const userObj = userDoc.toObject();
        const { password, ...result } = userObj as any;
        result.id = userObj._id.toString();
        delete result._id;
        delete result.__v;
        return { user: result };
    }
}

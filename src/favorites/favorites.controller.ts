import {
    Controller,
    Get,
    Post,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('favorites')
export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) { }

    @Post(':auctionId')
    @UseGuards(JwtAuthGuard)
    toggle(@Param('auctionId') auctionId: string, @Request() req) {
        return this.favoritesService.toggle(req.user.userId, auctionId);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    findAll(@Request() req) {
        return this.favoritesService.findAllByUser(req.user.userId);
    }

    @Get(':auctionId/status')
    @UseGuards(JwtAuthGuard)
    isFavorited(@Param('auctionId') auctionId: string, @Request() req) {
        return this.favoritesService.isFavorited(req.user.userId, auctionId);
    }
}

import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('auctions')
export class AuctionsController {
    constructor(private readonly auctionsService: AuctionsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createAuctionDto: CreateAuctionDto, @Request() req) {
        // req.user is populated by JwtStrategy
        return this.auctionsService.create(createAuctionDto, req.user.userId);
    }

    @Get()
    findAll() {
        return this.auctionsService.findAll();
    }
}

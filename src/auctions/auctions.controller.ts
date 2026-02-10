import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    UseGuards,
    Request,
    Query,
} from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('auctions')
export class AuctionsController {
    constructor(private readonly auctionsService: AuctionsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createAuctionDto: CreateAuctionDto, @Request() req) {
        return this.auctionsService.create(createAuctionDto, req.user.userId);
    }

    @Get()
    findAll(
        @Query('category') category?: string,
        @Query('status') status?: string,
        @Query('search') search?: string,
        @Query('minPrice') minPrice?: number,
        @Query('maxPrice') maxPrice?: number,
        @Query('sellerId') sellerId?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.auctionsService.findAll({
            category,
            status,
            search,
            minPrice,
            maxPrice,
            sellerId,
            page,
            limit,
        });
    }

    @Get('ending-soon')
    findEndingSoon(@Query('hours') hours?: number) {
        return this.auctionsService.findEndingSoon(hours);
    }

    @Get('category/:category')
    findByCategory(@Param('category') category: string) {
        return this.auctionsService.findByCategory(category);
    }

    @Get(':id/bids')
    findBids(@Param('id') id: string) {
        return this.auctionsService.findBidsByAuction(id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.auctionsService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id')
    update(
        @Param('id') id: string,
        @Body() updateAuctionDto: UpdateAuctionDto,
        @Request() req,
    ) {
        return this.auctionsService.update(
            id,
            updateAuctionDto,
            req.user.userId,
            req.user.role,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.auctionsService.remove(id, req.user.userId, req.user.role);
    }
}


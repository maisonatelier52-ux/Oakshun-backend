import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Request,
    Logger,
} from '@nestjs/common';
import { BidsService } from './bids.service';
import { CreateBidDto } from '../auctions/dto/create-bid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bids')
export class BidsController {
    private readonly logger = new Logger(BidsController.name);
    constructor(private readonly bidsService: BidsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createBidDto: CreateBidDto, @Request() req) {
        return this.bidsService.placeBid(createBidDto, req.user.userId);
    }

    @Get('auction/:auctionId')
    findByAuction(@Param('auctionId') auctionId: string) {
        this.logger.log(`Fetching bids for auction: ${auctionId}`);
        return this.bidsService.getBidsByAuction(auctionId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('my-bids')
    findMyBids(@Request() req) {
        return this.bidsService.getBidsByUser(req.user.userId);
    }
}

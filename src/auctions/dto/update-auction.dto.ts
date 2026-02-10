import { PartialType } from '@nestjs/mapped-types';
import { CreateAuctionDto } from './create-auction.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAuctionDto extends PartialType(CreateAuctionDto) {
    @IsOptional()
    @IsString()
    status?: 'draft' | 'active' | 'ended' | 'cancelled';
}

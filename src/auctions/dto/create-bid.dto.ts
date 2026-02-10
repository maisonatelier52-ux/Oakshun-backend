import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateBidDto {
    @IsNotEmpty()
    @IsUUID()
    auctionId: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0.01, { message: 'Bid amount must be greater than 0' })
    amount: number;
}

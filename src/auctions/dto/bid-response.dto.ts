export class BidResponseDto {
    id: string;
    auctionId: string;
    bidderId: string;
    bidderName: string;
    amount: number;
    isWinning: boolean;
    createdAt: Date;
}

export class AuctionResponseDto {
    id: string;
    title: string;
    description: string;
    category: string;
    startingPrice: number;
    currentPrice: number;
    reservePrice?: number;
    imageUrl: string;
    endTime: Date;
    status: string;
    sellerId: string;
    sellerName: string;
    winnerId?: string;
    winnerName?: string;
    bidCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

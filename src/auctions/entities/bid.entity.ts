import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Auction } from '../../auctions/entities/auction.entity';
import { User } from '../../users/entities/user.entity';

@Entity('bids')
export class Bid {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Auction, (auction) => auction.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'auctionId' })
    auction: Auction;

    @Column()
    auctionId: string;

    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bidderId' })
    bidder: User;

    @Column()
    bidderId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ default: false })
    isWinning: boolean;

    @CreateDateColumn()
    createdAt: Date;
}

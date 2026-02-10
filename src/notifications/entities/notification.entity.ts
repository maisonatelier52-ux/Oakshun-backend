import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Auction } from '../../auctions/entities/auction.entity';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column()
    type: string; // 'bid', 'outbid', 'won', 'sold', 'payment', etc.

    @Column()
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ default: false })
    isRead: boolean;

    @ManyToOne(() => Auction, (auction) => auction.id, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'relatedAuctionId' })
    relatedAuction: Auction;

    @Column({ nullable: true })
    relatedAuctionId: string;

    @CreateDateColumn()
    createdAt: Date;
}

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Auction } from '../../auctions/entities/auction.entity';

@Entity('favorites')
@Unique(['userId', 'auctionId'])
export class Favorite {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Auction, (auction) => auction.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'auctionId' })
    auction: Auction;

    @Column()
    auctionId: string;

    @CreateDateColumn()
    createdAt: Date;
}

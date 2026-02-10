import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Auction } from '../../auctions/entities/auction.entity';
import { User } from '../../users/entities/user.entity';

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Auction, (auction) => auction.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'auctionId' })
    auction: Auction;

    @Column()
    auctionId: string;

    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'buyerId' })
    buyer: User;

    @Column()
    buyerId: string;

    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sellerId' })
    seller: User;

    @Column()
    sellerId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ nullable: true })
    paymentMethod: string;

    @Column({ nullable: true })
    stripePaymentId: string;

    @Column({ default: 'pending' }) // pending, completed, failed, refunded
    status: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

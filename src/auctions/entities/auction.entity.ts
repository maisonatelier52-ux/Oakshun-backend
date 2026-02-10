import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Favorite } from '../../users/entities/favorite.entity';

@Entity('auctions')
export class Auction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    category: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    startingPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    currentPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    reservePrice: number;

    @Column()
    imageUrl: string;

    @Column({ type: 'timestamp' })
    endTime: Date;

    @Column({ default: 'active' }) // draft, active, ended, cancelled
    status: string;

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({ name: 'sellerId' })
    seller: User;

    @Column()
    sellerId: string;

    @ManyToOne(() => User, (user) => user.id, { nullable: true })
    @JoinColumn({ name: 'winnerId' })
    winner: User;

    @Column({ nullable: true })
    winnerId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Favorite, (favorite) => favorite.auction)
    favorites: Favorite[];

    favoritesCount?: number;
}

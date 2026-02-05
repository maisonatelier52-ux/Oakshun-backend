import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('auctions')
export class Auction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    startingPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    currentPrice: number;

    @Column()
    imageUrl: string;

    @Column({ type: 'timestamp' })
    endTime: Date;

    @Column({ default: 'active' }) // active, sold, expired
    status: string;

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({ name: 'sellerId' })
    seller: User;

    @Column()
    sellerId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

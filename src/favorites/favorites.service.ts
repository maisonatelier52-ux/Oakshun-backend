import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from '../users/entities/favorite.entity';

@Injectable()
export class FavoritesService {
    constructor(
        @InjectRepository(Favorite)
        private favoritesRepository: Repository<Favorite>,
    ) { }

    async toggle(userId: string, auctionId: string): Promise<{ favorited: boolean; favoritesCount?: number }> {
        const existing = await this.favoritesRepository.findOne({
            where: { userId, auctionId },
        });

        if (existing) {
            await this.favoritesRepository.remove(existing);
            const count = await this.countByAuction(auctionId);
            return { favorited: false, favoritesCount: count };
        }

        const favorite = this.favoritesRepository.create({ userId, auctionId });
        try {
            await this.favoritesRepository.save(favorite);
            const count = await this.countByAuction(auctionId);
            return { favorited: true, favoritesCount: count };
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                const count = await this.countByAuction(auctionId);
                return { favorited: true, favoritesCount: count };
            }
            throw error;
        }
    }

    async findAllByUser(userId: string): Promise<Favorite[]> {
        return this.favoritesRepository.find({
            where: { userId },
            relations: ['auction'],
            order: { createdAt: 'DESC' },
        });
    }

    async isFavorited(userId: string, auctionId: string): Promise<boolean> {
        const count = await this.favoritesRepository.count({
            where: { userId, auctionId },
        });
        return count > 0;
    }

    async countByAuction(auctionId: string): Promise<number> {
        return this.favoritesRepository.count({
            where: { auctionId },
        });
    }
}

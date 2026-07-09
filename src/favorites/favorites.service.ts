import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Favorite } from '../users/entities/favorite.entity';

@Injectable()
export class FavoritesService {
    constructor(
        @InjectModel(Favorite.name)
        private favoriteModel: Model<Favorite>,
    ) { }

    async toggle(userId: string, auctionId: string): Promise<{ favorited: boolean; favoritesCount?: number }> {
        const existing = await this.favoriteModel.findOne({ userId, auctionId }).exec();

        if (existing) {
            await this.favoriteModel.deleteOne({ _id: existing._id }).exec();
            const count = await this.countByAuction(auctionId);
            return { favorited: false, favoritesCount: count };
        }

        const favorite = new this.favoriteModel({ userId, auctionId });
        try {
            await favorite.save();
            const count = await this.countByAuction(auctionId);
            return { favorited: true, favoritesCount: count };
        } catch (error: any) {
            if (error.code === 11000) { // MongoDB Unique constraint violation
                const count = await this.countByAuction(auctionId);
                return { favorited: true, favoritesCount: count };
            }
            throw error;
        }
    }

    async findAllByUser(userId: string): Promise<any[]> {
        const favorites = await this.favoriteModel
            .find({ userId })
            .populate('auctionId')
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        
        return favorites.map(fav => ({
            ...fav,
            id: fav._id.toString(),
            auction: fav.auctionId
        }));
    }

    async isFavorited(userId: string, auctionId: string): Promise<boolean> {
        const count = await this.favoriteModel.countDocuments({ userId, auctionId }).exec();
        return count > 0;
    }

    async countByAuction(auctionId: string): Promise<number> {
        return this.favoriteModel.countDocuments({ auctionId }).exec();
    }
}

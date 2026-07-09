import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Favorite, FavoriteSchema } from '../users/entities/favorite.entity';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';

@Module({
    imports: [MongooseModule.forFeature([{ name: Favorite.name, schema: FavoriteSchema }])],
    controllers: [FavoritesController],
    providers: [FavoritesService],
    exports: [FavoritesService],
})
export class FavoritesModule { }

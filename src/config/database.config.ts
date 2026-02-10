import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Auction } from '../auctions/entities/auction.entity';
import { Bid } from '../auctions/entities/bid.entity';
import { Transaction } from '../users/entities/transaction.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Favorite } from '../users/entities/favorite.entity';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST') || 'localhost',
  port: configService.get<number>('DB_PORT') || 5432,
  username: configService.get<string>('DB_USERNAME') || 'postgres',
  password: configService.get<string>('DB_PASSWORD') || 'superUser',
  database: configService.get<string>('DB_NAME') || 'MyDB',
  entities: [User, Auction, Bid, Transaction, Notification, Favorite],
  synchronize: configService.get<string>('NODE_ENV') !== 'production',
  logging: configService.get<string>('NODE_ENV') === 'development',
});

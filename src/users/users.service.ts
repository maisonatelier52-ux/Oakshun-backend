import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Auction } from '../auctions/entities/auction.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Auction)
    private auctionsRepository: Repository<Auction>,
  ) { }

  async findOne(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(
    email: string,
    name: string,
    password: string,
  ): Promise<User> {
    const user = this.usersRepository.create({ email, name, password });
    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async countAll(): Promise<number> {
    return this.usersRepository.count();
  }

  async findSellers(): Promise<any[]> {
    const sellers = await this.usersRepository.find({
      where: { role: 'seller' },
      order: { createdAt: 'ASC' },
    });

    // For each seller, count how many auctions they have
    const sellersWithStats = await Promise.all(
      sellers.map(async (seller) => {
        const itemsSold = await this.auctionsRepository.count({
          where: { sellerId: seller.id },
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...safeUser } = seller;
        return {
          ...safeUser,
          itemsSold,
          verified: seller.KYC_verified,
        };
      }),
    );

    return sellersWithStats;
  }

  async findSellerById(id: string): Promise<any> {
    const seller = await this.usersRepository.findOne({
      where: { id, role: 'seller' },
    });
    if (!seller) return null;
    const itemsSold = await this.auctionsRepository.count({
      where: { sellerId: seller.id },
    });
    const { password, ...safeUser } = seller;
    return {
      ...safeUser,
      itemsSold,
      verified: seller.KYC_verified,
    };
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new Error('User not found');
    Object.assign(user, updates);
    return this.usersRepository.save(user);
  }
}

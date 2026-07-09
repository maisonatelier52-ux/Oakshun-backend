import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { Auction } from '../auctions/entities/auction.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Auction.name)
    private auctionModel: Model<Auction>,
  ) { }

  async findOne(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async create(
    email: string,
    name: string,
    password: string,
  ): Promise<User> {
    const user = new this.userModel({ email, name, password });
    return user.save();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async countAll(): Promise<number> {
    return this.userModel.countDocuments().exec();
  }

  async findSellers(): Promise<any[]> {
    const sellers = await this.userModel.find({ role: 'seller' }).sort({ createdAt: 1 }).lean().exec();

    // For each seller, count how many auctions they have
    const sellersWithStats = await Promise.all(
      sellers.map(async (seller) => {
        const itemsSold = await this.auctionModel.countDocuments({ sellerId: seller._id }).exec();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...safeUser } = seller as any;
        return {
          ...safeUser,
          id: safeUser._id.toString(),
          itemsSold,
          verified: seller.KYC_verified,
        };
      }),
    );

    return sellersWithStats;
  }

  async findSellerById(id: string): Promise<any> {
    const seller = await this.userModel.findOne({ _id: id, role: 'seller' }).lean().exec();
    if (!seller) return null;
    const itemsSold = await this.auctionModel.countDocuments({ sellerId: seller._id }).exec();
    const { password, ...safeUser } = seller as any;
    return {
      ...safeUser,
      id: safeUser._id.toString(),
      itemsSold,
      verified: seller.KYC_verified,
    };
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, updates, { new: true }).exec();
  }
}

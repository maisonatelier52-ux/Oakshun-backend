import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Auction } from '../../auctions/entities/auction.entity';
import { User } from '../../users/entities/user.entity';

@Schema({ timestamps: true })
export class Bid extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Auction', required: true })
  auctionId: Auction | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  bidderId: User | Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ default: false })
  isWinning: boolean;
}

export const BidSchema = SchemaFactory.createForClass(Bid);

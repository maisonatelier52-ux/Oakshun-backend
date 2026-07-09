import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Auction } from '../../auctions/entities/auction.entity';
import { User } from '../../users/entities/user.entity';

@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Auction', required: true })
  auctionId: Auction | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  buyerId: User | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sellerId: User | Types.ObjectId;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop()
  paymentMethod: string;

  @Prop()
  stripePaymentId: string;

  @Prop({ default: 'pending', enum: ['pending', 'completed', 'failed', 'refunded'] })
  status: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

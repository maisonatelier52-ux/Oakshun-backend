import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/entities/user.entity';

@Schema({ timestamps: true })
export class Auction extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  category: string;

  @Prop({ type: Number, required: true })
  startingPrice: number;

  @Prop({ type: Number })
  currentPrice: number;

  @Prop({ type: Number })
  reservePrice: number;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ type: Date, required: true })
  endTime: Date;

  @Prop({ default: 'active', enum: ['draft', 'active', 'ended', 'cancelled'] })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sellerId: User | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  winnerId: User | Types.ObjectId;
}

export const AuctionSchema = SchemaFactory.createForClass(Auction);


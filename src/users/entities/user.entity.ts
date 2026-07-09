import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  name: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'buyer', enum: ['buyer', 'seller', 'admin'] })
  role: string;

  @Prop()
  phone: string;

  @Prop()
  avatarUrl: string;

  @Prop({ default: false })
  KYC_verified: boolean;

  @Prop({ default: false })
  isBlocked: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

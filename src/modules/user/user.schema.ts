import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum Role {
  ADMIN = 'admin',
  USER = 'user',
}

@Schema({ timestamps: true })
export class User {
  @Prop()
  first_name: string;

  @Prop()
  last_name: string;

  @Prop({ unique: true, sparse: true })
  phone: string;

  @Prop({ unique: true, sparse: true })
  email: string;

  @Prop()
  password: string;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ type: String, enum: Role, default: Role.USER })
  role: Role;
}

export const UserSchema = SchemaFactory.createForClass(User);

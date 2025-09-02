import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConfirmationDocument = Confirmation & Document;

@Schema({ timestamps: true })
export class Confirmation {
  @Prop({ required: true, enum: ['email', 'phone'] })
  type: string;

  @Prop({ required: true })
  recipient: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, type: Date, expires: '5m' }) // Code expires in 5 minutes
  expiresAt: Date;
}

export const ConfirmationSchema = SchemaFactory.createForClass(Confirmation);

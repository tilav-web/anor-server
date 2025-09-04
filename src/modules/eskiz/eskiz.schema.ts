import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EskizDocument = Eskiz & Document;

@Schema({ timestamps: true })
export class Eskiz {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  token: string;
}

export const EskizSchema = SchemaFactory.createForClass(Eskiz);

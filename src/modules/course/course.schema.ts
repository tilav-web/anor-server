import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Video } from '../video/video.schema';

export type CourseDocument = Course & Document;

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ type: [String], required: true })
  category: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Video' }] })
  videos: Video[];
}

export const CourseSchema = SchemaFactory.createForClass(Course);

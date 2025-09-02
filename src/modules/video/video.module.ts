import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { Video, VideoSchema } from './video.schema';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Video.name, schema: VideoSchema }]),
    MulterModule.register({
      dest: './uploads', // IMPORTANT: This is a temporary local storage. For production, use a cloud storage service like S3.
    }),
  ],
  controllers: [VideoController],
  providers: [VideoService],
})
export class VideoModule {}

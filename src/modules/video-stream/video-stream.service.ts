import { Injectable, NotFoundException } from '@nestjs/common';
import { createReadStream, statSync } from 'fs';
import { join } from 'path';

@Injectable()
export class VideoStreamService {
  getVideoStream(filename: string) {
    const videoPath = join(__dirname, '..', '..', 'uploads', filename);
    try {
      const stats = statSync(videoPath);
      const fileStream = createReadStream(videoPath);
      return { fileStream, stats };
    } catch (error) {
      console.log(error);
      throw new NotFoundException('Video not found');
    }
  }
}

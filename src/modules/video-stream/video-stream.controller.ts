import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  StreamableFile,
  Headers,
} from '@nestjs/common';
import { Response } from 'express';
import { VideoStreamService } from './video-stream.service';
import { JwtAuthGuard } from '../user/guards/auth.guard';

@Controller('video-stream')
export class VideoStreamController {
  constructor(private readonly videoStreamService: VideoStreamService) {}

  @Get('stream/:filename')
  @UseGuards(JwtAuthGuard)
  getVideo(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
    @Headers('range') range: string,
  ) {
    const { fileStream, stats } =
      this.videoStreamService.getVideoStream(filename);

    const fileSize = stats.size;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(206, head);
      return new StreamableFile(fileStream, {
        disposition: `inline; filename="${filename}"`,
        type: 'video/mp4',
      });
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      return new StreamableFile(fileStream, {
        disposition: `inline; filename="${filename}"`,
        type: 'video/mp4',
      });
    }
  }
}

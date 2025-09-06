import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  Headers,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { VideoStreamService } from './video-stream.service';
import { JwtAuthGuard } from '../user/guards/auth.guard';
import { extname } from 'path';

@Controller('video-stream')
export class VideoStreamController {
  constructor(private readonly videoStreamService: VideoStreamService) {}

  @Get('stream/:filename')
  @UseGuards(JwtAuthGuard)
  async getVideo(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
    @Headers('range') range: string,
    @Req() req: Request,
  ) {
    // Validate filename to prevent path traversal
    if (!filename.match(/^[a-zA-Z0-9_\-\.]+$/)) {
      throw new BadRequestException('Invalid filename');
    }

    // Check authentication (assuming req.user is set by guard)
    if (!req.user) {
      throw new UnauthorizedException('Invalid or missing token');
    }

    // Get file stream and stats
    const { fileStream, stats } =
      await this.videoStreamService.getVideoStream(filename);

    if (!fileStream || !stats) {
      throw new NotFoundException(`File ${filename} not found`);
    }

    const fileSize = stats.size;

    // Determine MIME type dynamically
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.avi': 'video/x-msvideo',
      // Add more as needed
    };
    const contentType =
      mimeTypes[extname(filename).toLowerCase()] || 'video/mp4';

    // Common headers
    const head: any = {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    };

    let start = 0;
    let end = fileSize - 1;
    let statusCode = 200;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      start = parseInt(parts[0], 10);
      end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Validate range
      if (
        isNaN(start) ||
        isNaN(end) ||
        start > end ||
        start >= fileSize ||
        end >= fileSize
      ) {
        throw new BadRequestException('Invalid range');
      }

      const chunksize = end - start + 1;
      head['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;
      head['Content-Length'] = chunksize;
      statusCode = 206;
    } else {
      head['Content-Length'] = fileSize;
    }

    res.writeHead(statusCode, head);

    // Pipe the stream to response
    fileStream.pipe(res);

    // Handle stream errors
    fileStream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).send('Stream error');
      }
    });

    // No return needed since we're piping to res
  }
}

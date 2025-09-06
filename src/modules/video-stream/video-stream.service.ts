import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { createReadStream } from 'fs';
import { join, resolve } from 'path';

@Injectable()
export class VideoStreamService {
  async getVideoStream(filename: string, range?: string) {
    // Validate filename to prevent path traversal
    if (!filename.match(/^[a-zA-Z0-9_\-\.]+$/)) {
      throw new BadRequestException('Invalid filename');
    }

    // Resolve file path securely
    const videoPath = resolve(join('uploads', filename));

    // Check if file exists
    try {
      await fs.access(videoPath);
    } catch (error) {
      console.log(error);

      throw new NotFoundException(`File ${filename} not found`);
    }

    // Get file stats
    let stats;
    try {
      stats = await fs.stat(videoPath);
    } catch (error) {
      throw new NotFoundException(`Failed to get file stats: ${error.message}`);
    }

    // Initialize stream options
    let start = 0;
    let end = stats.size - 1;

    // Handle range request
    if (range) {
      if (!range.startsWith('bytes=')) {
        throw new BadRequestException('Invalid range header');
      }
      const parts = range.replace(/bytes=/, '').split('-');
      if (parts.length < 1 || parts.length > 2) {
        throw new BadRequestException('Invalid range format');
      }
      start = parseInt(parts[0], 10);
      end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;

      // Validate range
      if (
        isNaN(start) ||
        isNaN(end) ||
        start < 0 ||
        end < 0 ||
        start > end ||
        start >= stats.size ||
        end >= stats.size
      ) {
        throw new BadRequestException('Invalid range');
      }
    }

    // Create read stream with range
    const fileStream = createReadStream(videoPath, { start, end });

    return { fileStream, stats };
  }
}

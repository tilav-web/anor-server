import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { VideoService } from './video.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { JwtAuthGuard } from '../user/guards/auth.guard';
import { RolesGuard } from '../user/guards/roles.guard';
import { Roles } from '../user/decorators/roles.decorator';
import { Role } from '../user/user.schema';
import { extname } from 'path';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extension = extname(file.originalname);
          callback(null, `${uniqueSuffix}${extension}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedMimes = ['video/mp4', 'video/webm', 'video/avi'];
        if (!allowedMimes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Only video files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 2 * 1024 * 1024 * 1024, // 2 GB
      },
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createVideoDto: CreateVideoDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return await this.videoService.create(file, createVideoDto);
  }

  @UseGuards(JwtAuthGuard) // O'zgartirish: findAll uchun autentifikatsiya qo'shildi
  @Get()
  async findAll() {
    return await this.videoService.findAll();
  }

  @UseGuards(JwtAuthGuard) // O'zgartirish: findOne uchun autentifikatsiya qo'shildi
  @Get(':id')
  async findOne(@Param('id') id: string) {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestException('Invalid video ID');
    }
    return await this.videoService.findOne(id);
  }

  @UseGuards(JwtAuthGuard) // O'zgartirish: findByFilename uchun autentifikatsiya qo'shildi
  @Get('by-filename/:filename')
  async findByFilename(@Param('filename') filename: string) {
    if (!filename.match(/^[a-zA-Z0-9_\-\.]+$/)) {
      throw new BadRequestException('Invalid filename');
    }
    return await this.videoService.findByFilename(filename);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVideoDto: UpdateVideoDto,
  ) {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestException('Invalid video ID');
    }
    return await this.videoService.update(id, updateVideoDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestException('Invalid video ID');
    }
    return await this.videoService.remove(id);
  }
}

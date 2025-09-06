import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Video, VideoDocument } from './video.schema';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { promises as fs } from 'fs'; // Asinxron fs.promises
import { extname, join, resolve } from 'path';
import { randomBytes } from 'crypto';

@Injectable()
export class VideoService {
  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
  ) {}

  async create(
    file: Express.Multer.File,
    createVideoDto: CreateVideoDto,
  ): Promise<Video> {
    // Fayl validatsiyasi
    const allowedMimes = ['video/mp4', 'video/webm', 'video/avi'];
    if (!file || !allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid video format');
    }

    const allowedExtensions = ['.mp4', '.webm', '.avi'];
    const extension = extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      throw new BadRequestException('Invalid file extension');
    }

    // Upload papkasini yaratish
    const uploadPath = resolve('uploads');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
    } catch (error) {
      throw new BadRequestException(
        `Failed to create upload directory: ${error.message}`,
      );
    }

    // Noyob fayl nomi yaratish
    const uniqueSuffix = randomBytes(16).toString('hex');
    const newFilename = `${uniqueSuffix}${extension}`;
    const newPath = join(uploadPath, newFilename);

    // Faylni ko‘chirish
    try {
      await fs.rename(file.path, newPath);
    } catch (error) {
      throw new BadRequestException(
        `Failed to save video file: ${error.message}`,
      );
    }

    // DTO’dan faqat kerakli maydonlarni olish
    const videoData = {
      title: createVideoDto.title,
      description: createVideoDto.description,
      url: newPath,
      type: file.mimetype,
    };

    // Ma’lumotlar bazasiga saqlash
    try {
      const createdVideo = new this.videoModel(videoData);
      return await createdVideo.save();
    } catch (error) {
      // Agar saqlash muvaffaqiyatsiz bo‘lsa, faylni o‘chirish
      try {
        await fs.unlink(newPath);
      } catch (unlinkError) {
        console.error(`Failed to clean up file: ${unlinkError.message}`);
      }
      throw new BadRequestException(
        `Failed to save video to database: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<Video[]> {
    try {
      return await this.videoModel.find().exec();
    } catch (error) {
      throw new BadRequestException(`Failed to fetch videos: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Video> {
    // ID formati validatsiyasi
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestException('Invalid video ID');
    }

    try {
      const video = await this.videoModel.findById(id).exec();
      if (!video) {
        throw new NotFoundException(`Video with ID ${id} not found`);
      }
      return video;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch video: ${error.message}`);
    }
  }

  async findByFilename(filename: string): Promise<Video> {
    // Fayl nomini validatsiya qilish
    if (!filename.match(/^[a-zA-Z0-9_\-\.]+$/)) {
      throw new BadRequestException('Invalid filename');
    }

    const videoPath = join(resolve('uploads'), filename);
    try {
      const video = await this.videoModel.findOne({ url: videoPath }).exec();
      if (!video) {
        throw new NotFoundException(
          `Video with filename ${filename} not found`,
        );
      }
      return video;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch video: ${error.message}`);
    }
  }

  async update(id: string, updateVideoDto: UpdateVideoDto): Promise<Video> {
    // ID formati validatsiyasi
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestException('Invalid video ID');
    }

    // DTO’dan faqat kerakli maydonlarni olish
    const updateData = {
      title: updateVideoDto.title,
      description: updateVideoDto.description,
    };

    try {
      const updatedVideo = await this.videoModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
      if (!updatedVideo) {
        throw new NotFoundException(`Video with ID ${id} not found`);
      }
      return updatedVideo;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update video: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    // ID formati validatsiyasi
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestException('Invalid video ID');
    }

    try {
      const video = await this.videoModel.findById(id).exec();
      if (!video) {
        throw new NotFoundException(`Video with ID ${id} not found`);
      }

      // Faylni o‘chirish
      try {
        await fs.access(video.url); // Fayl mavjudligini tekshirish
        await fs.unlink(video.url);
      } catch (error) {
        console.warn(`Failed to delete file ${video.url}: ${error.message}`);
        // Fayl topilmasa, jarayonni davom ettirish mumkin
      }

      // Ma’lumotlar bazasidan o‘chirish
      await this.videoModel.findByIdAndDelete(id).exec();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete video: ${error.message}`);
    }
  }
}

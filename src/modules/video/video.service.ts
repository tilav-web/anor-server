import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Video, VideoDocument } from './video.schema';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

@Injectable()
export class VideoService {
  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
  ) {}

  async create(file: Express.Multer.File, createVideoDto: CreateVideoDto): Promise<Video> {
    const uploadPath = 'uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const uniqueSuffix = randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname);
    const newFilename = `${uniqueSuffix}${extension}`;
    const newPath = path.join(uploadPath, newFilename);

    fs.renameSync(file.path, newPath);

    const createdVideo = new this.videoModel({
      ...createVideoDto,
      url: newPath,
      type: file.mimetype,
    });

    return createdVideo.save();
  }

  async findAll(): Promise<Video[]> {
    return this.videoModel.find().exec();
  }

  async findOne(id: string): Promise<Video> {
    return this.videoModel.findById(id).exec();
  }

  async update(id: string, updateVideoDto: UpdateVideoDto): Promise<Video> {
    return this.videoModel
      .findByIdAndUpdate(id, updateVideoDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<any> {
    const video = await this.videoModel.findById(id).exec();
    if (video && fs.existsSync(video.url)) {
      fs.unlinkSync(video.url);
    }
    return this.videoModel.findByIdAndDelete(id).exec();
  }
}

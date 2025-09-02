import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Video, VideoDocument } from './video.schema';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';

@Injectable()
export class VideoService {
  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
  ) {}

  async create(file: Express.Multer.File, createVideoDto: CreateVideoDto): Promise<Video> {
    // In a real-world application, you would upload the file to a cloud storage
    // and save the URL here. For this example, we're saving the local file path.
    const createdVideo = new this.videoModel({
      ...createVideoDto,
      url: file.path,
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
    // In a real-world application, you would also delete the file from cloud storage.
    return this.videoModel.findByIdAndDelete(id).exec();
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument } from './course.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
  ) {}

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    const createdCourse = new this.courseModel(createCourseDto);
    return createdCourse.save();
  }

  async findAll(): Promise<Course[]> {
    return this.courseModel.find().populate('videos').exec();
  }

  async findOne(id: string): Promise<Course> {
    return this.courseModel.findById(id).populate('videos').exec();
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    return this.courseModel
      .findByIdAndUpdate(id, updateCourseDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<any> {
    return this.courseModel.findByIdAndDelete(id).exec();
  }

  async addVideo(courseId: string, videoId: string): Promise<Course> {
    return this.courseModel.findByIdAndUpdate(
      courseId,
      { $addToSet: { videos: videoId } }, // $addToSet prevents duplicate videos
      { new: true },
    );
  }

  async removeVideo(courseId: string, videoId: string): Promise<Course> {
    return this.courseModel.findByIdAndUpdate(
      courseId,
      { $pull: { videos: videoId } },
      { new: true },
    );
  }
}

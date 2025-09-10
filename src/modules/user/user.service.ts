import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<{ user: User; token: string }> {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt();
    createUserDto.password = await bcrypt.hash(createUserDto.password, salt);
    const createdUser = new this.userModel(createUserDto);
    await createdUser.save();
    const user = await this.userModel
      .findById(createdUser._id)
      .populate({ path: 'courses', populate: { path: 'videos' } });
    const token = await this._createToken(user);
    return { user, token };
  }

  async login(loginDto: LoginUserDto): Promise<{ user: User; token: string }> {
    const user = await this.userModel
      .findOne({ email: loginDto.email })
      .populate({ path: 'courses', populate: { path: 'videos' } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatching = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this._createToken(user);
    return { user, token };
  }

  async findAll(
    page: number,
    limit: number,
    search: string,
  ): Promise<{ data: User[]; total: number }> {
    const query = search
      ? {
          $or: [
            { first_name: { $regex: search, $options: 'i' } },
            { last_name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.userModel
        .find(query)
        .populate({
          path: 'courses',
          populate: {
            path: 'videos',
          },
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  async findById(userId: string): Promise<User> {
    return this.userModel.findById(userId).exec();
  }

  async findMe(userId: string): Promise<User> {
    return this.userModel
      .findById(userId)
      .populate({ path: 'courses', populate: { path: 'videos' } });
  }

  async updateStatus(id: string, status: boolean): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updateCourses(id: string, courseIds: string[]): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { courses: courseIds },
      { new: true },
    );
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  private async _createToken(user: UserDocument): Promise<string> {
    const payload = { _id: user._id };
    return this.jwtService.signAsync(payload);
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.userModel.findOne({
        email: updateProfileDto.email,
      });
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
      user.email = updateProfileDto.email;
    }

    if (updateProfileDto.first_name) {
      user.first_name = updateProfileDto.first_name;
    }

    if (updateProfileDto.last_name) {
      user.last_name = updateProfileDto.last_name;
    }

    if (updateProfileDto.password) {
      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(updateProfileDto.password, salt);
    }

    await user.save();
    return this.userModel
      .findById(userId)
      .populate({ path: 'courses', populate: { path: 'videos' } });
  }
}
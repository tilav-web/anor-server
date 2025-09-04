import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { Confirmation, ConfirmationDocument } from './confirmation.schema';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { EskizService } from '../eskiz/eskiz.service';

const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Confirmation.name)
    private confirmationModel: Model<ConfirmationDocument>,
    private readonly mailerService: MailerService,
    private readonly jwtService: JwtService,
    private readonly eskizService: EskizService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<{ user: User; token: string }> {
    if (createUserDto.phone) {
      createUserDto.phone = normalizePhone(createUserDto.phone);
    }

    const salt = await bcrypt.genSalt();
    createUserDto.password = await bcrypt.hash(createUserDto.password, salt);
    const createdUser = new this.userModel(createUserDto);
    const user = await createdUser.save();
    const token = await this._createToken(user);
    return { user, token };
  }

  async login(loginDto: LoginUserDto): Promise<{ user: User; token: string }> {
    let findCondition;
    if (loginDto.email) {
      findCondition = { email: loginDto.email };
    } else if (loginDto.phone) {
      findCondition = { phone: normalizePhone(loginDto.phone) };
    } else {
      throw new UnauthorizedException('Please provide email or phone');
    }

    const user = await this.userModel.findOne(findCondition);
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

  async sendConfirmationCode(recipient: string, type: 'email' | 'phone') {
    const findCondition =
      type === 'email'
        ? { email: recipient }
        : { phone: normalizePhone(recipient) };

    const existingUser = await this.userModel.findOne(findCondition);
    if (existingUser) {
      throw new ConflictException(
        'User with this email or phone already exists',
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(code);
    const salt = await bcrypt.genSalt();
    const hashedCode = await bcrypt.hash(code, salt);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await this.confirmationModel.create({
      recipient,
      type,
      code: hashedCode,
      expiresAt,
    });

    if (type === 'email') {
      await this.mailerService.sendMail({
        to: recipient,
        subject: 'Confirmation Code',
        text: `Your confirmation code is: ${code}`,
      });
    } else {
      await this.eskizService.sendSms(
        normalizePhone(recipient),
        `uygunlik.uz saytidan ro'yhatdan o'tish uchun kod: ${code}`,
      );
    }
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
            { phone: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.userModel
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  async findById(userId: string): Promise<User> {
    return this.userModel.findById(userId);
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

  async confirm(recipient: string, code: string): Promise<boolean> {
    const confirmation = await this.confirmationModel
      .findOne({
        recipient,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 });

    if (confirmation) {
      const isCodeMatching = await bcrypt.compare(code, confirmation.code);
      if (isCodeMatching) {
        await this.confirmationModel.deleteOne({ _id: confirmation._id });
        return true;
      }
    }

    return false;
  }

  private async _createToken(user: UserDocument): Promise<string> {
    const payload = { _id: user._id };
    return this.jwtService.signAsync(payload);
  }
}

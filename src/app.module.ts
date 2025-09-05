import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './modules/user/user.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { VideoModule } from './modules/video/video.module';
import { CourseModule } from './modules/course/course.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EskizModule } from './modules/eskiz/eskiz.module';
import { VideoStreamModule } from './modules/video-stream/video-stream.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost/anor'),
    UserModule,
    VideoModule,
    CourseModule,
    EskizModule,
    VideoStreamModule,
    MailerModule.forRoot({
      transport: {
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'adella.wehner@ethereal.email',
          pass: 'gscxCYVwZ2VcN4pWfC',
        },
      },
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_secret_key', // TODO: move to .env file
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

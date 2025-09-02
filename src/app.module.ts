import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './modules/user/user.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { VideoModule } from './modules/video/video.module';
import { CourseModule } from './modules/course/course.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost/anor'),
    UserModule,
    VideoModule,
    CourseModule,
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

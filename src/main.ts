import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: ['https://uygunlik.uz', 'https://www.uygunlik.uz'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.use(cookieParser());
  

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();

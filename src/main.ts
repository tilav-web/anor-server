import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: ['https://uygunlik.uz', 'https://www.uygunlik.uz'],
    credentials: true,
  });

  app.use(cookieParser());
  app.use(bodyParser.json({ limit: '2gb' }));
  app.use(bodyParser.urlencoded({ limit: '2gb', extended: true }));

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();

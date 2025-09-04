import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: 'https://uygunlik.uz',
    credentials: true,
  });
  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();

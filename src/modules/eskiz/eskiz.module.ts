import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { EskizService } from './eskiz.service';
import { Eskiz, EskizSchema } from './eskiz.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: Eskiz.name, schema: EskizSchema }]),
  ],
  providers: [EskizService],
  exports: [EskizService],
})
export class EskizModule {}

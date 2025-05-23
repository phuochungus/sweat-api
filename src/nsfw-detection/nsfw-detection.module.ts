import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NSFWDetectionService } from './nsfw-detection.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [NSFWDetectionService],
  exports: [NSFWDetectionService],
})
export class NSFWDetectionModule {}

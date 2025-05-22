import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ImageProcessingService } from './image-processing.service';
import { ImageProcessingProcessor } from './image-processing.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'image-processing',
    }),
  ],
  providers: [ImageProcessingService, ImageProcessingProcessor],
  exports: [ImageProcessingService],
})
export class ImageProcessingModule {}

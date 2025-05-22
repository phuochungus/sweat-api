import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ImageProcessingService {
  constructor(
    @InjectQueue('image-processing') private imageProcessingQueue: Queue,
  ) {}

  async addProcessingJob(data: { url: string; s3_key: string }) {
    await this.imageProcessingQueue.add('resize', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });

    return { queued: true };
  }
}

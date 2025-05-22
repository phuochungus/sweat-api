import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class VideoProcessingService {
  constructor(
    @InjectQueue('video-processing') private videoProcessingQueue: Queue,
  ) {}

  async addProcessingJob(data: { url: string; s3_key: string }) {
    await this.videoProcessingQueue.add('compress', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });

    return { queued: true };
  }
}

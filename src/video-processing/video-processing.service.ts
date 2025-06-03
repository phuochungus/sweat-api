import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as AWS from 'aws-sdk';

@Injectable()
export class VideoProcessingService {
  private readonly s3: AWS.S3;

  constructor(
    @InjectQueue('video-processing') private videoProcessingQueue: Queue,
  ) {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }

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

  /**
   * Generate a thumbnail from a video URL
   * @param videoUrl The URL of the video to generate thumbnail from
   * @returns The S3 URL of the generated thumbnail
   */
  async generateVideoThumbnail(videoUrl: string): Promise<string> {
    let tempDir = '';
    try {
      // Create temp directory for processing
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thumbnail-generation-'));
      const downloadPath = path.join(tempDir, 'video');
      const thumbnailPath = path.join(tempDir, 'thumbnail.jpg');

      // Download the video file
      await this.downloadFile(videoUrl, downloadPath);

      // Generate thumbnail using ffmpeg
      await this.generateThumbnail(downloadPath, thumbnailPath);

      // Generate S3 key for thumbnail
      const videoS3Key = videoUrl
        .replace(process.env.AWS_S3_CDN_URL, '')
        .replace(process.env.AWS_S3_PUBLIC_URL, '');
      const thumbnailS3Key = videoS3Key.replace(/\.[^/.]+$/, '_thumbnail.jpg');

      // Upload thumbnail to S3
      await this.uploadThumbnailToS3(thumbnailPath, thumbnailS3Key);

      // Clean up temp files
      await this.cleanupFiles(tempDir, [downloadPath, thumbnailPath]);

      // Return the CDN URL for the thumbnail
      return `${process.env.AWS_S3_CDN_URL}${thumbnailS3Key}`;
    } catch (error) {
      console.error('Error generating video thumbnail:', error);
      // Clean up on error
      if (tempDir) {
        try {
          await this.cleanupFiles(tempDir);
        } catch (cleanupError) {
          console.warn(
            `Failed to clean up temporary files: ${cleanupError.message}`,
          );
        }
      }
      throw error;
    }
  }

  private async downloadFile(url: string, destination: string): Promise<void> {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      // HTTP download
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      await fs.promises.writeFile(destination, Buffer.from(buffer));
    } else {
      // S3 download (if URL is an S3 key)
      const s3Key = url
        .replace(process.env.AWS_S3_CDN_URL, '')
        .replace(process.env.AWS_S3_PUBLIC_URL, '');

      const s3Params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key,
      };

      const data = await this.s3.getObject(s3Params).promise();
      await fs.promises.writeFile(destination, data.Body as Buffer);
    }
  }

  private async generateThumbnail(
    videoPath: string,
    thumbnailPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['50%'], // Take screenshot at 50% of video duration
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }

  private async uploadThumbnailToS3(
    filePath: string,
    s3Key: string,
  ): Promise<void> {
    const fileBuffer = fs.readFileSync(filePath);

    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: 'image/jpeg',
    };

    await this.s3.putObject(s3Params).promise();
  }

  private async cleanupFiles(
    tempDir: string,
    filePaths: string[] = [],
  ): Promise<void> {
    try {
      // Close any potential file handles before deletion
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Delete specific files if provided
      if (filePaths.length > 0) {
        for (const filePath of filePaths) {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (error) {
            console.warn(`Error deleting file ${filePath}: ${error.message}`);
          }
        }
      }

      // Remove temp directory
      if (fs.existsSync(tempDir)) {
        // Remove all remaining files in directory
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          try {
            fs.unlinkSync(path.join(tempDir, file));
          } catch (error) {
            console.warn(`Error deleting file ${file}: ${error.message}`);
          }
        }

        // Finally, remove the directory
        fs.rmdirSync(tempDir);
      }
    } catch (error) {
      console.warn(`Cleanup error: ${error.message}`);
      // Don't throw - we want the main process to continue even if cleanup fails
    }
  }
}

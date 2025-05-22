import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as AWS from 'aws-sdk';

@Processor('image-processing')
export class ImageProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageProcessingProcessor.name);
  private readonly s3: AWS.S3;

  constructor() {
    super();
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }

  async process(job: Job<{ url: string; s3_key: string }>) {
    this.logger.debug(
      `Processing image job ${job.id} with data: ${JSON.stringify(job.data)}`,
    );
    const { url, s3_key } = job.data;
    let tempDir = '';

    try {
      // Create temp directory for processing
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'image-processing-'));
      const downloadPath = path.join(tempDir, 'original-image');
      const processedPath = path.join(tempDir, 'processed-image');

      // Download the file
      await this.downloadFile(url, downloadPath);

      // Process the image
      await this.processImage(downloadPath, processedPath);

      // Reupload to S3
      await this.uploadToS3(processedPath, s3_key);

      // Clean up - with safe file deletion
      await this.cleanupFiles(tempDir, [downloadPath, processedPath]);

      this.logger.debug(`Successfully processed image ${s3_key}`);
      return { success: true, s3_key };
    } catch (error) {
      this.logger.error(
        `Error processing image: ${error.message}`,
        error.stack,
      );
      // Attempt to clean up even if processing failed
      if (tempDir) {
        try {
          await this.cleanupFiles(tempDir);
        } catch (cleanupError) {
          this.logger.warn(
            `Failed to clean up temporary files: ${cleanupError.message}`,
          );
        }
      }
      throw error;
    }
  }

  // Helper method to safely clean up files
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
            this.logger.warn(
              `Error deleting file ${filePath}: ${error.message}`,
            );
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
            this.logger.warn(`Error deleting file ${file}: ${error.message}`);
          }
        }

        // Finally, remove the directory
        fs.rmdirSync(tempDir);
      }
    } catch (error) {
      this.logger.warn(`Cleanup error: ${error.message}`);
      // Don't throw - we want the main process to continue even if cleanup fails
    }
  }

  private async downloadFile(url: string, destination: string): Promise<void> {
    this.logger.debug(`Downloading file from ${url}`);

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
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
      };

      const data = await this.s3.getObject(s3Params).promise();
      await fs.promises.writeFile(destination, data.Body as Buffer);
    }
  }

  private async processImage(
    inputPath: string,
    outputPath: string,
  ): Promise<void> {
    this.logger.debug('Processing image...');

    // Set quality to 64 (approximately 80% of original quality)
    const quality = 64;
    const processed = await sharp(inputPath)
      // No resize operation to maintain original dimensions
      .jpeg({ quality })
      .toBuffer();

    fs.writeFileSync(outputPath, processed);
  }

  private async uploadToS3(filePath: string, s3Key: string): Promise<void> {
    this.logger.debug(`Uploading processed image to S3 key: ${s3Key}`);

    const fileBuffer = fs.readFileSync(filePath);

    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: 'image/jpeg',
    };

    await this.s3.putObject(s3Params).promise();
  }
}

import { BadGatewayException, Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucket: string;
  private publicUrl: string;
  private cdnUrl: string;

  constructor(private configService: ConfigService) {
    const awsConfig = this.configService.get('aws');

    this.s3Client = new S3Client({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      },
    });

    this.bucket = awsConfig.s3.bucket;
    this.publicUrl = awsConfig.s3.publicUrl;
    this.cdnUrl = awsConfig.s3.cdnUrl;
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    mimetype: string,
    folder = 'uploads',
  ): Promise<string> {
    const key = `${folder}/${uuidv4()}-${filename}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: mimetype,
        ACL: 'public-read',
      }),
    );

    return this.getFileUrl(key);
  }

  async deleteFile(key: string): Promise<void> {
    const fullKey = this.extractKeyFromUrl(key);

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fullKey,
      }),
    );
  }

  async generatePresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  getFileUrl(key: string): string {
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${key}`;
    }

    return `${this.publicUrl}/${key}`;
  }

  private extractKeyFromUrl(url: string): string {
    // Handle both CDN and direct S3 URLs
    if (url.includes(this.publicUrl)) {
      return url.replace(`${this.publicUrl}/`, '');
    }

    if (this.cdnUrl && url.includes(this.cdnUrl)) {
      return url.replace(`${this.cdnUrl}/`, '');
    }

    // If it's already just a key without a full URL
    if (!url.startsWith('http')) {
      return url;
    }

    // Try to extract key from URL if the above methods don't work
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // Remove leading slash
  }

  async batchGeneratePresignedUrl(
    batch: Array<{
      mimetype: string;
      id: string;
      ext: string;
      key?: string;
    }>,
  ) {
    if (batch?.length <= 0) {
      return [];
    }
    const awsConfig = this.configService.get('aws');
    const credentials = awsConfig?.accessKeyId
      ? {
          accessKeyId: awsConfig.accessKeyId,
          secretAccessKey: awsConfig.secretAccessKey,
        }
      : null;
    const s3Client = new S3Client({
      ...(credentials ? { credentials } : {}),
      region: awsConfig.region,
    });
    const bucket = awsConfig.s3.bucket;
    const results = [];
    try {
      for (let index = 0; index < batch.length; index++) {
        const { id, mimetype, ext } = batch[index];
        let s3Key = batch[index]?.key;
        if (!s3Key) {
          const newFileName = `${uuidv4()}`;
          s3Key = `${id}/${id}-${newFileName}.${ext}`;
        }
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: s3Key,
          // ACL: 'public-read',
          ContentType: mimetype,
        });
        const signedUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 1800, //expired in - 30 min,
        });
        results.push({
          uploadUrl: signedUrl,
          key: s3Key,
        });
      }

      return results;
    } catch (error) {
      console.log(error);
      throw new BadGatewayException('Không thể tải files');
    }
  }

  async deleteS3Object(key) {
    if (!key) throw new BadGatewayException('Cannot delete s3 object');
    const awsConfig = this.configService.get('aws');
    const bucket = this.configService.get('s3').bucket;
    const credentials: any = awsConfig?.accessKeyId
      ? {
          accessKeyId: awsConfig.accessKeyId,
          secretAccessKey: awsConfig.secretAccessKey,
        }
      : {};
    const s3Client = new S3Client({
      credentials,
      region: awsConfig.region,
    });
    try {
      const command = new DeleteObjectCommand({
        Key: key,
        Bucket: bucket,
      });
      await s3Client.send(command);
      return { success: true };
    } catch (error) {
      console.log(error);
      return { success: false };
    }
  }
}

import { BadGatewayException, Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidV4 } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  constructor(private readonly configService: ConfigService) {}

  async generatePresignedUrl({ mimetype, id, ext, key = '' }) {
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
    const bucket = this.configService.get('s3').bucket;
    if (!key) {
      const newFileName = `${uuidV4()}`;
      key = `${id}/${id}-${newFileName}.${ext}`;
    }
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        // ACL: 'public-read',
        ContentType: mimetype,
      });
      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 1800, //expired in - 30 min,
      });
      return {
        uploadUrl: signedUrl,
        key,
      };
    } catch (error) {
      throw new BadGatewayException('Không thể tải files');
    }
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
    const bucket = this.configService.get('s3').bucket;
    const results = [];
    try {
      for (let index = 0; index < batch.length; index++) {
        const { id, mimetype, ext } = batch[index];
        let s3Key = batch[index]?.key;
        if (!s3Key) {
          const newFileName = `${uuidV4()}`;
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

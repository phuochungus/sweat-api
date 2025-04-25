import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

export default () => ({
  port: parseInt(process.env.PORT) || 3000,
  environment: process.env.NODE_ENV || 'development',
  adminToken: process.env.ADMIN_TOKEN || 'default_admin_token',
  
  database: {
    type: process.env.ORM_CONNECTION || 'postgres',
    host: process.env.ORM_HOST || 'localhost',
    port: parseInt(process.env.ORM_PORT) || 5432,
    username: process.env.ORM_USERNAME || 'postgres',
    password: process.env.ORM_PASSWORD || 'postgres',
    database: process.env.ORM_DB || 'sweat_api',
    entities: [path.join(__dirname, '..', 'entities', '*.entity.{ts,js}')],
    synchronize: process.env.ORM_SYNCHRONIZE === 'true',
    logging: process.env.ORM_LOGGING === 'true',
    extra: {
      connectionLimit: parseInt(process.env.ORM_CONNECTION_LIMIT) || 10,
    },
  } as TypeOrmModuleOptions,
  
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-southeast-1',
    s3: {
      bucket: process.env.AWS_S3_BUCKET || 'sweat-api',
      publicUrl: process.env.AWS_S3_PUBLIC_URL || 'https://sweat-api.s3.amazonaws.com',
      cdnUrl: process.env.AWS_S3_CDN_URL,
    },
  },
  
  firebase: {
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  },
});

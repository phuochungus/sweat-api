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
    logging: process.env.LOG_LEVEL?.split(',') || ['log', 'error', 'warn'],
    extra: {
      connectionLimit: parseInt(process.env.ORM_CONNECTION_LIMIT) || 10,
    },
    // Ensures soft-deleted records are excluded from queries by default
    softDelete: true,
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-southeast-1',
    s3: {
      bucket: process.env.AWS_S3_BUCKET || 'sweat-api',
      publicUrl:
        process.env.AWS_S3_PUBLIC_URL || 'https://sweat-api.s3.amazonaws.com',
      cdnUrl: process.env.AWS_S3_CDN_URL,
    },
  },

  firebase: {
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  },

  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
  },
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
});

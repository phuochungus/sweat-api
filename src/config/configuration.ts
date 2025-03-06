export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    type: process.env.ORM_CONNECTION,
    host: process.env.ORM_HOST,
    port: process.env.ORM_PORT,
    username: process.env.ORM_USERNAME,
    password: process.env.ORM_PASSWORD,
    database: process.env.ORM_DB,
    timezone: 'Z',
    logging: process.env.ORM_LOGGING === 'true',
    autoLoadEntities: true,
    keepConnectionAlive: true,
    synchronize: process.env.ORM_SYNCHRONIZE == 'true',
    entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
    extra: {
      connectionLimit: parseInt(process.env.ORM_CONNECTION_LIMIT || '10', 10),
    },
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  },
  s3: {
    bucket: process.env.AWS_S3_BUCKET,
  },
});

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

export default () => ({
  port: parseInt(process.env.TEST_PORT) || 3333,
  environment: 'test',
  adminToken: 'test_admin_token',
  
  database: {
    type: 'postgres',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT) || 5432,
    username: process.env.TEST_DB_USERNAME || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
    database: process.env.TEST_DB_DATABASE || 'sweat_api_test',
    entities: [path.join(__dirname, '..', 'entities', '*.entity.{ts,js}')],
    synchronize: false, // Disable auto-sync as we'll handle this in setup-test-db.ts
    logging: false,
    dropSchema: false, // We'll handle this manually in our setup script
    extra: {
      connectionLimit: 10,
    },
  } as TypeOrmModuleOptions,
  
  // Test configuration for Firebase Emulator
  firebase: {
    useEmulator: true,
    emulatorHost: 'localhost', 
    emulatorPort: 9099, // Default Firebase Auth emulator port
    emulatorProjectId: 'sweat-api-test',
  },
  
  // Simplified AWS configuration for testing
  aws: {
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
    region: 'us-east-1',
    s3: {
      bucket: 'test-bucket',
      publicUrl: 'https://test-bucket.s3.amazonaws.com',
      cdnUrl: null,
    },
  },
});
import { DataSourceOptions } from 'typeorm';

import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const baseOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.ORM_HOST,
  port: Number(process.env.ORM_PORT),
  username: process.env.ORM_USERNAME,
  password: process.env.ORM_PASSWORD,
  database: process.env.ORM_DB,
  synchronize: false,
  dropSchema: false,
  entities: ['../src/entities/*.entity.ts'],
};

const migrationOptions: DataSourceOptions = {
  ...baseOptions,
  migrationsRun: true,
  logging: true,
  migrationsTableName: 'db_migrations',
  migrations: ['../migrations/**/*.ts'],
};

const seedOptions: DataSourceOptions = {
  ...baseOptions,
  type: 'postgres',
  name: 'seed',
  migrationsRun: true,
  logging: true,
  migrationsTableName: 'db_seeds',
  migrations: ['../seeds/**/*.ts'],
};

export default { migrationOptions, seedOptions };

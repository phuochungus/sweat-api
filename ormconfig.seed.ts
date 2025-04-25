import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';

const options: DataSourceOptions = {
  type: process.env.ORM_CONNECTION as 'postgres' | 'mysql',
  host: process.env.ORM_HOST,
  port: parseInt(process.env.ORM_PORT || '5432'),
  username: process.env.ORM_USERNAME,
  password: process.env.ORM_PASSWORD,
  database: process.env.ORM_DB,
  synchronize: false,
  logging: process.env.ORM_LOGGING === 'true',
  entities: [path.join(__dirname, 'src', 'entities', '*.entity.{ts,js}')],
  migrations: [path.join(__dirname, 'seeds', '*{.ts,.js}')],
};

const seedDataSource = new DataSource(options);
export default seedDataSource;

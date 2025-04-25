import { exec } from 'child_process';
import { promisify } from 'util';
import 'dotenv/config';
import testConfig from '../src/config/test-configuration';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { DataSource } from 'typeorm';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * This script sets up a test database for e2e tests
 */
async function setupTestDatabase() {
  try {
    const config = testConfig().database as PostgresConnectionOptions;
    console.log('🔧 Setting up test database...');

    // Create the test database if it doesn't exist already
    const createDbCommand = `
      psql -U ${config.username} -h ${config.host} -p ${config.port} -c "SELECT 1 FROM pg_database WHERE datname = '${config.database}'" | grep -q 1 || 
      psql -U ${config.username} -h ${config.host} -p ${config.port} -c "CREATE DATABASE ${config.database}"
    `;

    console.log(`⏳ Creating test database if not exists: ${config.database}`);
    await execAsync(createDbCommand);
    console.log('✅ Test database created or already exists');

    // Create a TypeORM connection to manage the schema
    const dataSource = new DataSource({
      type: 'postgres',
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      database: config.database,
      entities: [
        path.join(__dirname, '..', 'src', 'entities', '*.entity.{ts,js}'),
      ],
      synchronize: false, // We'll handle this manually
      logging: false,
    });

    // Initialize connection
    await dataSource.initialize();
    console.log('✅ Connected to test database');

    try {
      // Drop the schema first to ensure a clean state
      console.log('🧹 Dropping existing schema...');
      await dataSource.query(`DROP SCHEMA public CASCADE`);
      await dataSource.query(`CREATE SCHEMA public`);
      console.log('✅ Schema dropped and recreated');

      // Create the schema and tables
      console.log('📊 Creating database schema...');
      await dataSource.synchronize();
      console.log('✅ Schema created successfully');
    } finally {
      // Always close the connection
      await dataSource.destroy();
    }

    console.log('🚀 Test database setup complete!');
    return true;
  } catch (error) {
    console.error('💥 Failed to set up test database:', error);
    return false;
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupTestDatabase()
    .then((success) => {
      if (success) {
        console.log('✨ Test database setup successful!');
        process.exit(0);
      } else {
        console.error('❌ Test database setup failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Unhandled error during test database setup:', error);
      process.exit(1);
    });
}

export default setupTestDatabase;

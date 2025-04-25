import { DataSource } from 'typeorm';
import * as path from 'path';
import 'dotenv/config';
import * as admin from 'firebase-admin';
import testConfig from '../../src/config/test-configuration';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

/**
 * This is a setup script for end-to-end tests.
 * It will initialize the test database and other dependencies.
 */
async function setupE2E() {
  console.log('🔧 Setting up E2E test environment...');
  
  const config = testConfig();
  const dbConfig = config.database as PostgresConnectionOptions;
  const firebaseConfig = config.firebase;

  // Step 1: Setup Firebase emulator
  try {
    if (!admin.apps.length) {
      const app = admin.initializeApp({
        projectId: firebaseConfig.emulatorProjectId,
      });
      
      if (firebaseConfig.useEmulator) {
        // Point to the Firebase emulator
        process.env.FIREBASE_AUTH_EMULATOR_HOST = `${firebaseConfig.emulatorHost}:${firebaseConfig.emulatorPort}`;
        console.log(`✅ Firebase auth emulator configured at ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
      }
    }
    console.log('✅ Firebase setup complete');
  } catch (error) {
    console.error('❌ Failed to setup Firebase:', error);
    console.error(error);
    process.exit(1);
  }

  // Step 2: Create fresh test database
  let dataSource: DataSource;
  try {
    // Create a database connection with the test configuration
    dataSource = new DataSource({
      type: dbConfig.type,
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      entities: dbConfig.entities as string[],
      synchronize: true,
      dropSchema: true,
    } as PostgresConnectionOptions);
    
    // Initialize the connection
    await dataSource.initialize();
    console.log('✅ Test database connection established');
    
    // Drop schema if exists and recreate it
    console.log('🗑️ Dropping and recreating database schema...');
    await dataSource.dropDatabase();
    await dataSource.synchronize();
    
    console.log('✅ Test database setup complete');
    
    // Close the connection when done
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Failed to set up test database:', error);
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }

  console.log('🚀 E2E test environment ready!');
}

// Export the DataSource factory function for tests to use
export function getTestDataSource(): DataSource {
  const config = testConfig();
  const dbConfig = config.database as unknown as PostgresConnectionOptions;
  
  return new DataSource({
    type: dbConfig.type,
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    entities: dbConfig.entities as string[],
    synchronize: true,
  } as PostgresConnectionOptions);
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupE2E()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 E2E setup failed:', error);
      process.exit(1);
    });
}

export default setupE2E;
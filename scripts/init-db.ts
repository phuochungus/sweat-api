import { exec } from 'child_process';
import * as path from 'path';
import * as util from 'util';

const execPromise = util.promisify(exec);
const projectRoot = path.resolve(__dirname, '..');

async function runCommand(command: string): Promise<void> {
  console.log(`Running command: ${command}`);
  try {
    const { stdout, stderr } = await execPromise(command, { cwd: projectRoot });
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error);
    process.exit(1);
  }
}

async function main() {
  try {
    console.log('🔄 Starting database initialization...');

    // Run migrations to create schema
    console.log('\n🏗️ Running database migrations...');
    await runCommand('npm run dbm:run');
    
    // Ask if user wants to seed the database
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('\n🌱 Do you want to seed the database with test data? (y/n): ', async (answer: string) => {
      readline.close();
      
      if (answer.toLowerCase() === 'y') {
        console.log('\n🌱 Seeding database with test data...');
        await runCommand('npm run dbs:run');
        console.log('\n✅ Database initialization complete with test data!');
      } else {
        console.log('\n✅ Database schema initialization complete without test data!');
      }
      
      console.log('\n📝 Next steps:');
      console.log('  1. Make sure your .env file is properly configured');
      console.log('  2. Start the application with: npm run start:dev');
    });
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
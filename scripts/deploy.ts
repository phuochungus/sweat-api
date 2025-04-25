import { exec } from 'child_process';
import * as path from 'path';
import * as util from 'util';
import * as fs from 'fs';

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

async function copyEnvForEnvironment(env: string) {
  const targetEnvFile = path.join(projectRoot, `.env.${env}`);
  const destEnvFile = path.join(projectRoot, '.env');

  if (!fs.existsSync(targetEnvFile)) {
    console.error(`Environment file .env.${env} not found`);
    process.exit(1);
  }

  fs.copyFileSync(targetEnvFile, destEnvFile);
  console.log(`✅ Environment file copied from .env.${env} to .env`);
}

async function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'development';

  console.log(`Deploying to ${environment} environment...`);

  try {
    // Set the appropriate environment variables
    await copyEnvForEnvironment(environment);

    // Build the application
    await runCommand('npm run build');
    console.log('✅ Build complete');

    // Run database migrations
    await runCommand('npm run dbm:run');
    console.log('✅ Database migrations applied');

    if (environment === 'production') {
      // Additional production steps can be added here
      console.log('Applying production-specific configurations...');
    }

    console.log(`🚀 Successfully deployed to ${environment} environment!`);
  } catch (error) {
    console.error('⚠️ Deployment failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env
// override: false ensures Railway's env vars (like PORT) take priority
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
  console.log('? Environment variables loaded from .env');
} else {
  console.log('?? No .env file found (using system env vars)');
}

console.log('? Environment variables loaded');

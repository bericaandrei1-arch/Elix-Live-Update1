
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env
const envPath = path.join(__dirname, '..', '.env'); if (require('fs').existsSync(envPath)) { dotenv.config({ path: envPath }); console.log('? Environment variables loaded from .env'); } else { console.log('?? No .env file found (using system env vars)'); }

console.log('✅ Environment variables loaded');


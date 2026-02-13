import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const indexHtml = path.join(distDir, 'index.html');
const notFoundHtml = path.join(distDir, '404.html');

try {
  if (fs.existsSync(indexHtml)) {
    fs.copyFileSync(indexHtml, notFoundHtml);
    console.log('✅ Copied index.html to 404.html for GitHub Pages SPA support');
  } else {
    console.warn('⚠️ dist/index.html not found! Skipping 404.html generation.');
    // Don't fail the build, just warn
  }
} catch (err) {
  console.error('❌ Failed to copy 404.html:', err);
  process.exit(1);
}

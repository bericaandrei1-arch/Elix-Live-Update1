import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: [
      'node_modules/**',
      'dist/**',
      'Elix Star Live Good MVP/**',
      'Elix_Star_Source_Code/**',
      'Backup_Restore_Point/**',
      'Backup_State_*/**',
      'backup-*/**',
      'android/**',
      'ios/**',
    ],
  }
});

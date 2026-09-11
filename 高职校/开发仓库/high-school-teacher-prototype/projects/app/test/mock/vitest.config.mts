import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const configDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(configDir, '../../src')
    }
  },
  test: {
    environment: 'node',
    include: [
      resolve(configDir, './mockEngine.test.ts'),
      resolve(configDir, '../workspace/*.test.ts')
    ],
    coverage: { enabled: false }
  }
});

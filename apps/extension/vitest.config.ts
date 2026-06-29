import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const sharedEntry = fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url));
const sdkEntry = fileURLToPath(new URL('../../packages/sdk/src/index.ts', import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: ['**/node_modules/**', '**/.plasmo/**', '**/build/**', '**/*.config.*'],
    },
  },
  resolve: {
    alias: [
      { find: /^~\/(.*)/, replacement: `${root}$1` },
      { find: /^~([^/])/, replacement: `${root}$1` },
      { find: /^@\//, replacement: `${root}` },
      { find: '@scriptguard/shared', replacement: sharedEntry },
      { find: '@scriptguard/sdk', replacement: sdkEntry },
    ],
  },
});

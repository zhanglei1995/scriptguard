import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

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
      { find: '@scriptguard/shared', replacement: '../../packages/shared/src/index.ts' },
      { find: '@scriptguard/sdk', replacement: '../../packages/sdk/src/index.ts' },
    ],
  },
})

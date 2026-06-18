import { defineConfig } from 'vitest/config'

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
    alias: {
      '~': '.',
      '@scriptguard/shared': '../../packages/shared/src/index.ts',
      '@scriptguard/sdk': '../../packages/sdk/src/index.ts',
    },
  },
})

import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

const EXTENSION_PATH = path.resolve(__dirname, '../apps/extension/build/chrome-mv3-prod')

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'html',
  timeout: 60_000,

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          headless: false,
          args: [
            `--disable-extensions-except=${EXTENSION_PATH}`,
            `--load-extension=${EXTENSION_PATH}`,
          ],
        },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          headless: false,
          firefoxUserPrefs: {
            'xpinstall.signatures.required': false,
            'extensions.experiments.enabled': true,
          },
        },
      },
    },
    {
      name: 'msedge',
      use: {
        ...devices['Desktop Edge'],
        launchOptions: {
          headless: false,
          channel: 'msedge',
          args: [
            `--disable-extensions-except=${EXTENSION_PATH}`,
            `--load-extension=${EXTENSION_PATH}`,
          ],
        },
      },
    },
  ],
})

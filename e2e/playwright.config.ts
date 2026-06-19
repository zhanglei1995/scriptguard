import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const EXTENSION_PATH = fileURLToPath(
  new URL('../apps/extension/build/chrome-mv3-prod', import.meta.url),
)

const isCI = !!process.env.CI

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  reporter: isCI ? [['html', { open: 'never' }], ['github']] : 'html',
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
          headless: isCI,
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
          headless: isCI,
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
          headless: isCI,
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

import { chromium, type Browser } from 'playwright'
import pino from 'pino'

const logger = pino({ level: process.env.LOG_LEVEL || 'info', base: { service: 'scriptguard-runner' } })

const MAX_BROWSERS = 3

export class BrowserPool {
  private browsers: Browser[] = []
  private launching = false

  async acquire(): Promise<Browser> {
    this.browsers = this.browsers.filter((b) => b.isConnected())

    const available = this.browsers.find((b) => b.isConnected())
    if (available) return available

    if (this.browsers.length >= MAX_BROWSERS) throw new Error('No browser available')
    if (this.launching) throw new Error('No browser available')

    this.launching = true
    try {
      const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      })
      this.browsers.push(browser)
      logger.info({ browserCount: this.browsers.length }, 'Browser launched')
      return browser
    } finally {
      this.launching = false
    }
  }

  async release(browser: Browser): Promise<void> {
    // No-op: browsers are reused until crash/disconnect
  }

  get size(): number {
    return this.browsers.length
  }

  async closeAll(): Promise<void> {
    const closePromises = this.browsers.map((b) => b.close().catch(() => {}))
    await Promise.all(closePromises)
    this.browsers = []
    logger.info('All browsers closed')
  }
}

export const browserPool = new BrowserPool()

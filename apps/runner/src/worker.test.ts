import { describe, it, expect, vi, beforeEach } from 'vitest'

function createMockBrowser() {
  return {
    isConnected: vi.fn().mockReturnValue(true),
    newContext: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        goto: vi.fn(),
        evaluate: vi.fn().mockResolvedValue(undefined),
        screenshot: vi.fn().mockResolvedValue(Buffer.from('fake-png')),
        close: vi.fn(),
      }),
      addCookies: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    }),
    close: vi.fn().mockResolvedValue(undefined),
  }
}

const browsers: ReturnType<typeof createMockBrowser>[] = []

vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn().mockImplementation(() => {
      const b = createMockBrowser()
      browsers.push(b)
      return Promise.resolve(b)
    }),
  },
}))

vi.mock('pino', () => ({
  default: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

describe('BrowserPool', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    browsers.length = 0
  })

  async function createFreshPool() {
    const { BrowserPool } = await import('./browser-pool.js')
    return new BrowserPool()
  }

  it('acquires a browser by launching one', async () => {
    const pool = await createFreshPool()
    const browser = await pool.acquire()
    expect(browser).toBeDefined()
    expect(pool.size).toBe(1)
  })

  it('reuses existing connected browser', async () => {
    const pool = await createFreshPool()
    const b1 = await pool.acquire()
    const b2 = await pool.acquire()
    expect(b1).toBe(b2)
    expect(pool.size).toBe(1)
  })

  it('launches new browser when existing one disconnects', async () => {
    const pool = await createFreshPool()
    const b1 = await pool.acquire()
    expect(pool.size).toBe(1)

    browsers[0].isConnected.mockReturnValue(false)
    const b2 = await pool.acquire()
    expect(b2).not.toBe(b1)
    expect(pool.size).toBe(1)
  })

  it('closes all browsers', async () => {
    const pool = await createFreshPool()
    await pool.acquire()
    await pool.acquire()
    await pool.closeAll()
    expect(pool.size).toBe(0)
  })

  it('relaunches after crash', async () => {
    const pool = await createFreshPool()
    const b1 = await pool.acquire()

    browsers[0].isConnected.mockReturnValue(false)
    const b2 = await pool.acquire()
    expect(b2).toBeDefined()
    expect(b2).not.toBe(b1)
  })
})

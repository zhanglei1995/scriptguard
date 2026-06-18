import { afterEach, beforeAll, vi } from 'vitest'
import 'fake-indexeddb/auto'

// ====== Chrome Storage Mock ======
const mockLocalStore: Record<string, unknown> = {}
const mockSessionStore: Record<string, unknown> = {}

const chromeMock = {
  tabs: {
    query: vi.fn(async () => []),
    onRemoved: {
      addListener: vi.fn(),
    },
    onUpdated: {
      addListener: vi.fn(),
    },
  },
  storage: {
    local: {
      get: vi.fn(async (keys: string | string[]) => {
        if (typeof keys === 'string') {
          return { [keys]: mockLocalStore[keys] }
        }
        const result: Record<string, unknown> = {}
        for (const key of keys) {
          if (mockLocalStore[key] !== undefined) {
            result[key] = mockLocalStore[key]
          }
        }
        return result
      }),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(mockLocalStore, items)
      }),
      remove: vi.fn(async (keys: string | string[]) => {
        if (typeof keys === 'string') {
          delete mockLocalStore[keys]
        } else {
          for (const key of keys) {
            delete mockLocalStore[key]
          }
        }
      }),
    },
    session: {
      get: vi.fn(async (keys: string | string[]) => {
        if (typeof keys === 'string') {
          return { [keys]: mockSessionStore[keys] }
        }
        const result: Record<string, unknown> = {}
        for (const key of keys) {
          if (mockSessionStore[key] !== undefined) {
            result[key] = mockSessionStore[key]
          }
        }
        return result
      }),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(mockSessionStore, items)
      }),
      remove: vi.fn(async (keys: string | string[]) => {
        if (typeof keys === 'string') {
          delete mockSessionStore[keys]
        } else {
          for (const key of keys) {
            delete mockSessionStore[key]
          }
        }
      }),
    },
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
    clearAll: vi.fn(),
    getAll: vi.fn(async () => []),
    onAlarm: {
      addListener: vi.fn(),
    },
  },
  runtime: {
    sendMessage: vi.fn(async () => ({ ok: true })),
    openOptionsPage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
    },
  },
}

// @ts-ignore
globalThis.chrome = chromeMock

// ====== 全局测试清理 ======
afterEach(() => {
  // 清空 chrome storage mocks
  for (const key of Object.keys(mockLocalStore)) {
    delete mockLocalStore[key]
  }
  for (const key of Object.keys(mockSessionStore)) {
    delete mockSessionStore[key]
  }
  vi.clearAllMocks()
})

import { afterEach } from 'vitest'

// 全局测试清理
afterEach(() => {
  // 清空 chrome storage mocks
  if (globalThis.chrome?.storage?.local) {
    // @ts-ignore
    globalThis.chrome.storage.local._store = {}
  }
})

/**
 * Tab 状态注册表
 * Background 内存中维护 tab 状态，SW 休眠前持久化
 */
class TabRegistry {
  private tabs = new Map<number, { url: string; updatedAt: number }>()

  async init() {
    // 启动时从 storage 恢复
    const stored = await chrome.storage.session?.get('tabRegistry')
    if (stored?.tabRegistry) {
      this.tabs = new Map(stored.tabRegistry)
    }
  }

  private async persist() {
    await chrome.storage.session?.set({
      tabRegistry: Array.from(this.tabs.entries()),
    })
  }

  get(tabId: number) {
    return this.tabs.get(tabId)
  }

  set(tabId: number, state: { url: string }) {
    this.tabs.set(tabId, { ...state, updatedAt: Date.now() })
    this.persist()
  }

  reset(tabId: number) {
    this.tabs.delete(tabId)
    this.persist()
  }

  cleanup(tabId: number) {
    this.tabs.delete(tabId)
    this.persist()
  }

  size() {
    return this.tabs.size
  }
}

export const tabRegistry = new TabRegistry()

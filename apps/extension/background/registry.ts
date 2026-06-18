/**
 * Tab 状态注册表
 * Background SW 内存中维护 tab 状态，休眠前持久化到 session storage
 * 关联: TDD §6.2
 */

export interface TabState {
  url: string
  updatedAt: number
  scriptsLoaded?: boolean
}

class TabRegistry {
  private tabs = new Map<number, TabState>()

  async init() {
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

  get(tabId: number): TabState | undefined {
    return this.tabs.get(tabId)
  }

  set(tabId: number, state: { url: string }) {
    this.tabs.set(tabId, { ...state, updatedAt: Date.now() })
    this.persist()
  }

  markScriptsLoaded(tabId: number) {
    const state = this.tabs.get(tabId)
    if (state) {
      state.scriptsLoaded = true
      this.persist()
    }
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

  getAll() {
    return new Map(this.tabs)
  }
}

export const tabRegistry = new TabRegistry()

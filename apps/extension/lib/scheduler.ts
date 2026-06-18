/**
 * 本地定时任务调度器
 * 基于 chrome.alarms
 */
class Scheduler {
  async init() {
    console.log('[Scheduler] Initialized')
  }

  async scheduleCheck(scriptId: string, intervalSeconds: number) {
    await chrome.alarms.create(`check:${scriptId}`, {
      delayInMinutes: intervalSeconds / 60,
      periodInMinutes: intervalSeconds / 60,
    })
  }

  async runLocalCheck(_scriptId: string) {
    // TODO(SG-023): 真实实现
    console.log('[Scheduler] Local check:', _scriptId)
  }

  async clearCheck(scriptId: string) {
    await chrome.alarms.clear(`check:${scriptId}`)
  }
}

export const scheduler = new Scheduler()

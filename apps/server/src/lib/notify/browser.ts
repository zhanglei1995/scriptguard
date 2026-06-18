import type { NotifyChannelAdapter, NotifyPayload } from './types.js'

export class BrowserChannel implements NotifyChannelAdapter {
  async send(_config: Record<string, unknown>, _payload: NotifyPayload): Promise<{ success: boolean; error?: string }> {
    return { success: true }
  }
}

import { db } from '../db.js'
import { notifyChannels } from '@scriptguard/db'
import { eq, and } from 'drizzle-orm'
import { WebhookChannel } from './webhook.js'
import { EmailChannel } from './email.js'
import { BrowserChannel } from './browser.js'
import type { NotifyChannelAdapter, NotifyPayload } from './types.js'
import { logger } from '../logger.js'

export class NotificationService {
  private adapters: Record<string, () => NotifyChannelAdapter> = {
    webhook: () => new WebhookChannel(),
    email: () => new EmailChannel(),
    browser: () => new BrowserChannel(),
  }

  async send(alertId: string, channelIds: string[]): Promise<void> {
    if (channelIds.length === 0) return

    const channels = await db
      .select()
      .from(notifyChannels)
      .where(
        and(
          eq(notifyChannels.enabled, true),
        ),
      )
      .then((rows) => rows.filter((r) => channelIds.includes(r.id)))

    for (const channel of channels) {
      const factory = this.adapters[channel.type]
      if (!factory) {
        logger.warn({ type: channel.type }, 'Unknown channel type')
        continue
      }
      const adapter = factory()
      const payload: NotifyPayload = {
        title: `ScriptGuard Alert [${alertId}]`,
        body: `Alert ${alertId} triggered`,
        level: 'medium',
      }
      try {
        const result = await adapter.send(channel.config, payload)
        if (!result.success) {
          logger.error({ channelId: channel.id, error: result.error }, 'Notification failed')
        }
      } catch (err) {
        logger.error({ channelId: channel.id, error: err }, 'Notification error')
      }
    }
  }

  async sendTest(channelConfig: { type: string; config: Record<string, unknown> }, message?: string): Promise<{ success: boolean; error?: string }> {
    const factory = this.adapters[channelConfig.type]
    if (!factory) return { success: false, error: `Unknown channel type: ${channelConfig.type}` }
    const adapter = factory()
    const payload: NotifyPayload = {
      title: 'ScriptGuard Test',
      body: message ?? 'This is a test notification from ScriptGuard.',
      level: 'low',
    }
    return adapter.send(channelConfig.config, payload)
  }
}

export const notificationService = new NotificationService()

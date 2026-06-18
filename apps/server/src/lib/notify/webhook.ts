import type { NotifyChannelAdapter, NotifyPayload } from './types.js'
import { createHmac } from 'node:crypto'

type WebhookTemplate = 'feishu' | 'dingtalk' | 'slack' | 'generic'

interface WebhookConfig {
  url: string
  template?: WebhookTemplate
  secret?: string
}

function hmacSign(secret: string, timestamp: string): string {
  return createHmac('sha256', secret).update(`${timestamp}\n${secret}`).digest('base64')
}

function buildFeishuBody(payload: NotifyPayload, secret?: string): Record<string, unknown> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const card = {
    msg_type: 'interactive',
    card: {
      header: {
        title: { tag: 'plain_text', content: payload.title },
        template: payload.level === 'critical' || payload.level === 'high' ? 'red' : 'orange',
      },
      elements: [
        { tag: 'div', text: { tag: 'plain_text', content: payload.body } },
        ...(payload.url ? [{ tag: 'action', actions: [{ tag: 'button', text: { tag: 'plain_text', content: 'View Details' }, url: payload.url, type: 'primary' }] }] : []),
      ],
    },
  }
  if (secret) {
    return { ...card, timestamp, sign: hmacSign(secret, timestamp) }
  }
  return card
}

function buildDingTalkBody(payload: NotifyPayload, secret?: string): Record<string, unknown> {
  const timestamp = Date.now()
  const body: Record<string, unknown> = {
    msgtype: 'markdown',
    markdown: {
      title: payload.title,
      text: `### ${payload.title}\n\n${payload.body}${payload.url ? `\n\n[View Details](${payload.url})` : ''}`,
    },
  }
  if (secret) {
    const sign = hmacSign(secret, timestamp.toString())
    body.timestamp = timestamp
    body.sign = sign
  }
  return body
}

function buildSlackBody(payload: NotifyPayload): Record<string, unknown> {
  return {
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: payload.title } },
      { type: 'section', text: { type: 'mrkdwn', text: payload.body } },
      ...(payload.url ? [{ type: 'section', text: { type: 'mrkdwn', text: `<${payload.url}|View Details>` } }] : []),
    ],
  }
}

function buildGenericBody(payload: NotifyPayload): Record<string, unknown> {
  return {
    event: 'scriptguard_alert',
    script: payload.title,
    status: payload.level,
    message: payload.body,
    url: payload.url,
    timestamp: new Date().toISOString(),
  }
}

export class WebhookChannel implements NotifyChannelAdapter {
  async send(config: Record<string, unknown>, payload: NotifyPayload): Promise<{ success: boolean; error?: string }> {
    const webhookConfig = config as unknown as WebhookConfig
    const url = webhookConfig.url
    const template: WebhookTemplate = webhookConfig.template ?? 'generic'
    const secret = webhookConfig.secret
    if (!url) return { success: false, error: 'Missing webhook URL' }

    let body: Record<string, unknown>
    switch (template) {
      case 'feishu':
        body = buildFeishuBody(payload, secret)
        break
      case 'dingtalk':
        body = buildDingTalkBody(payload, secret)
        break
      case 'slack':
        body = buildSlackBody(payload)
        break
      default:
        body = buildGenericBody(payload)
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}: ${res.statusText}` }
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }
}

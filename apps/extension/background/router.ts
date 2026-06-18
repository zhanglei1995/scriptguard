/**
 * 类型化消息路由
 * 关联: TDD §5.1 内部 API
 */

// ====== 脚本存储类型 ======
export interface StoredScript {
  id: string
  name: string
  version: string
  code: string
  matchRules: MatchRule[]
  timeout?: number
}

export interface MatchRule {
  type: 'glob' | 'regex' | 'exact'
  pattern: string
}

// ====== URL 匹配 ======
export function matchUrl(url: string, rules: MatchRule[]): boolean {
  if (rules.length === 0) return false

  for (const rule of rules) {
    if (matchSingleRule(url, rule)) return true
  }
  return false
}

function matchSingleRule(url: string, rule: MatchRule): boolean {
  switch (rule.type) {
    case 'exact':
      return url === rule.pattern
    case 'glob':
      return matchGlob(url, rule.pattern)
    case 'regex':
      try {
        return new RegExp(rule.pattern).test(url)
      } catch {
        return false
      }
    default:
      return false
  }
}

function matchGlob(url: string, pattern: string): boolean {
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
  try {
    return new RegExp(`^${regexStr}$`).test(url)
  } catch {
    return false
  }
}

// ====== 消息类型 ======
export type Message =
  | { type: 'GET_SCRIPTS_FOR_URL'; payload: { url: string } }
  | { type: 'REPORT_CHECK'; payload: { scriptId: string; status: string; url: string } }
  | { type: 'PING' }
  | { type: 'RUN_MANUAL_CHECK' }
  | { type: 'SHOW_OVERLAY'; payload: { scriptId: string; message: string } }
  | { type: 'HIDE_OVERLAY' }

export type MessageResponse =
  | { type: 'SCRIPTS_RESULT'; scripts: StoredScript[] }
  | { type: 'PONG'; timestamp: number }
  | { ok: true }
  | { ok: false; error: string }

type Handler = (
  message: Message,
  sender: chrome.runtime.MessageSender
) => Promise<MessageResponse>

const handlers = new Map<string, Handler>()

export function registerHandler(type: string, handler: Handler) {
  handlers.set(type, handler)
}

export async function routeMessage(
  message: Message,
  sender: chrome.runtime.MessageSender
): Promise<MessageResponse> {
  const handler = handlers.get(message.type)
  if (!handler) {
    console.warn('[Router] Unknown message type:', message.type)
    return { ok: false, error: `Unknown message type: ${message.type}` }
  }
  return handler(message, sender)
}

// 内置 handlers
registerHandler('PING', async () => ({
  type: 'PONG',
  timestamp: Date.now(),
}))

registerHandler('GET_SCRIPTS_FOR_URL', async (msg, _sender) => {
  const { url } = (msg as Extract<Message, { type: 'GET_SCRIPTS_FOR_URL' }>).payload
  const result = await chrome.storage.local.get('scripts')
  const scripts = (result.scripts ?? []) as StoredScript[]
  const matched = scripts.filter((s) => matchUrl(url, s.matchRules))
  return { type: 'SCRIPTS_RESULT', scripts: matched }
})

registerHandler('REPORT_CHECK', async (msg, _sender) => {
  const report = msg as Extract<Message, { type: 'REPORT_CHECK' }>
  console.log('[Router] Check report:', report.payload)
  // TODO(SG-022): 写入 IndexedDB
  return { ok: true }
})

registerHandler('RUN_MANUAL_CHECK', async (_msg, _sender) => {
  const { checkRunner } = await import('./check-runner')
  return checkRunner.runManualCheck()
})

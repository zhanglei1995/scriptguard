/**
 * 类型化消息路由
 * 关联: TDD §5.1 内部 API
 */

export type Message =
  | { type: 'GET_SCRIPTS_FOR_URL'; payload: { url: string } }
  | { type: 'REPORT_CHECK'; payload: { scriptId: string; status: string; url: string } }
  | { type: 'PING' }
  | { type: 'SHOW_OVERLAY'; payload: { scriptId: string; message: string } }
  | { type: 'HIDE_OVERLAY' }

export type MessageResponse =
  | { type: 'SCRIPTS_RESULT'; scripts: unknown[] }
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
  // TODO(SG-014): 接入脚本注册表
  void msg
  return { type: 'SCRIPTS_RESULT', scripts: [] }
})

registerHandler('REPORT_CHECK', async (msg, _sender) => {
  const report = msg as Extract<Message, { type: 'REPORT_CHECK' }>
  console.log('[Router] Check report:', report.payload)
  // TODO(SG-022): 写入 IndexedDB
  return { ok: true }
})

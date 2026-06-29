/**
 * 类型化消息路由
 * 关联: TDD §5.1 内部 API
 */

import { matchScript } from '../matcher';
import { findMatchingScriptsForUrl } from '../storage/scripts-repository';
import type { Script } from '../storage/schemas';

// ====== 脚本存储类型 ======
export type StoredScript = Script;

export type MatchRule = string;
export interface LegacyMatchRule {
  type: 'glob' | 'regex' | 'exact';
  pattern: string;
}

// ====== URL 匹配 ======
export function matchUrl(url: string, rules: Array<MatchRule | LegacyMatchRule>): boolean {
  if (rules.length === 0) return false;

  return rules.some((rule) => {
    if (typeof rule === 'string') return matchScript(url, [rule]);
    return matchLegacyRule(url, rule);
  });
}

function matchLegacyGlob(url: string, pattern: string): boolean {
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  try {
    return new RegExp(`^${regexStr}$`).test(url);
  } catch {
    return false;
  }
}

function matchLegacyRule(url: string, rule: LegacyMatchRule): boolean {
  switch (rule.type) {
    case 'exact':
      return url === rule.pattern;
    case 'glob':
      return matchLegacyGlob(url, rule.pattern);
    case 'regex':
      try {
        return new RegExp(rule.pattern).test(url);
      } catch {
        return false;
      }
  }
}

// ====== 消息类型 ======
export type Message =
  | { type: 'GET_SCRIPTS_FOR_URL'; payload: { url: string } }
  | { type: 'REPORT_CHECK'; payload: { scriptId: string; status: string; url: string } }
  | { type: 'PING' }
  | { type: 'RUN_MANUAL_CHECK' }
  | { type: 'SHOW_OVERLAY'; payload: { scriptId: string; message: string } }
  | { type: 'HIDE_OVERLAY' };

export type ManualCheckResponse = {
  ok: true;
  results: Array<{
    scriptId: string;
    scriptName: string;
    status: 'healthy' | 'degraded' | 'failed';
    url: string;
    duration: number;
    failedRules: string[];
    errorMessage?: string;
  }>;
};

export type MessageResponse =
  | { type: 'SCRIPTS_RESULT'; scripts: StoredScript[] }
  | { type: 'PONG'; timestamp: number }
  | { ok: true }
  | ManualCheckResponse
  | { ok: false; error: string };

type Handler = (message: Message, sender: chrome.runtime.MessageSender) => Promise<MessageResponse>;

const handlers = new Map<string, Handler>();

export function registerHandler(type: string, handler: Handler) {
  handlers.set(type, handler);
}

export async function routeMessage(
  message: Message,
  sender: chrome.runtime.MessageSender,
): Promise<MessageResponse> {
  const handler = handlers.get(message.type);
  if (!handler) {
    console.warn('[Router] Unknown message type:', message.type);
    return { ok: false, error: `Unknown message type: ${message.type}` };
  }
  return handler(message, sender);
}

// 内置 handlers
registerHandler('PING', async () => ({
  type: 'PONG',
  timestamp: Date.now(),
}));

registerHandler('GET_SCRIPTS_FOR_URL', async (msg, _sender) => {
  const { url } = (msg as Extract<Message, { type: 'GET_SCRIPTS_FOR_URL' }>).payload;
  const scripts = await findMatchingScriptsForUrl(url);
  return { type: 'SCRIPTS_RESULT', scripts };
});

registerHandler('REPORT_CHECK', async (msg, _sender) => {
  const report = msg as Extract<Message, { type: 'REPORT_CHECK' }>;
  console.log('[Router] Check report:', report.payload);
  // TODO(SG-022): 写入 IndexedDB
  return { ok: true };
});

registerHandler('RUN_MANUAL_CHECK', async (_msg, _sender) => {
  const { checkRunner } = await import('./check-runner');
  const response = await checkRunner.runManualCheck();
  if (!response.ok) {
    return { ok: false, error: response.error ?? 'Manual check failed' };
  }
  return { ok: true, results: response.results ?? [] };
});

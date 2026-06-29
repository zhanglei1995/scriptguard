/**
 * ScriptGuard Content Script
 * 注入到所有页面，捕获错误和执行健康检查
 *
 * 关联: TDD §3.1.2 + §9.4 + §5.1
 * SG-015: User Script Injection and Execution
 */

import type { PlasmoCSConfig } from 'plasmo';
import { capturePageError, startCheck } from '../lib/checks';
import { injectScript } from './injector';
import { runScript, type ScriptContext, type RunAt } from './script-runner';
import type { CheckRule } from './rule-engine';

// ====== Plasmo Content Script 配置 ======
export const config: PlasmoCSConfig = {
  matches: ['<all_urls>'],
  run_at: 'document_start',
  world: 'ISOLATED',
};

// ====== 错误捕获（最早时机） ======
const pageErrors: Array<{ type: string; message: string; time: number }> = [];

capturePageError(window, (err: { type: string; message: string; reason?: string }) => {
  pageErrors.push({
    type: err.type,
    message: err.type === 'error' ? err.message : (err.reason ?? ''),
    time: Date.now(),
  });
});

// ====== 启动 ======
async function bootstrap() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SCRIPTS_FOR_URL',
      payload: { url: location.href },
    });

    if (response?.type === 'SCRIPTS_RESULT' && Array.isArray(response.scripts)) {
      // Separate scripts by runAt timing
      const immediateScripts: ScriptContext[] = [];
      const deferredScripts: ScriptContext[] = [];

      for (const script of response.scripts) {
        const runAt: RunAt = script.runAt ?? 'document_idle';
        const ctx: ScriptContext = {
          id: script.id,
          name: script.name,
          code: script.code,
          runAt,
          timeout: script.timeout,
          rules: (script.rules as CheckRule[] | undefined) ?? [],
        };

        if (runAt === 'document_start') {
          immediateScripts.push(ctx);
        } else if (runAt === 'manual') {
          // Manual scripts: record but don't inject
          await startCheck({
            scriptId: script.id,
            url: location.href,
            status: 'unknown',
            startedAt: Date.now(),
            endedAt: Date.now(),
            duration: 0,
            failedRules: [],
          });
        } else {
          deferredScripts.push(ctx);
        }
      }

      // Inject immediate scripts first
      await Promise.all(immediateScripts.map((ctx) => runScript(ctx, document, injectScript)));

      // Then inject deferred scripts (they wait for lifecycle events internally)
      await Promise.all(deferredScripts.map((ctx) => runScript(ctx, document, injectScript)));
    }
  } catch (err: unknown) {
    console.debug('[ScriptGuard] Background not available:', err);
  }
}

bootstrap();

export {};

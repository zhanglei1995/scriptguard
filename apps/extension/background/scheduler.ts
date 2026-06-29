/**
 * Scheduler - 定时检测调度器
 * SG-023: chrome.alarms 本地定时检测
 *
 * 从 store 读取所有启用脚本，用 chrome.alarms 注册定时检查
 * alarm 触发时打开后台标签页、注入 content script、执行检查、关闭标签页
 */

import { createCheckAlarm, clearCheckAlarm, clearAllCheckAlarms } from './alarms';
import { notifier } from './notifier';
import { addCheck, getChecksByScript } from '../storage/db';
import { getCheckRulesForScript, getEnabledScripts } from '../storage/scripts-repository';
import type { Script, HealthStatus } from '../storage/schemas';

const DEFAULT_INTERVAL_SECONDS = 1800;
const MIN_INTERVAL_SECONDS = 60;

function getCheckInterval(script: Script): number {
  const raw = (script.config as Record<string, unknown>)?.checkInterval;
  if (typeof raw === 'number' && raw >= MIN_INTERVAL_SECONDS) {
    return raw;
  }
  return DEFAULT_INTERVAL_SECONDS;
}

export class Scheduler {
  /**
   * 从 store 读取所有启用脚本，注册 alarms
   * 在 onInstalled / onStartup 时调用
   */
  async init(): Promise<void> {
    const scripts = await getEnabledScripts();
    for (const script of scripts) {
      await createCheckAlarm(script.id, getCheckInterval(script));
    }
    console.log(`[Scheduler] Initialized ${scripts.length} alarms`);
  }

  /**
   * 注册单个脚本的 alarm
   */
  async scheduleScript(scriptId: string, intervalSeconds: number): Promise<void> {
    const clamped = Math.max(intervalSeconds, MIN_INTERVAL_SECONDS);
    await createCheckAlarm(scriptId, clamped);
  }

  /**
   * 取消单个脚本的 alarm
   */
  async unscheduleScript(scriptId: string): Promise<void> {
    await clearCheckAlarm(scriptId);
  }

  /**
   * 重新注册所有脚本的 alarms（脚本变更时调用）
   */
  async rescheduleAll(): Promise<void> {
    await clearAllCheckAlarms();
    await this.init();
  }

  /**
   * alarm 触发时的处理逻辑
   * 打开后台标签页 → 注入 content script → 执行检查 → 收集结果 → 关闭标签页
   */
  async handleAlarm(scriptId: string): Promise<void> {
    const scripts = await getEnabledScripts();
    const script = scripts.find((s) => s.id === scriptId);
    if (!script) {
      console.warn(`[Scheduler] Script ${scriptId} not found or disabled, skipping`);
      return;
    }

    const checkUrl = this.resolveCheckUrl(script);
    if (!checkUrl) {
      console.warn(`[Scheduler] No check URL for script ${scriptId}`);
      return;
    }

    let tabId: number | undefined;
    try {
      // 1. 打开后台标签页（无痕）
      const tab = await chrome.tabs.create({ url: checkUrl, active: false });
      tabId = tab.id!;

      // 2. 等待页面加载完成
      await this.waitForTabLoad(tabId);

      // 3. 注入 content script
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
      });

      // 4. 发送 RUN_CHECK 消息到 Content Script
      const rules = await getCheckRulesForScript(script.id);
      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'RUN_CHECK',
        payload: {
          scripts: [
            {
              id: script.id,
              name: script.name,
              code: script.code,
              rules,
            },
          ],
        },
      });

      // 5. 收集结果
      if (response?.ok && Array.isArray(response.results)) {
        for (const result of response.results) {
          const status: HealthStatus = result.status || 'unknown';

          if (status === 'failed') {
            const reason =
              result.errorMessage || `检查规则未通过: ${(result.failedRules || []).join(', ')}`;
            await notifier.notifyFailure(script.name, reason, script.id);
          } else {
            const prevChecks = await getChecksByScript(script.id);
            const lastCheck = prevChecks[0];
            if (lastCheck && lastCheck.status === 'failed') {
              await notifier.notifyRecovered(script.name, script.id);
            }
          }

          await addCheck({
            scriptId: script.id,
            timestamp: new Date(),
            status,
            url: result.url || checkUrl,
            duration: result.duration || 0,
            failedRules: result.failedRules || [],
            errorMessage: result.errorMessage,
          });
        }
      }
    } catch (err) {
      console.error(`[Scheduler] Check failed for ${scriptId}:`, err);
      await notifier.notifyFailure(
        script.name,
        err instanceof Error ? err.message : String(err),
        script.id,
      );
    } finally {
      // 6. 关闭标签页，释放资源
      if (tabId !== undefined) {
        try {
          await chrome.tabs.remove(tabId);
        } catch {
          // tab may already be closed
        }
      }
    }
  }

  private resolveCheckUrl(script: Script): string | null {
    const pattern = script.matchRules[0];
    if (!pattern) return null;

    const withoutWildcard = pattern
      .replace(/^\*:\/\//, 'https://')
      .replace(/^\*+\.?/, '')
      .replace(/\*.*$/, '')
      .replace(/\/$/, '');

    if (withoutWildcard.startsWith('http://') || withoutWildcard.startsWith('https://')) {
      return withoutWildcard;
    }

    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(withoutWildcard)) {
      return `https://${withoutWildcard}`;
    }

    return null;
  }

  private waitForTabLoad(tabId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        reject(new Error('Tab load timeout'));
      }, 30_000);

      function listener(updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) {
        if (updatedTabId === tabId && changeInfo.status === 'complete') {
          clearTimeout(timeout);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      }

      chrome.tabs.onUpdated.addListener(listener);
    });
  }
}

export const scheduler = new Scheduler();

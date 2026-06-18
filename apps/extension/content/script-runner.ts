/**
 * ScriptRunner - orchestrates script injection at the correct lifecycle timing
 * Supports document_start / document_idle / document_end / manual
 *
 * SG-015: User Script Injection and Execution
 */

import { injectScript, DEFAULT_TIMEOUT, type InjectResult } from './injector'
import { executeRules, type CheckRule, type ExecuteResult } from './rule-engine'
import { startCheck, type CheckReport } from '../lib/checks'
import { getOverlayManager, type OverlayStatus } from './overlay'

export type RunAt = 'document_start' | 'document_idle' | 'document_end' | 'manual'

export interface ScriptContext {
  id: string
  name: string
  code: string
  runAt: RunAt
  timeout?: number
  rules?: CheckRule[]
}

interface RunRecord {
  scriptId: string
  startedAt: number
  endedAt?: number
  result?: InjectResult
  ruleResult?: ExecuteResult
  error?: string
}

const runHistory: RunRecord[] = []

/**
 * Get the promise that resolves when the given lifecycle event fires.
 * Returns a promise that resolves immediately for 'document_start'.
 * If the event already fired, resolves immediately.
 */
function waitForEvent(event: 'DOMContentLoaded' | 'load', doc: Document): Promise<void> {
  return new Promise((resolve) => {
    if (doc.readyState === 'complete') {
      resolve()
      return
    }
    if (event === 'DOMContentLoaded' && doc.readyState !== 'loading') {
      resolve()
      return
    }
    const handler = () => {
      doc.removeEventListener(event, handler)
      resolve()
    }
    doc.addEventListener(event, handler)
  })
}

/**
 * Log injection error to chrome.storage.local
 */
async function logInjectionError(
  scriptId: string,
  error: string,
  startedAt: number
): Promise<void> {
  try {
    const result = await chrome.storage.local.get('injectionErrors')
    const errors = (result.injectionErrors ?? []) as Array<{
      scriptId: string
      error: string
      timestamp: number
    }>
    errors.push({ scriptId, error, timestamp: startedAt })
    // Keep only last 100 errors
    await chrome.storage.local.set({
      injectionErrors: errors.slice(-100),
    })
  } catch {
    // Silently fail if storage is unavailable
  }
}

/**
 * Run a script at the specified lifecycle timing
 */
export async function runScript(
  script: ScriptContext,
  doc: Document = document,
  injectFn: typeof injectScript = injectScript
): Promise<RunRecord> {
  const startedAt = Date.now()
  const record: RunRecord = { scriptId: script.id, startedAt }

  try {
    if (script.runAt === 'manual') {
      // Manual scripts are not auto-injected
      record.error = 'manual_scripts_not_auto_injected'
      return record
    }

    // Wait for the right lifecycle event
    if (script.runAt === 'document_idle') {
      await waitForEvent('DOMContentLoaded', doc)
    } else if (script.runAt === 'document_end') {
      await waitForEvent('load', doc)
    }
    // document_start: inject immediately

    const result = await injectFn(script.id, script.code, {
      timeout: script.timeout ?? DEFAULT_TIMEOUT,
      doc,
    })

    record.endedAt = Date.now()
    record.result = result

    if (result.status !== 'success') {
      await logInjectionError(script.id, result.error ?? result.status, startedAt)
      return record
    }

    // Run associated rules after successful injection
    if (script.rules && script.rules.length > 0) {
      const ruleResult = executeRules(script.rules, doc, location.href)
      record.ruleResult = ruleResult
    }

    // Report to background
    const report: CheckReport = {
      scriptId: script.id,
      url: location.href,
      status: record.ruleResult
        ? record.ruleResult.failedRules.length > 0
          ? record.ruleResult.status
          : 'healthy'
        : 'healthy',
      startedAt,
      endedAt: record.endedAt,
      duration: record.endedAt - startedAt,
      failedRules: record.ruleResult?.failedRules ?? [],
      errorMessage: result.error,
    }

    await startCheck(report)

    // SG-019: Show overlay based on result
    try {
      const overlayStatus: OverlayStatus =
        record.ruleResult?.status === 'failed'
          ? 'failed'
          : record.ruleResult?.status === 'degraded'
            ? 'degraded'
            : 'success'

      getOverlayManager().show({
        scriptId: script.id,
        status: overlayStatus,
        scriptName: script.name,
        failedRules: record.ruleResult?.failedRules ?? [],
        errorMessage: result.error,
        url: location.href,
      })
    } catch {
      // Overlay is best-effort, don't fail the script
    }
  } catch (err) {
    record.endedAt = Date.now()
    record.error = err instanceof Error ? err.message : String(err)

    await logInjectionError(script.id, record.error, startedAt)

    const report: CheckReport = {
      scriptId: script.id,
      url: location.href,
      status: 'failed',
      startedAt,
      endedAt: record.endedAt,
      duration: record.endedAt - startedAt,
      failedRules: ['injection_error'],
      errorMessage: record.error,
    }

    await startCheck(report)

    // SG-019: Show failed overlay on error
    try {
      getOverlayManager().show({
        scriptId: script.id,
        status: 'failed',
        scriptName: script.name,
        failedRules: ['injection_error'],
        errorMessage: record.error,
        url: location.href,
      })
    } catch {
      // Overlay is best-effort
    }
  }

  return record
}

/**
 * Get run history for a script
 */
export function getRunHistory(scriptId: string): RunRecord[] {
  return runHistory.filter((r) => r.scriptId === scriptId)
}

/**
 * Clear run history
 */
export function clearRunHistory(): void {
  runHistory.length = 0
}

/**
 * Schedule multiple scripts by their runAt timing
 * Returns immediately for document_start, schedules others
 */
export function scheduleScripts(
  scripts: ScriptContext[],
  doc: Document = document,
  injectFn: typeof injectScript = injectScript
): Array<Promise<RunRecord>> {
  const promises: Array<Promise<RunRecord>> = []

  for (const script of scripts) {
    const promise = runScript(script, doc, injectFn)
    runHistory.push({ scriptId: script.id, startedAt: Date.now() })
    promises.push(promise)
  }

  return promises
}

import { useEffect, useState, useCallback } from 'react'
import { useScriptsStore } from '~store/scripts'
import { filterMatchingScripts } from '~matcher'
import type { Script } from '~storage/schemas'

export interface CurrentTab {
  url: string
  hostname: string
  path: string
}

function truncateUrl(hostname: string, path: string, maxLen = 40): string {
  const full = hostname + path
  if (full.length <= maxLen) return full
  const available = maxLen - hostname.length - 3
  if (available <= 0) return hostname.slice(0, maxLen)
  return hostname + path.slice(0, available) + '...'
}

export function useCurrentTab() {
  const [tab, setTab] = useState<CurrentTab | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([activeTab]) => {
      if (!activeTab?.url) {
        setTab(null)
        setLoading(false)
        return
      }
      try {
        const u = new URL(activeTab.url)
        setTab({ url: activeTab.url, hostname: u.hostname, path: u.pathname })
      } catch {
        setTab(null)
      }
      setLoading(false)
    })
  }, [])

  return { tab, loading, displayUrl: tab ? truncateUrl(tab.hostname, tab.path) : '' }
}

export function useMatchedScripts(url: string | null) {
  const scripts = useScriptsStore((s) => s.scripts)

  if (!url) return []

  const enabled = scripts.filter((s) => s.enabled)
  return filterMatchingScripts(url, enabled)
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

// ====== Test Runner Types ======
export type TestStatus = 'idle' | 'running' | 'completed' | 'failed'

export interface ScriptCheckResult {
  scriptId: string
  scriptName: string
  status: 'healthy' | 'degraded' | 'failed'
  url: string
  duration: number
  failedRules: string[]
  errorMessage?: string
}

export interface TestResult {
  totalScripts: number
  passed: number
  failed: number
  degraded: number
  details: ScriptCheckResult[]
}

// ====== useTestRunner ======
export function useTestRunner() {
  const [status, setStatus] = useState<TestStatus>('idle')
  const [result, setResult] = useState<TestResult | null>(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const runTest = useCallback(async () => {
    setStatus('running')
    setResult(null)
    setProgress({ current: 0, total: 0 })

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'RUN_MANUAL_CHECK',
      })

      if (!response?.ok) {
        setStatus('failed')
        setResult(null)
        return
      }

      const details: ScriptCheckResult[] = response.results ?? []
      const passed = details.filter((r) => r.status === 'healthy').length
      const failed = details.filter((r) => r.status === 'failed').length
      const degraded = details.filter((r) => r.status === 'degraded').length

      setResult({
        totalScripts: details.length,
        passed,
        failed,
        degraded,
        details,
      })
      setStatus('completed')
    } catch {
      setStatus('failed')
      setResult(null)
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setProgress({ current: 0, total: 0 })
  }, [])

  return { status, result, progress, runTest, reset }
}

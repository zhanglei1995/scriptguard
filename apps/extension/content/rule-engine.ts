/**
 * Simplified rule engine for MVP (SG-015)
 * Executes check rules in ISOLATED world with direct DOM access
 *
 * Supported rule types:
 *   - selector_exists: CSS selector matches at least one element
 *   - selector_visible: matched element is visible (offsetWidth > 0 || display != none)
 *   - text_content: element's text content matches expected string
 *   - url_match: current URL matches a pattern (glob/regex/exact)
 */

export type RuleType = 'selector_exists' | 'selector_visible' | 'text_content' | 'url_match'

export interface CheckRule {
  id: string
  name: string
  type: RuleType
  config: Record<string, unknown>
  required: boolean
}

export interface RuleResult {
  ruleId: string
  passed: boolean
  error?: string
}

export interface ExecuteResult {
  status: 'healthy' | 'degraded' | 'failed'
  failedRules: string[]
  duration: number
}

/**
 * Execute all check rules for a script against the current document
 */
export function executeRules(
  rules: CheckRule[],
  doc: Document = document,
  url: string = location.href,
  timeout: number = 5_000
): ExecuteResult {
  const startedAt = Date.now()
  const results: RuleResult[] = []
  const failedRules: string[] = []

  for (const rule of rules) {
    const elapsed = Date.now() - startedAt
    if (elapsed >= timeout) {
      failedRules.push(rule.id)
      results.push({ ruleId: rule.id, passed: false, error: 'rule_timeout' })
      continue
    }

    try {
      const passed = evaluateRule(rule, doc, url)
      if (!passed) {
        failedRules.push(rule.id)
      }
      results.push({ ruleId: rule.id, passed })
    } catch (err) {
      failedRules.push(rule.id)
      results.push({
        ruleId: rule.id,
        passed: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const duration = Date.now() - startedAt
  const requiredFailed = results.some(
    (r) => !r.passed && rules.find((rule) => rule.id === r.ruleId)?.required
  )

  let status: 'healthy' | 'degraded' | 'failed'
  if (failedRules.length === 0) {
    status = 'healthy'
  } else if (requiredFailed) {
    status = 'failed'
  } else {
    status = 'degraded'
  }

  return { status, failedRules, duration }
}

function evaluateRule(rule: CheckRule, doc: Document, url: string): boolean {
  switch (rule.type) {
    case 'selector_exists':
      return evalSelectorExists(rule.config, doc)
    case 'selector_visible':
      return evalSelectorVisible(rule.config, doc)
    case 'text_content':
      return evalTextContent(rule.config, doc)
    case 'url_match':
      return evalUrlMatch(rule.config, url)
    default:
      return false
  }
}

function evalSelectorExists(config: Record<string, unknown>, doc: Document): boolean {
  const selector = config.selector as string | undefined
  if (!selector) return false
  return doc.querySelector(selector) !== null
}

function evalSelectorVisible(config: Record<string, unknown>, doc: Document): boolean {
  const selector = config.selector as string | undefined
  if (!selector) return false
  const el = doc.querySelector(selector)
  if (!el) return false
  if (el instanceof HTMLElement) {
    if (el.offsetWidth > 0 || el.offsetHeight > 0) return true
  }
  const style = doc.defaultView?.getComputedStyle(el)
  if (!style) return false
  return style.display !== 'none' && style.visibility !== 'hidden'
}

function evalTextContent(config: Record<string, unknown>, doc: Document): boolean {
  const selector = config.selector as string | undefined
  const expected = config.expected as string | undefined
  const operator = (config.operator as string) ?? 'contains'
  if (!selector || expected === undefined) return false

  const el = doc.querySelector(selector)
  if (!el) return false

  const text = el.textContent ?? ''
  switch (operator) {
    case 'equals':
      return text.trim() === expected
    case 'contains':
      return text.includes(expected)
    case 'matches':
      try {
        return new RegExp(expected).test(text)
      } catch {
        return false
      }
    default:
      return false
  }
}

function evalUrlMatch(config: Record<string, unknown>, url: string): boolean {
  const pattern = config.pattern as string | undefined
  if (!pattern) return false

  // regex /pattern/flags
  if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
    const lastSlash = pattern.lastIndexOf('/')
    const body = pattern.slice(1, lastSlash)
    const flags = pattern.slice(lastSlash + 1)
    try {
      return new RegExp(body, flags).test(url)
    } catch {
      return false
    }
  }

  // glob
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
  try {
    return new RegExp(`^${regexStr}$`, 'i').test(url)
  } catch {
    return false
  }
}

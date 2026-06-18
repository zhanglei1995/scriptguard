/**
 * URL 匹配引擎
 * 支持通配符、正则、域名、Tampermonkey @match 语法
 *
 * 关联: SG-013
 */

export type MatchRule = string

/**
 * 将 Tampermonkey @match 模式转换为正则
 * @match *://example.com/* → /^https?:\/\/example\.com\/.*$/
 */
function matchPatternToRegex(pattern: string): RegExp | null {
  let p = pattern.trim()

  // 正则 /pattern/flags
  if (p.startsWith('/') && p.lastIndexOf('/') > 0) {
    const lastSlash = p.lastIndexOf('/')
    const body = p.slice(1, lastSlash)
    const flags = p.slice(lastSlash + 1)
    try {
      return new RegExp(body, flags)
    } catch {
      return null
    }
  }

  // Tampermonkey @match: *://example.com/* or example.com/*
  // 转换: * → .*, ? → ., 其他正则转义
  const PROTOCOL_PLACEHOLDER = '%%PROTOCOL%%'
  if (p.startsWith('*://')) {
    p = PROTOCOL_PLACEHOLDER + p.slice(4)
  } else if (!p.includes('://') && !p.startsWith('/') && /^[a-zA-Z0-9]/.test(p)) {
    // 纯域名/路径模式（无协议），添加协议匹配
    p = PROTOCOL_PLACEHOLDER + p
  }
  p = p
    .replace(/\*\./g, '.*\\.')
    .replace(/\.\*/g, '\\..*')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
  if (p.startsWith(PROTOCOL_PLACEHOLDER)) {
    p = '(https?|http|file|ftp):\\/\\/' + p.slice(PROTOCOL_PLACEHOLDER.length)
  }

  try {
    return new RegExp(`^${p}$`, 'i')
  } catch {
    return null
  }
}

/**
 * 检查 URL 是否匹配单个规则
 */
function matchesRule(url: string, rule: string): boolean {
  const trimmed = rule.trim()
  if (!trimmed) return false

  // 正则
  if (trimmed.startsWith('/') && trimmed.lastIndexOf('/') > 0) {
    const regex = matchPatternToRegex(trimmed)
    return regex ? regex.test(url) : false
  }

  // 纯域名 (example.com)
  if (/^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname === trimmed || urlObj.hostname.endsWith(`.${trimmed}`)
    } catch {
      return false
    }
  }

  // 通配符 / Tampermonkey @match
  const regex = matchPatternToRegex(trimmed)
  return regex ? regex.test(url) : false
}

/**
 * 匹配 URL 与规则列表
 * @returns 匹配的规则数量
 */
export function matchScript(url: string, rules: MatchRule[]): boolean {
  for (const rule of rules) {
    if (matchesRule(url, rule)) {
      return true
    }
  }
  return false
}

/**
 * 从多个脚本中筛选匹配当前 URL 的
 */
export function filterMatchingScripts<T extends { matchRules: MatchRule[] }>(
  url: string,
  scripts: T[]
): T[] {
  return scripts.filter((s) => matchScript(url, s.matchRules))
}

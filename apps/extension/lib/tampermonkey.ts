/**
 * Tampermonkey Import Module
 *
 * SG-055: Tampermonkey 协同与导入
 * Parse .user.js metadata blocks, import from Tampermonkey backup JSON,
 * and map patterns to ScriptGuard matchRules.
 */

// ====== Types ======

export interface UserScriptMetadata {
  name: string
  namespace: string
  version: string
  description: string
  author: string
  match: string[]
  include: string[]
  exclude: string[]
  grant: string[]
  require: string[]
  resource: string[]
  runAt: 'document_start' | 'document_end' | 'document_idle'
  license: string
  homepage: string
  icon: string
  downloadURL: string
  updateURL: string
  custom: Record<string, string[]>
}

export interface ImportedScript {
  id: string
  name: string
  version: string
  description: string
  code: string
  matchRules: MatchRule[]
  runAt: 'document_start' | 'document_end' | 'document_idle' | 'manual'
  enabled: boolean
  createdAt: number
  updatedAt: number
  tags: string[]
  groupId: null
  config: Record<string, unknown>
  alertLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface MatchRule {
  type: 'glob' | 'regex' | 'exact'
  pattern: string
}

// ====== Metadata Parsing ======

const METADATA_HEADER = '// ==UserScript=='
const METADATA_FOOTER = '// ==/UserScript=='

export function parseUserScriptMetadata(content: string): UserScriptMetadata | null {
  const headerIdx = content.indexOf(METADATA_HEADER)
  const footerIdx = content.indexOf(METADATA_FOOTER)

  if (headerIdx === -1 || footerIdx === -1 || footerIdx <= headerIdx) {
    return null
  }

  const headerBlock = content.slice(headerIdx + METADATA_HEADER.length, footerIdx)
  const lines = headerBlock.split('\n')

  const meta: UserScriptMetadata = {
    name: '',
    namespace: '',
    version: '',
    description: '',
    author: '',
    match: [],
    include: [],
    exclude: [],
    grant: [],
    require: [],
    resource: [],
    runAt: 'document_idle',
    license: '',
    homepage: '',
    icon: '',
    downloadURL: '',
    updateURL: '',
    custom: {},
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('//')) continue

    const content = trimmed.replace(/^\/\/\s*/, '')
    const spaceIdx = content.indexOf(' ')
    if (spaceIdx === -1) continue

    const key = content.slice(0, spaceIdx).trim()
    const value = content.slice(spaceIdx + 1).trim()

    switch (key) {
      case '@name':
        meta.name = value
        break
      case '@namespace':
        meta.namespace = value
        break
      case '@version':
        meta.version = value
        break
      case '@description':
        meta.description = value
        break
      case '@author':
        meta.author = value
        break
      case '@match':
        meta.match.push(value)
        break
      case '@include':
        meta.include.push(value)
        break
      case '@exclude':
        meta.exclude.push(value)
        break
      case '@grant':
        meta.grant.push(value)
        break
      case '@require':
        meta.require.push(value)
        break
      case '@resource':
        meta.resource.push(value)
        break
      case '@run-at':
        if (value === 'document_start' || value === 'document_end' || value === 'document_idle') {
          meta.runAt = value
        }
        break
      case '@license':
        meta.license = value
        break
      case '@homepage':
      case '@homepageURL':
        meta.homepage = value
        break
      case '@icon':
      case '@iconURL':
        meta.icon = value
        break
      case '@downloadURL':
        meta.downloadURL = value
        break
      case '@updateURL':
        meta.updateURL = value
        break
      default:
        if (key.startsWith('@')) {
          if (!meta.custom[key]) meta.custom[key] = []
          meta.custom[key].push(value)
        }
        break
    }
  }

  return meta
}

export function extractUserCode(content: string): string {
  const footerIdx = content.indexOf(METADATA_FOOTER)
  if (footerIdx === -1) return content

  const afterFooter = content.slice(footerIdx + METADATA_FOOTER.length)
  return afterFooter.replace(/^\s*\n/, '')
}

// ====== Pattern Mapping ======

export function tampermonkeyPatternToMatchRule(pattern: string): MatchRule {
  // Regex pattern: /pattern/flags
  if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
    const lastSlash = pattern.lastIndexOf('/')
    const body = pattern.slice(1, lastSlash)
    const flags = pattern.slice(lastSlash + 1)
    return { type: 'regex', pattern: flags ? `/(?:${body})/${flags}` : `/(?:${body})/` }
  }

  // Tampermonkey @include patterns that are plain URLs
  if (pattern.startsWith('http://') || pattern.startsWith('https://')) {
    // Exact URL
    if (!pattern.includes('*') && !pattern.includes('?')) {
      return { type: 'exact', pattern }
    }
    // Glob pattern with wildcards
    return { type: 'glob', pattern }
  }

  // @include with protocol (file://, etc.)
  if (pattern.includes('://')) {
    if (!pattern.includes('*')) {
      return { type: 'exact', pattern }
    }
    return { type: 'glob', pattern }
  }

  // @match patterns (already in glob format)
  if (pattern.includes('*')) {
    return { type: 'glob', pattern }
  }

  return { type: 'glob', pattern: `${pattern}*` }
}

export function mapTampermonkeyPatterns(
  matchPatterns: string[],
  includePatterns: string[],
  excludePatterns: string[]
): { matchRules: MatchRule[]; excludeRules: MatchRule[] } {
  const matchRules: MatchRule[] = []
  const excludeRules: MatchRule[] = []

  for (const pattern of matchPatterns) {
    matchRules.push(tampermonkeyPatternToMatchRule(pattern))
  }

  for (const pattern of includePatterns) {
    const existing = matchRules.some(
      (r) => r.type === tampermonkeyPatternToMatchRule(pattern).type && r.pattern === tampermonkeyPatternToMatchRule(pattern).pattern
    )
    if (!existing) {
      matchRules.push(tampermonkeyPatternToMatchRule(pattern))
    }
  }

  for (const pattern of excludePatterns) {
    excludeRules.push(tampermonkeyPatternToMatchRule(pattern))
  }

  return { matchRules, excludeRules }
}

// ====== Backup Import ======

interface TampermonkeyBackupScript {
  name?: string
  namespace?: string
  description?: string
  version?: string
  author?: string
  enabled?: boolean
  code?: string
  matches?: string[]
  includes?: string[]
  excludes?: string[]
  'run-at'?: string
  grants?: string[]
}

interface TampermonkeyBackup {
  scripts?: TampermonkeyBackupScript[]
  version?: string
}

export function parseTampermonkeyBackup(jsonContent: string): TampermonkeyBackupScript[] {
  try {
    const data = JSON.parse(jsonContent) as Record<string, unknown>
    if (Array.isArray(data.scripts)) {
      return data.scripts as TampermonkeyBackupScript[]
    }
    // Single script format
    if (typeof data.name === 'string' || typeof data.code === 'string') {
      return [data as unknown as TampermonkeyBackupScript]
    }
    return []
  } catch {
    return []
  }
}

export function backupScriptToImportedScript(script: TampermonkeyBackupScript): ImportedScript {
  const name = script.name ?? 'Unnamed Script'
  const version = script.version ?? '1.0.0'
  const matchRules = mapTampermonkeyPatterns(
    script.matches ?? [],
    script.includes ?? [],
    script.excludes ?? []
  )

  const runAtMap: Record<string, ImportedScript['runAt']> = {
    document_start: 'document_start',
    document_end: 'document_end',
    document_idle: 'document_idle',
    body: 'document_end',
    documentbody: 'document_end',
    end: 'document_end',
    idle: 'document_idle',
    start: 'document_start',
  }

  const runAt = runAtMap[(script['run-at'] ?? 'document_idle').toLowerCase()] ?? 'document_idle'

  return {
    id: generateId(),
    name,
    version,
    description: script.description ?? '',
    code: script.code ?? '',
    matchRules: matchRules.matchRules,
    runAt,
    enabled: script.enabled ?? true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['tampermonkey-import'],
    groupId: null,
    config: {},
    alertLevel: 'medium',
  }
}

// ====== .user.js Import ======

export function importUserScript(content: string): ImportedScript | null {
  const metadata = parseUserScriptMetadata(content)
  if (!metadata) return null

  const code = extractUserCode(content)
  const { matchRules } = mapTampermonkeyPatterns(
    metadata.match,
    metadata.include,
    metadata.exclude
  )

  return {
    id: generateId(),
    name: metadata.name,
    version: metadata.version || '1.0.0',
    description: metadata.description,
    code,
    matchRules,
    runAt: metadata.runAt,
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['tampermonkey-import'],
    groupId: null,
    config: {
      namespace: metadata.namespace,
      author: metadata.author,
      license: metadata.license,
      homepage: metadata.homepage,
      grants: metadata.grant,
    },
    alertLevel: 'medium',
  }
}

// ====== Storage ======

export async function saveImportedScripts(scripts: ImportedScript[]): Promise<void> {
  const result = await chrome.storage.local.get('scripts')
  const existing = (result.scripts ?? []) as ImportedScript[]
  const merged = [...existing, ...scripts]
  await chrome.storage.local.set({ scripts: merged })
}

// ====== Helpers ======

function generateId(): string {
  return `sg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

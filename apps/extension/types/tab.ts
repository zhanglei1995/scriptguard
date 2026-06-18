export interface MatchedScript {
  id: string
  name: string
  version: string
  status: 'healthy' | 'degraded' | 'failed' | 'unknown'
  lastChecked: string
}

export interface TabInfo {
  url: string
  hostname: string
  path: string
  matchedScripts: MatchedScript[]
}

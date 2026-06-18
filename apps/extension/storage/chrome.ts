import { z } from 'zod'
import {
  ScriptCurrent,
  CheckRule,
  LocalSchedule,
  NotifyChannel,
  UserPreferences,
  SyncMeta,
  type Script,
  type CheckRule as CheckRuleType,
  type LocalSchedule as LocalScheduleType,
  type NotifyChannel as NotifyChannelType,
  type UserPreferences as UserPreferencesType,
  type SyncMeta as SyncMetaType,
} from './schemas'

// ====== Storage Key Types ======
export interface StorageKeys {
  scripts: Script[]
  rules: CheckRuleType[]
  schedules: LocalScheduleType[]
  channels: NotifyChannelType[]
  preferences: UserPreferencesType
  syncMeta: SyncMetaType
  authToken: string
}

// ====== Schema Map ======
const schemaMap: Record<string, z.ZodType> = {
  scripts: z.array(ScriptCurrent),
  rules: z.array(CheckRule),
  schedules: z.array(LocalSchedule),
  channels: z.array(NotifyChannel),
  preferences: UserPreferences,
  syncMeta: SyncMeta,
  authToken: z.string(),
}

// ====== Chrome Storage Wrapper ======
class ChromeStorage {
  private get storage() {
    return chrome.storage.local
  }

  async get<K extends keyof StorageKeys>(key: K): Promise<StorageKeys[K] | undefined> {
    const result = await this.storage.get(key)
    return result[key] as StorageKeys[K] | undefined
  }

  async getAll<K extends keyof StorageKeys>(keys: K[]): Promise<Partial<Pick<StorageKeys, K>>> {
    const result = await this.storage.get(keys)
    return result as Partial<Pick<StorageKeys, K>>
  }

  async set<K extends keyof StorageKeys>(key: K, value: StorageKeys[K]): Promise<void> {
    const schema = schemaMap[key]
    if (schema) {
      schema.parse(value)
    }
    await this.storage.set({ [key]: value })
  }

  async remove(key: keyof StorageKeys): Promise<void> {
    await this.storage.remove(key)
  }
}

// ====== Typed Store Factory ======
function createStore<K extends keyof StorageKeys>(key: K) {
  const chromeStorage = new ChromeStorage()

  return {
    get: () => chromeStorage.get(key),
    set: (value: StorageKeys[K]) => chromeStorage.set(key, value),
    remove: () => chromeStorage.remove(key),
  }
}

// ====== Exported Stores ======
export const scriptsStore = createStore('scripts')
export const rulesStore = createStore('rules')
export const schedulesStore = createStore('schedules')
export const channelsStore = createStore('channels')
export const preferencesStore = createStore('preferences')
export const syncMetaStore = createStore('syncMeta')
export const authStore = createStore('authToken')

// ====== Default Values ======
export const defaultPreferences: UserPreferencesType = {
  theme: 'system',
  language: 'zh-CN',
  notificationsEnabled: true,
  autoCheck: true,
  defaultIntervalMinutes: 30,
}

export const defaultSyncMeta: SyncMetaType = {}

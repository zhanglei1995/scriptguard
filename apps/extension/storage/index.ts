// ====== Chrome Storage (chrome.storage.local) ======
export {
  scriptsStore,
  rulesStore,
  schedulesStore,
  channelsStore,
  preferencesStore,
  syncMetaStore,
  authStore,
  defaultPreferences,
  defaultSyncMeta,
  type StorageKeys,
} from './chrome'

// ====== IndexedDB (Dexie) ======
export {
  ScriptGuardDB,
  getDB,
  addCheck,
  getChecksByScript,
  getChecksByStatus,
  getRecentChecks,
  deleteCheck,
  addSnapshot,
  getSnapshotsByScript,
  deleteSnapshot,
  addAlert,
  getAlertsByScript,
  getUnacknowledgedAlerts,
  acknowledgeAlert,
  deleteAlert,
  cleanupOldRecords,
  resetDB,
} from './db'

// ====== Session Storage (chrome.storage.session) ======
export {
  setPageCheckState,
  getPageCheckState,
  clearPageCheckState,
  setCommToken,
  getCommToken,
  clearCommToken,
  setTabCheckStatus,
  getTabCheckStatus,
  clearTabCheckStatus,
  cleanupSessionForTab,
} from './session'

// ====== Schemas ======
export {
  HealthStatus,
  AlertLevel,
  ScriptV1,
  ScriptV2,
  ScriptCurrent,
  CheckRule,
  LocalSchedule,
  NotifyChannel,
  UserPreferences,
  SyncMeta,
  CheckRecord,
  DomSnapshot,
  AlertRecord,
  scriptMigrations,
  migrateScript,
  type Script,
  type CheckRule as CheckRuleType,
  type LocalSchedule as LocalScheduleType,
  type NotifyChannel as NotifyChannelType,
  type UserPreferences as UserPreferencesType,
  type SyncMeta as SyncMetaType,
  type HealthStatus as HealthStatusType,
  type AlertLevel as AlertLevelType,
} from './schemas'

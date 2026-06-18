import { describe, it, expect } from 'vitest'
import {
  scriptsStore,
  rulesStore,
  schedulesStore,
  channelsStore,
  preferencesStore,
  syncMetaStore,
  authStore,
  ScriptCurrent,
  CheckRule,
  LocalSchedule,
  NotifyChannel,
  UserPreferences,
  SyncMeta,
} from '../index'

describe('Storage Index Exports', () => {
  it('exports all chrome storage stores', () => {
    expect(scriptsStore).toBeDefined()
    expect(rulesStore).toBeDefined()
    expect(schedulesStore).toBeDefined()
    expect(channelsStore).toBeDefined()
    expect(preferencesStore).toBeDefined()
    expect(syncMetaStore).toBeDefined()
    expect(authStore).toBeDefined()
  })

  it('exports all schemas', () => {
    expect(ScriptCurrent).toBeDefined()
    expect(CheckRule).toBeDefined()
    expect(LocalSchedule).toBeDefined()
    expect(NotifyChannel).toBeDefined()
    expect(UserPreferences).toBeDefined()
    expect(SyncMeta).toBeDefined()
  })

  it('exports store methods', () => {
    expect(typeof scriptsStore.get).toBe('function')
    expect(typeof scriptsStore.set).toBe('function')
    expect(typeof scriptsStore.remove).toBe('function')
  })
})

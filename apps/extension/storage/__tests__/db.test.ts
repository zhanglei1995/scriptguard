import { describe, it, expect, beforeEach } from 'vitest'
import {
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
} from '../db'

describe('IndexedDB (Dexie)', () => {
  beforeEach(async () => {
    await resetDB()
  })

  describe('Checks', () => {
    it('adds and retrieves checks', async () => {
      const record = {
        scriptId: 's1',
        timestamp: new Date(),
        status: 'healthy' as const,
        url: 'https://example.com',
        duration: 100,
        failedRules: [],
      }
      const id = await addCheck(record)
      expect(id).toBeDefined()

      const checks = await getChecksByScript('s1')
      expect(checks).toHaveLength(1)
      expect(checks[0]?.scriptId).toBe('s1')
    })

    it('filters by status', async () => {
      await addCheck({ scriptId: 's1', timestamp: new Date(), status: 'healthy', url: 'https://a.com', duration: 100, failedRules: [] })
      await addCheck({ scriptId: 's2', timestamp: new Date(), status: 'failed', url: 'https://b.com', duration: 200, failedRules: ['r1'] })

      const failed = await getChecksByStatus('failed')
      expect(failed).toHaveLength(1)
      expect(failed[0]?.scriptId).toBe('s2')
    })

    it('gets recent checks', async () => {
      for (let i = 0; i < 5; i++) {
        await addCheck({ scriptId: `s${i}`, timestamp: new Date(), status: 'healthy', url: `https://${i}.com`, duration: 100, failedRules: [] })
      }
      const recent = await getRecentChecks(3)
      expect(recent).toHaveLength(3)
    })

    it('deletes check', async () => {
      const id = await addCheck({ scriptId: 's1', timestamp: new Date(), status: 'healthy', url: 'https://a.com', duration: 100, failedRules: [] })
      await deleteCheck(id)
      const checks = await getChecksByScript('s1')
      expect(checks).toHaveLength(0)
    })
  })

  describe('Snapshots', () => {
    it('adds and retrieves snapshots', async () => {
      const id = await addSnapshot({
        scriptId: 's1',
        url: 'https://example.com',
        html: '<html></html>',
        timestamp: new Date(),
        reason: 'failure',
      })
      expect(id).toBeDefined()

      const snapshots = await getSnapshotsByScript('s1')
      expect(snapshots).toHaveLength(1)
      expect(snapshots[0]?.html).toBe('<html></html>')
    })

    it('deletes snapshot', async () => {
      const id = await addSnapshot({
        scriptId: 's1',
        url: 'https://example.com',
        html: '<html></html>',
        timestamp: new Date(),
        reason: 'manual',
      })
      await deleteSnapshot(id)
      const snapshots = await getSnapshotsByScript('s1')
      expect(snapshots).toHaveLength(0)
    })
  })

  describe('Alerts', () => {
    it('adds and retrieves alerts', async () => {
      const id = await addAlert({
        scriptId: 's1',
        timestamp: new Date(),
        level: 'high',
        message: 'Script failed',
      })
      expect(id).toBeDefined()

      const alerts = await getAlertsByScript('s1')
      expect(alerts).toHaveLength(1)
      expect(alerts[0]?.message).toBe('Script failed')
    })

    it('acknowledges alert', async () => {
      const id = await addAlert({
        scriptId: 's1',
        timestamp: new Date(),
        level: 'low',
        message: 'Warning',
      })
      await acknowledgeAlert(id)
      const alerts = await getUnacknowledgedAlerts()
      expect(alerts).toHaveLength(0)
    })

    it('gets unacknowledged alerts', async () => {
      await addAlert({ scriptId: 's1', timestamp: new Date(), level: 'high', message: 'Alert 1' })
      await addAlert({ scriptId: 's2', timestamp: new Date(), level: 'critical', message: 'Alert 2' })

      const unacked = await getUnacknowledgedAlerts()
      expect(unacked).toHaveLength(2)
    })

    it('deletes alert', async () => {
      const id = await addAlert({
        scriptId: 's1',
        timestamp: new Date(),
        level: 'medium',
        message: 'Test',
      })
      await deleteAlert(id)
      const alerts = await getAlertsByScript('s1')
      expect(alerts).toHaveLength(0)
    })
  })

  describe('Cleanup', () => {
    it('removes old records', async () => {
      // Add old record (31 days ago)
      const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
      await addCheck({ scriptId: 's1', timestamp: oldDate, status: 'healthy', url: 'https://old.com', duration: 100, failedRules: [] })
      await addSnapshot({ scriptId: 's1', url: 'https://old.com', html: '<html></html>', timestamp: oldDate, reason: 'failure' })

      // Add recent record
      await addCheck({ scriptId: 's2', timestamp: new Date(), status: 'healthy', url: 'https://new.com', duration: 100, failedRules: [] })

      const result = await cleanupOldRecords()
      expect(result.checks).toBe(1)
      expect(result.snapshots).toBe(1)

      // Recent record should remain
      const recent = await getChecksByScript('s2')
      expect(recent).toHaveLength(1)
    })
  })

  describe('Reset', () => {
    it('clears all tables', async () => {
      await addCheck({ scriptId: 's1', timestamp: new Date(), status: 'healthy', url: 'https://a.com', duration: 100, failedRules: [] })
      await addAlert({ scriptId: 's1', timestamp: new Date(), level: 'low', message: 'Test' })

      await resetDB()

      const checks = await getRecentChecks()
      expect(checks).toHaveLength(0)
    })
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { useScriptsStore } from '../scripts'

describe('ScriptsStore', () => {
  beforeEach(() => {
    useScriptsStore.setState({ scripts: [], filter: {} })
  })

  describe('createScript', () => {
    it('creates a script with generated id and timestamps', () => {
      const script = useScriptsStore.getState().createScript({ name: 'Test Script' })
      expect(script.id).toBeDefined()
      expect(script.name).toBe('Test Script')
      expect(script.version).toBe('1.0.0')
      expect(script.enabled).toBe(true)
      expect(script.createdAt).toBeGreaterThan(0)
      expect(script.updatedAt).toBe(script.createdAt)
    })

    it('stores script in state', () => {
      useScriptsStore.getState().createScript({ name: 'Test' })
      expect(useScriptsStore.getState().scripts).toHaveLength(1)
    })

    it('applies defaults for optional fields', () => {
      const script = useScriptsStore.getState().createScript({ name: 'Defaults' })
      expect(script.description).toBe('')
      expect(script.code).toBe('')
      expect(script.matchRules).toEqual([])
      expect(script.runAt).toBe('document_idle')
      expect(script.tags).toEqual([])
      expect(script.groupId).toBeNull()
      expect(script.config).toEqual({})
      expect(script.alertLevel).toBe('medium')
    })

    it('accepts custom values for optional fields', () => {
      const script = useScriptsStore.getState().createScript({
        name: 'Custom',
        tags: ['nav', 'sidebar'],
        groupId: 'g1',
        enabled: false,
        alertLevel: 'critical',
      })
      expect(script.tags).toEqual(['nav', 'sidebar'])
      expect(script.groupId).toBe('g1')
      expect(script.enabled).toBe(false)
      expect(script.alertLevel).toBe('critical')
    })
  })

  describe('updateScript', () => {
    it('updates a script and bumps updatedAt', () => {
      const script = useScriptsStore.getState().createScript({ name: 'Original' })
      const originalUpdatedAt = script.updatedAt
      // small delay to ensure different timestamp
      const updated = useScriptsStore.getState().updateScript(script.id, { name: 'Updated' })
      expect(updated).not.toBeNull()
      expect(updated!.name).toBe('Updated')
      expect(updated!.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt)
    })

    it('returns null for non-existent id', () => {
      const result = useScriptsStore.getState().updateScript('non-existent', { name: 'X' })
      expect(result).toBeNull()
    })
  })

  describe('deleteScript', () => {
    it('deletes an existing script', () => {
      const script = useScriptsStore.getState().createScript({ name: 'ToDelete' })
      const result = useScriptsStore.getState().deleteScript(script.id)
      expect(result).toBe(true)
      expect(useScriptsStore.getState().scripts).toHaveLength(0)
    })

    it('returns false for non-existent id', () => {
      const result = useScriptsStore.getState().deleteScript('non-existent')
      expect(result).toBe(false)
    })
  })

  describe('enableScript / disableScript', () => {
    it('enables a disabled script', () => {
      const script = useScriptsStore.getState().createScript({ name: 'Togglable', enabled: false })
      const enabled = useScriptsStore.getState().enableScript(script.id)
      expect(enabled!.enabled).toBe(true)
    })

    it('disables an enabled script', () => {
      const script = useScriptsStore.getState().createScript({ name: 'Togglable' })
      const disabled = useScriptsStore.getState().disableScript(script.id)
      expect(disabled!.enabled).toBe(false)
    })
  })

  describe('getScript', () => {
    it('returns script by id', () => {
      const script = useScriptsStore.getState().createScript({ name: 'FindMe' })
      const found = useScriptsStore.getState().getScript(script.id)
      expect(found?.name).toBe('FindMe')
    })

    it('returns undefined for non-existent id', () => {
      expect(useScriptsStore.getState().getScript('nope')).toBeUndefined()
    })
  })

  describe('getFilteredScripts', () => {
    beforeEach(() => {
      useScriptsStore.getState().createScript({ name: 'A', tags: ['nav'], groupId: 'g1', enabled: true })
      useScriptsStore.getState().createScript({ name: 'B', tags: ['footer'], groupId: 'g2', enabled: false })
      useScriptsStore.getState().createScript({ name: 'C', tags: ['nav', 'header'], groupId: 'g1', enabled: true })
    })

    it('filters by tags', () => {
      useScriptsStore.setState({ filter: { tags: ['nav'] } })
      const result = useScriptsStore.getState().getFilteredScripts()
      expect(result).toHaveLength(2)
      expect(result.map((s) => s.name)).toEqual(expect.arrayContaining(['A', 'C']))
    })

    it('filters by groupId', () => {
      useScriptsStore.setState({ filter: { groupId: 'g2' } })
      const result = useScriptsStore.getState().getFilteredScripts()
      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('B')
    })

    it('filters by enabled', () => {
      useScriptsStore.setState({ filter: { enabled: false } })
      const result = useScriptsStore.getState().getFilteredScripts()
      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('B')
    })

    it('filters by multiple criteria', () => {
      useScriptsStore.setState({ filter: { tags: ['nav'], enabled: true } })
      const result = useScriptsStore.getState().getFilteredScripts()
      expect(result).toHaveLength(2)
    })

    it('sorts by updatedAt descending', () => {
      useScriptsStore.setState({ filter: {} })
      const result = useScriptsStore.getState().getFilteredScripts()
      expect(result).toHaveLength(3)
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1]!.updatedAt).toBeGreaterThanOrEqual(result[i]!.updatedAt)
      }
    })
  })

  describe('setFilter', () => {
    it('updates filter state', () => {
      useScriptsStore.getState().setFilter({ tags: ['x'] })
      expect(useScriptsStore.getState().filter.tags).toEqual(['x'])
    })
  })

  describe('Zod validation', () => {
    it('rejects invalid data via createScript', () => {
      expect(() => {
        useScriptsStore.getState().createScript({ name: 123 as unknown as string })
      }).toThrow()
    })

    it('rejects invalid alertLevel', () => {
      expect(() => {
        useScriptsStore.getState().createScript({
          name: 'Bad',
          alertLevel: 'invalid' as unknown as 'low',
        })
      }).toThrow()
    })
  })

  describe('persistence consistency', () => {
    it('data round-trips through state', () => {
      const script = useScriptsStore.getState().createScript({
        name: 'Persist',
        tags: ['test'],
        groupId: 'g1',
      })
      const fromState = useScriptsStore.getState().getScript(script.id)
      expect(fromState).toEqual(script)
    })
  })
})

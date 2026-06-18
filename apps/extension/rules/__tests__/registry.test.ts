/**
 * Registry Tests
 *
 * SG-016: Rule Executor Interface and Base Class
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { registry } from '../registry'
import type { RuleExecutor } from '../types'

// Mock executor
const createMockExecutor = (type: string): RuleExecutor => ({
  type,
  execute: async () => ({
    ruleId: 'test',
    status: 'passed',
    duration: 0,
  }),
})

describe('ExecutorRegistry', () => {
  beforeEach(() => {
    registry.clear()
  })

  describe('register', () => {
    it('registers an executor', () => {
      const executor = createMockExecutor('test_type')
      registry.register('test_type', executor)

      expect(registry.has('test_type')).toBe(true)
    })

    it('throws when registering duplicate type', () => {
      const executor1 = createMockExecutor('test_type')
      const executor2 = createMockExecutor('test_type')

      registry.register('test_type', executor1)

      expect(() => registry.register('test_type', executor2)).toThrow(
        'Executor already registered for type: test_type'
      )
    })
  })

  describe('get', () => {
    it('returns executor for registered type', () => {
      const executor = createMockExecutor('test_type')
      registry.register('test_type', executor)

      const result = registry.get('test_type')
      expect(result).toBe(executor)
    })

    it('returns undefined for unregistered type', () => {
      const result = registry.get('nonexistent')
      expect(result).toBeUndefined()
    })
  })

  describe('getOrThrow', () => {
    it('returns executor for registered type', () => {
      const executor = createMockExecutor('test_type')
      registry.register('test_type', executor)

      const result = registry.getOrThrow('test_type')
      expect(result).toBe(executor)
    })

    it('throws for unregistered type', () => {
      expect(() => registry.getOrThrow('nonexistent')).toThrow(
        'No executor registered for type: nonexistent'
      )
    })
  })

  describe('has', () => {
    it('returns true for registered type', () => {
      registry.register('test_type', createMockExecutor('test_type'))

      expect(registry.has('test_type')).toBe(true)
    })

    it('returns false for unregistered type', () => {
      expect(registry.has('nonexistent')).toBe(false)
    })
  })

  describe('getRegisteredTypes', () => {
    it('returns empty array when no executors registered', () => {
      expect(registry.getRegisteredTypes()).toEqual([])
    })

    it('returns all registered types', () => {
      registry.register('type1', createMockExecutor('type1'))
      registry.register('type2', createMockExecutor('type2'))
      registry.register('type3', createMockExecutor('type3'))

      const types = registry.getRegisteredTypes()
      expect(types).toContain('type1')
      expect(types).toContain('type2')
      expect(types).toContain('type3')
      expect(types.length).toBe(3)
    })
  })

  describe('clear', () => {
    it('removes all registered executors', () => {
      registry.register('type1', createMockExecutor('type1'))
      registry.register('type2', createMockExecutor('type2'))

      registry.clear()

      expect(registry.getRegisteredTypes()).toEqual([])
      expect(registry.has('type1')).toBe(false)
      expect(registry.has('type2')).toBe(false)
    })
  })
})

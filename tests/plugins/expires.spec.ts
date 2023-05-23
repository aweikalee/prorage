import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMemoryStorage } from '../utils/memoryStorage'
import {
  createProrage,
  createExpiresPlugin,
  toRaw,
  primaryKeys,
} from '../../lib'
import { wait } from '../utils/wait'

const memoryStorage = createMemoryStorage()

describe('expires plugin', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2023, 5, 23))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('basic', () => {
    const {
      useExpires,
      useAbsoluteExpires,
      plugin: expiresPlugin,
    } = createExpiresPlugin()

    const { storage } = createProrage({
      storage: memoryStorage,
      plugins: [expiresPlugin],
    })

    const expires = 1
    const _expires = expires * (24 * 60 * 60 * 1000)

    it('useExpires', () => {
      useExpires(expires, () => (storage.test = 1))

      expect(JSON.parse(memoryStorage.getItem('test')!)).toStrictEqual({
        [primaryKeys.expires]: Date.now() + _expires,
        value: 1,
      })
      expect(storage.test).toBe(1)

      wait(_expires)
      expect(memoryStorage.getItem('test')).not.toBe(null)
      expect(storage.test).toBe(undefined)
      expect(memoryStorage.getItem('test')).toBe(null)
    })

    it('useAbsoluteExpires', () => {
      useAbsoluteExpires(
        new Date(Date.now() + _expires),
        () => (storage.test = 1)
      )

      expect(storage.test).toBe(1)

      wait(_expires)
      expect(memoryStorage.getItem('test')).not.toBe(null)
      expect(storage.test).toBe(undefined)
      expect(memoryStorage.getItem('test')).toBe(null)
    })
  })

  describe('options - primaryKey', () => {
    const primaryKey = 'test'
    const { useExpires, plugin: expiresPlugin } = createExpiresPlugin({
      multiplier: 1,
      primaryKey,
    })

    const { storage } = createProrage({
      storage: memoryStorage,
      plugins: [expiresPlugin],
    })

    const expires = 60 * 60 * 1000

    it('useExpires', () => {
      useExpires(expires, () => (storage.test = 1))
      expect(primaryKey in toRaw(storage).test).toBe(true)
      expect(storage.test).toBe(1)

      wait(expires)
      expect(storage.test).toBe(undefined)
      expect(memoryStorage.getItem('test')).toBe(null)
    })
  })

  describe('options - multiplier', () => {
    const { useExpires, plugin: expiresPlugin } = createExpiresPlugin({
      multiplier: 1,
    })

    const { storage } = createProrage({
      storage: memoryStorage,
      plugins: [expiresPlugin],
    })

    const expires = 60 * 60 * 1000

    it('useExpires', () => {
      useExpires(expires, () => (storage.test = 1))
      expect(storage.test).toBe(1)
    })

    it('expired', async () => {
      wait(expires)
      expect(storage.test).toBe(undefined)
      expect(memoryStorage.getItem('test')).toBe(null)
    })
  })

  describe('options - immediate', () => {
    const { useExpires, plugin: expiresPlugin } = createExpiresPlugin({
      multiplier: 1,
      immediate: true,
    })

    const { storage } = createProrage({
      storage: memoryStorage,
      plugins: [expiresPlugin],
    })

    const expires = 100

    it('immediate', async () => {
      useExpires(expires, () => (storage.test = 1))

      expect(memoryStorage.getItem('test')).not.toBeNull()
      expect(storage.test).toBe(1)

      wait(expires)

      expect(memoryStorage.getItem('test')).toBeNull()
      expect(storage.test).toBeNull()
    })
  })
})

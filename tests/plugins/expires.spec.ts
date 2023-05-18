import { describe, it, expect } from 'vitest'
import { createMemoryStorage } from '../utils/memoryStorage'
import { createProrage, createExpiresPlugin, toRaw } from '../../lib'
import { wait } from '../utils/wait'

const memoryStorage = createMemoryStorage()

describe('plugin expires tests', () => {
  it('basic', async () => {
    const { useExpires, plugin: expiresPlugin } = createExpiresPlugin()

    const { storage } = createProrage({
      storage: memoryStorage,
      plugins: [expiresPlugin],
    })

    const now = Date.now()
    const expires = 100
    const _expires = expires / (24 * 60 * 60 * 1000)
    const expiresTime = now + _expires

    useExpires(_expires, () => (storage.test = 1))

    const _value = JSON.parse(memoryStorage.getItem('test')!)
    expect(_value['#p_expires_']).toBeGreaterThanOrEqual(expiresTime)
    expect(_value['#p_expires_']).toBeLessThanOrEqual(Date.now() + expires)
    expect(_value.value).toBe(1)
    expect(storage.test).toBe(1)

    await wait(expires + 1)
    expect(memoryStorage.getItem('test')).not.toBe(null)
    expect(storage.test).toBe(undefined)
    expect(memoryStorage.getItem('test')).toBe(null)
  })

  it('multiplier', async () => {
    const { useExpires, plugin: expiresPlugin } = createExpiresPlugin({
      multiplier: 1,
    })

    const { storage } = createProrage({
      storage: memoryStorage,
      plugins: [expiresPlugin],
    })

    const now = Date.now()
    const expires = 100
    const expiresTime = now + expires

    useExpires(expires, () => (storage.test = 1))

    const _value = JSON.parse(memoryStorage.getItem('test')!)
    expect(_value['#p_expires_']).toBeGreaterThanOrEqual(expiresTime)
    expect(_value['#p_expires_']).toBeLessThanOrEqual(Date.now() + expires)
    expect(_value.value).toBe(1)
    expect(storage.test).toBe(1)
  })

  it('primaryKey', async () => {
    const primaryKey = 'test'
    const { useExpires, plugin: expiresPlugin } = createExpiresPlugin({
      multiplier: 1,
      primaryKey,
    })

    const { storage } = createProrage({
      storage: memoryStorage,
      plugins: [expiresPlugin],
    })

    const expires = 100

    useExpires(expires, () => (storage.test = 1))
    expect(primaryKey in toRaw(storage).test).toBe(true)
    expect(storage.test).toBe(1)

    await wait(expires + 1)
    expect(storage.test).toBe(undefined)
    expect(memoryStorage.getItem('test')).toBe(null)
  })
})

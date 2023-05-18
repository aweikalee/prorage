import { describe, it, expect } from 'vitest'
import { createMemoryStorage } from './utils/memoryStorage'
import { createProrage } from '../lib'

const memoryStorage = createMemoryStorage()

describe('basic tests', () => {
  it('basic setItem', () => {
    const { storage } = createProrage({
      storage: memoryStorage,
    })

    storage.foo = 'bar'

    expect(memoryStorage.getItem('foo')).toBe(JSON.stringify('bar'))
  })

  it('basic getItem', () => {
    const { storage } = createProrage({
      storage: memoryStorage,
    })

    expect(storage.foo).toBe('bar')
  })

  it('basic removeItem', () => {
    const { storage } = createProrage({
      storage: memoryStorage,
    })

    storage.foo = 'bar'
    expect(memoryStorage.getItem('foo')).toBe(JSON.stringify('bar'))

    delete storage.foo
    expect(memoryStorage.getItem('foo')).toBe(null)
  })
})

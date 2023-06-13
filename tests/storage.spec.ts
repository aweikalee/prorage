import { describe, it, expect, beforeEach } from 'vitest'
import { createStorage, prefixWrap, toProrageRaw } from '../lib'
import { nextTick } from './utils/wait'
import { createMemoryStorage } from './utils/memoryStorage'
import { toRaw } from '@vue/reactivity'

describe('storage', () => {
  let storage: any
  beforeEach(() => {
    storage = createStorage({
      saveFlush: 'sync',
    })
  })

  it('write', () => {
    storage.foo = 'bar'
    expect(localStorage.getItem('foo')).toBe(JSON.stringify('bar'))
  })

  it('read', () => {
    expect(storage.foo).toBe('bar')
  })

  it('delete', () => {
    delete storage.foo
    expect(localStorage.getItem('foo')).toBe(null)
    expect(storage.foo).toBe(undefined)
  })

  describe('key', () => {
    it('key: number', () => {
      storage[1] = 'number key'
      expect(localStorage.getItem('1')).toBe(JSON.stringify('number key'))
    })

    it('key: symbol', () => {
      // set symbol as key in root node will not be namespace
      const key = Symbol()
      storage[key] = 'symbol key'
      expect(storage[key]).toBe('symbol key')
      expect(localStorage.getItem(String(key))).toBe(null)
    })
  })

  describe('options', () => {
    it('saveFlush: async', async () => {
      const storage = createStorage({
        saveFlush: 'async',
      })

      storage.foo = 'foo'
      expect(localStorage.getItem('foo')).toBe(null)
      storage.foo = 'bar'
      expect(localStorage.getItem('foo')).toBe(null)
      await nextTick()
      expect(localStorage.getItem('foo')).toBe(JSON.stringify('bar'))
    })

    it('storage: memoryStorage', () => {
      const memoryStorage = createMemoryStorage()

      const storage = createStorage({
        saveFlush: 'sync',
        storage: memoryStorage,
      })

      expect(storage.foo).toBe(undefined)
      storage.foo = 'bar'
      expect(memoryStorage.getItem('foo')).toBe(JSON.stringify('bar'))

      delete storage.foo
      expect(memoryStorage.getItem('foo')).toBe(null)
    })

    it('storage: sessionStorage', () => {
      const storage = createStorage({
        saveFlush: 'sync',
        storage: sessionStorage,
      })

      expect(storage.foo).toBe(undefined)
      storage.foo = 'bar'
      expect(sessionStorage.getItem('foo')).toBe(JSON.stringify('bar'))

      delete storage.foo
      expect(sessionStorage.getItem('foo')).toBe(null)
    })

    describe('prefix: test#', () => {
      const prefix = 'test#'
      let storage: any
      beforeEach(() => {
        storage = createStorage({
          saveFlush: 'sync',
          prefix,
        })
      })

      it('write', () => {
        storage.foo = 'bar'
        expect(localStorage.getItem(prefixWrap(prefix, 'foo'))).toBe(
          JSON.stringify('bar')
        )
      })

      it('read', () => {
        expect(storage.foo).toBe('bar')
      })

      it('keys', () => {
        expect(Object.keys(storage)).toEqual(['foo'])
      })

      it('delete', () => {
        delete storage.foo
        expect(localStorage.getItem(prefixWrap(prefix, 'foo'))).toBe(null)
      })
    })
  })

  describe('api', () => {
    it('reload', () => {
      storage.foo = 'bar'
      expect(storage.foo).toBe('bar')
      localStorage.setItem('foo', JSON.stringify('baz'))
      expect(storage.foo).toBe('bar')
      storage.reload('foo')
      expect(storage.foo).toBe('baz')
    })

    it('save', () => {
      storage.foo = 'bar'
      expect(localStorage.getItem('foo')).toBe(JSON.stringify('bar'))

      const foo = toRaw(toProrageRaw(toRaw(storage).foo))
      foo.value = 'baz'

      expect(localStorage.getItem('foo')).toBe(JSON.stringify('bar'))

      storage.save('foo')
      expect(localStorage.getItem('foo')).toBe(JSON.stringify('baz'))
    })
  })
})

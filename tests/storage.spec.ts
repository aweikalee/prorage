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

  describe('length', () => {
    it('case 1', () => {
      localStorage.clear()
      storage.foo = 1
      expect(storage.length).toBe(1)
      storage.bar = 2
      expect(storage.length).toBe(2)
    })
    it('case 2', () => {
      expect(storage.length).toBe(2)
    })
    it('case 3', () => {
      delete storage.bar
      expect(storage.length).toBe(1)
    })
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
      localStorage.clear()
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

      it('clear', () => {
        localStorage.clear()
        localStorage.setItem('other', '')
        storage.foo = 'bar'
        storage.bar = 'baz'
        expect(storage.length).toBe(2)
        expect(localStorage.length).toBe(3)

        storage.clear()
        expect(storage.length).toBe(0)
        expect(localStorage.length).toBe(1)
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

    describe('clear', () => {
      it('all', () => {
        localStorage.clear()

        storage.foo = 'bar'
        storage.bar = 'baz'
        expect(storage.length).toBe(2)

        storage.clear()
        expect(storage.length).toBe(0)
      })

      it('before created', () => {
        localStorage.setItem('foo', '')
        expect(localStorage.getItem('foo')).toBe('')
        storage.clear('foo')
        expect(localStorage.getItem('foo')).not.toBe('')
        expect(storage.foo).toBe(undefined)
      })

      it('with key', () => {
        localStorage.clear()

        storage.foo = 'bar'
        storage.bar = 'baz'
        expect(storage.length).toBe(2)

        storage.clear('foo')
        expect(storage.length).toBe(1)
        expect(storage.foo).toBe(undefined)
        expect(storage.bar).toBe('baz')
      })
    })
  })
})

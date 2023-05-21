import { describe, it, expect } from 'vitest'
import { createMemoryStorage } from './utils/memoryStorage'
import { Replacer, createProrage, mergeReplacers } from '../lib'

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

describe('options - stringify, parse', () => {
  const options: Parameters<typeof createProrage>[0] = {
    storage: memoryStorage,
    stringify(value, replacer) {
      const replaces: Replacer[] = []

      replaces.push((_, value) => {
        if (typeof value !== 'bigint') return value
        return {
          '##bigint': value.toString(),
        }
      })

      if (replacer) replaces.push(replacer)

      return JSON.stringify(value, mergeReplacers(replaces))
    },
    parse: (value, reviver) => {
      const revivers: Replacer[] = []

      revivers.push((_, value) => {
        if (typeof value !== 'object') return value
        if (!('##bigint' in value)) return value
        return BigInt(value['##bigint'])
      })

      if (reviver) revivers.push(reviver)

      return JSON.parse(value, mergeReplacers(revivers))
    },
  }

  const { storage: writer } = createProrage(options)
  const { storage: reader } = createProrage(options)

  it('stringify and parse', () => {
    writer.json = 123n
    expect(memoryStorage.getItem('json')).toBe('{"##bigint":"123"}')

    expect(reader.json).toBe(123n)
  })
})

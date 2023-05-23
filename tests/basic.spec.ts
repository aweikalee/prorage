import { describe, it, expect } from 'vitest'
import { createMemoryStorage } from './utils/memoryStorage'
import {
  Options,
  Replacer,
  createProrage,
  mergeReplacers,
  prefixWrap,
} from '../lib'

const memoryStorage = createMemoryStorage()

describe('basic', () => {
  const options: Options = {
    storage: memoryStorage,
  }
  const { storage: writer } = createProrage(options)

  const { storage: reader } = createProrage(options)

  it('setItem', () => {
    writer.foo = 'bar'

    expect(memoryStorage.getItem('foo')).toBe(JSON.stringify('bar'))
  })

  it('getItem', () => {
    expect(reader.foo).toBe('bar')
  })

  it('removeItem', () => {
    writer.foo = 'bar'
    expect(memoryStorage.getItem('foo')).toBe(JSON.stringify('bar'))

    delete writer.foo
    expect(memoryStorage.getItem('foo')).toBe(null)
  })

  it('clear', () => {
    writer.foo = 'bar'
    writer.baz = 'qux'
    writer.clear()

    expect(memoryStorage.getItem('foo')).toBe(null)
    expect(memoryStorage.getItem('baz')).toBe(null)
  })

  it('keys', () => {
    writer.clear()
    expect(Object.keys(writer)).toEqual([])

    writer.foo = 'bar'
    writer.baz = {
      qux: 'quux',
    }

    expect(Object.keys(reader)).toEqual(['foo', 'baz'])
    expect(Object.keys(reader.baz)).toEqual(['qux'])
  })

  it('length', () => {
    writer.clear()
    expect(writer.length).toBe(0)
    expect(reader.length).toBe(0)

    writer.foo = 'bar'
    expect(writer.length).toBe(1)
    expect(reader.length).toBe(1)

    writer.baz = 'qux'
    expect(writer.length).toBe(2)
    expect(reader.length).toBe(2)

    delete writer.foo
    expect(writer.length).toBe(1)
    expect(reader.length).toBe(1)
  })
})

describe('options - stringify, parse', () => {
  const options: Options = {
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

describe('options - target', () => {
  const target: any = {}

  const { storage } = createProrage({
    storage: memoryStorage,
    target,
  })

  it('target', () => {
    storage.target = 'hello'
    expect(target.target).toBe('hello')
    expect(memoryStorage.getItem('target')).toBe(JSON.stringify('hello'))
  })
})

describe('options - prefix', () => {
  const { storage: foo } = createProrage({
    storage: memoryStorage,
    prefix: 'foo',
  })

  const { storage: bar } = createProrage({
    storage: memoryStorage,
    prefix: 'bar',
  })

  it('prefix', () => {
    foo.prefix = 'test'
    expect(memoryStorage.getItem('prefix')).not.toBe(JSON.stringify('test'))
    expect(memoryStorage.getItem(prefixWrap('foo', 'prefix'))).toBe(
      JSON.stringify('test')
    )
  })

  it('length', () => {
    expect(foo.length).toBe(1)
    expect(bar.length).toBe(0)

    bar.foo = 1
    bar.bar = 2
    expect(foo.length).toBe(1)
    expect(bar.length).toBe(2)
  })

  it('keys', () => {
    expect(Object.keys(foo)).toEqual(['prefix'])
    expect(Object.keys(bar)).toEqual(['foo', 'bar'])
  })

  it('clear', () => {
    foo.clear()
    expect(foo.length).toBe(0)
    expect(bar.length).toBe(2)

    bar.clear()
    expect(foo.length).toBe(0)
    expect(bar.length).toBe(0)
  })
})

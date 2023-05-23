import { describe, it, expect } from 'vitest'
import { createMemoryStorage } from './utils/memoryStorage'
import { createProrage } from '../lib'

const memoryStorage = createMemoryStorage()

describe('primitives tests', () => {
  const { storage } = createProrage({
    storage: memoryStorage,
  })

  it('boolean', () => {
    storage.boolean = true
    expect(memoryStorage.getItem('boolean')).toBe(JSON.stringify(true))
  })

  it('null', () => {
    storage.null = null
    expect(memoryStorage.getItem('null')).toBe(JSON.stringify(null))
  })

  it('undefined', () => {
    // undefined will be removeItem
    storage.undefined = undefined
    expect(memoryStorage.getItem('undefined')).toBe(null)
  })

  it('number', () => {
    storage.number = 3.1415926
    expect(memoryStorage.getItem('number')).toBe(JSON.stringify(3.1415926))

    // stringify(NaN) will be 'null'
    storage.NaN = NaN
    expect(memoryStorage.getItem('NaN')).toBe(JSON.stringify(NaN))

    // stringify(Infinity) will be 'null'
    storage.Infinity = Infinity
    expect(memoryStorage.getItem('Infinity')).toBe(JSON.stringify(Infinity))
  })

  it('bigint', async () => {
    const fn = async () => (storage.bigint = 42n)
    await expect(fn()).rejects.toBeTruthy()
  })

  it('string', () => {
    storage.string = 'hello world'
    expect(memoryStorage.getItem('string')).toBe(JSON.stringify('hello world'))
  })

  it('symbol', () => {
    storage.symbol = Symbol() // will be undefined
    expect(memoryStorage.getItem('symbol')).toBe(null)
  })

  it('symbol as key', async () => {
    const fn = async () => (storage[Symbol() as unknown as string] = 'symbol')
    await expect(fn()).rejects.toBeTruthy()
  })
})

import { describe, it, expect } from 'vitest'
import { createMemoryStorage } from './utils/memoryStorage'
import { createProrage } from '../lib'

const memoryStorage = createMemoryStorage()

describe('objects tests', () => {
  const { storage } = createProrage({
    storage: memoryStorage,
  })

  it('basic object', () => {
    const value = { foo: 'bar' }
    storage.object = value
    expect(memoryStorage.getItem('object')).toBe(JSON.stringify(value))
  })

  it('array', () => {
    const value = [1, 2, 3]
    storage.array = value
    expect(memoryStorage.getItem('array')).toBe(JSON.stringify(value))
  })

  it('function', () => {
    storage.function = () => {} // will be undefined
    expect(memoryStorage.getItem('function')).toBe(null)
  })

  it('class', () => {
    class Test {
      foo = 'bar'
    }
    storage.class = new Test()
    expect(memoryStorage.getItem('class')).toBe(JSON.stringify(new Test()))
  })

  it('Map', async () => {
    const value = new Map()
    value.set('foo', 'bar')
    storage.map = value
    expect(memoryStorage.getItem('map')).toBe('{}')
  })

  it('Set', () => {
    const value = new Set()
    value.add('foo')
    storage.set = value
    expect(memoryStorage.getItem('set')).toBe('{}')
  })

  it('Date', () => {
    const value = new Date()
    storage.date = value
    expect(memoryStorage.getItem('date')).toBe(JSON.stringify(value))
  })

  it('RegExp', () => {
    const value = /foo/
    storage.regexp = value
    expect(memoryStorage.getItem('regexp')).toBe(JSON.stringify(value))
  })
})

describe('key tests', () => {
  const { storage } = createProrage({
    storage: memoryStorage,
  })

  it('number', () => {
    storage[1] = { 0: 'number' }
    expect(memoryStorage.getItem('1')).toBe(JSON.stringify({ 0: 'number' }))
  })

  it('symbol', async () => {
    // set symbol as key in root node will throw error
    const fn = async () => (storage[Symbol() as unknown as string] = 'symbol')
    await expect(fn()).rejects.toBeTruthy()

    // else will be ignored
    storage.symbol = {
      [Symbol()]: 'symbol',
    }
    expect(memoryStorage.getItem('symbol')).toBe('{}')
  })
})

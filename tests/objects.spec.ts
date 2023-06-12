import { describe, it, expect, beforeEach } from 'vitest'
import { createStorage } from '../lib'

describe('object', () => {
  let storage: any
  beforeEach(() => {
    storage = createStorage({
      saveFlush: 'sync',
    })
  })

  it('object', () => {
    const value = { foo: 'bar' }
    storage.object = value
    expect(localStorage.getItem('object')).toBe(JSON.stringify(value))
  })

  it('array', () => {
    const value = [1, 2, 3]
    storage.array = value
    expect(localStorage.getItem('array')).toBe(JSON.stringify(value))
  })

  it('function', () => {
    storage.function = () => {} // will be undefined
    expect(localStorage.getItem('function')).toBe(null)
  })

  it('class', () => {
    class Test {
      foo = 'bar'
    }
    storage.class = new Test()
    expect(localStorage.getItem('class')).toBe(JSON.stringify(new Test()))
  })

  it('Map', async () => {
    const value = new Map()
    value.set('foo', 'bar')
    storage.map = value
    expect(localStorage.getItem('map')).toBe('{}')
  })

  it('Set', () => {
    const value = new Set()
    value.add('foo')
    storage.set = value
    expect(localStorage.getItem('set')).toBe('{}')
  })

  it('Date', () => {
    const value = new Date()
    storage.date = value
    expect(localStorage.getItem('date')).toBe(JSON.stringify(value))
  })

  it('RegExp', () => {
    const value = /foo/
    storage.regexp = value
    expect(localStorage.getItem('regexp')).toBe(JSON.stringify(value))
  })

  it('key tests: number', () => {
    const value = { 0: 'number' }
    storage.numberKey = value
    expect(localStorage.getItem('numberKey')).toBe(JSON.stringify(value))
  })

  it('key tests: symbol', async () => {
    // will be ignored
    storage.symbol = {
      [Symbol()]: 'symbol',
    }
    expect(localStorage.getItem('symbol')).toBe('{}')
  })

  it('free object', () => {
    storage.free = { test: 1 }
    const free = storage.free
    free.test = 2
    expect(storage.free.test).toBe(2)

    storage.reload('free')
    expect(storage.free.test).toBe(2)

    free.test = 3
    expect(storage.free.test).toBe(2)
  })
})

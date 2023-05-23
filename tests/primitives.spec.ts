import { describe, it, expect } from 'vitest'
import { createProrage } from '../lib'

describe('primitives tests', () => {
  const { storage } = createProrage()

  it('boolean', () => {
    storage.boolean = true
    expect(localStorage.getItem('boolean')).toBe(JSON.stringify(true))
  })

  it('null', () => {
    storage.null = null
    expect(localStorage.getItem('null')).toBe(JSON.stringify(null))
  })

  it('undefined', () => {
    // undefined will be removeItem
    storage.undefined = undefined
    expect(localStorage.getItem('undefined')).toBe(null)
  })

  it('number', () => {
    storage.number = 3.1415926
    expect(localStorage.getItem('number')).toBe(JSON.stringify(3.1415926))

    // stringify(NaN) will be 'null'
    storage.NaN = NaN
    expect(localStorage.getItem('NaN')).toBe(JSON.stringify(NaN))

    // stringify(Infinity) will be 'null'
    storage.Infinity = Infinity
    expect(localStorage.getItem('Infinity')).toBe(JSON.stringify(Infinity))
  })

  it('bigint', async () => {
    const fn = async () => (storage.bigint = 42n)
    await expect(fn()).rejects.toBeTruthy()
  })

  it('string', () => {
    storage.string = 'hello world'
    expect(localStorage.getItem('string')).toBe(JSON.stringify('hello world'))
  })

  it('symbol', () => {
    storage.symbol = Symbol() // will be undefined
    console.log('wtf?', localStorage.getItem('symbol'))
    expect(localStorage.getItem('symbol')).toBe(null)
  })

  it('symbol as key', async () => {
    const fn = async () => (storage[Symbol() as unknown as string] = 'symbol')
    await expect(fn()).rejects.toBeTruthy()
  })
})

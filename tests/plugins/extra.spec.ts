import { describe, it, expect, beforeEach } from 'vitest'
import {
  createStorage,
  getActiveExtra,
  setActiveExtra,
  deleteActiveExtra,
} from '../../lib'
import { PRIMARY_KEY, getExtra } from '../../lib/plugins/extra'

describe('extra plugin', () => {
  let storage: any
  beforeEach(() => {
    storage = createStorage({
      saveFlush: 'sync',
    })
  })

  it('activeExtra', () => {
    setActiveExtra('test', 1)
    expect(getActiveExtra('test')).toBe(1)
    deleteActiveExtra('test')
    expect(getActiveExtra('test')).toBe(undefined)
  })

  it('set', () => {
    setActiveExtra('test', 1)
    storage.foo = 'bar'
    expect(JSON.parse(localStorage.getItem('foo')!)).toEqual({
      value: 'bar',
      [PRIMARY_KEY]: {
        test: 1,
      },
    })
  })

  it('getExtra', () => {
    expect(getExtra(storage, 'foo')).toEqual({
      test: 1,
    })
  })

  it('overwrite', () => {
    expect(getExtra(storage, 'foo')).toStrictEqual({
      test: 1,
    })

    setActiveExtra('overwrite', 2)
    storage.foo = 'bar'
    expect(getExtra(storage, 'foo')).toStrictEqual({
      overwrite: 2,
    })

    storage.foo = 'bar'
    expect(getExtra(storage, 'foo')).toStrictEqual({})
  })
})

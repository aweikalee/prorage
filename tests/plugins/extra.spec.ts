import { describe, it, expect, beforeEach } from 'vitest'
import { createStorage, useExtra, getExtra } from '../../lib'
import { PRIMARY_KEY } from '../../lib/plugins/extra'

describe('extra plugin', () => {
  let storage: any
  beforeEach(() => {
    storage = createStorage({
      saveFlush: 'sync',
    })
  })

  it('useExtra', () => {
    expect(
      useExtra('', {
        test: 1,
      })
    ).toEqual({
      value: '',
      [PRIMARY_KEY]: {
        test: 1,
      },
    })

    expect(
      useExtra(
        useExtra('', {
          test: 1,
        }),
        {
          test2: 2,
        }
      )
    ).toEqual({
      value: '',
      [PRIMARY_KEY]: {
        test: 1,
        test2: 2,
      },
    })
  })

  it('set', () => {
    storage.foo = useExtra('bar', {
      test: 1,
    })
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

    storage.foo = useExtra('bar', {
      overwrite: 2,
    })
    expect(getExtra(storage, 'foo')).toStrictEqual({
      overwrite: 2,
    })

    storage.foo = 'bar'
    expect(getExtra(storage, 'foo')).toStrictEqual({})
  })
})

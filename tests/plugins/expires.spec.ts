import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  ExpiresDate,
  createStorage,
  expiresPlugin,
  useExpires,
} from '../../lib'
import { PRIMARY_KEY } from '../../lib/plugins/expires/plugin'
import { PRIMARY_KEY as EXTRA_PRIMARY_KEY } from '../../lib/plugins/extra'
import { wait } from '../utils/wait'

describe('expires plugin', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2023, 6, 10))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const storage = createStorage({
    saveFlush: 'sync',
    plugins: [expiresPlugin()],
  })

  it('setExpires', () => {
    const tests: {
      value: ExpiresDate
      target: number
    }[] = [
      {
        value: 1000,
        target: 1000,
      },
      {
        value: new Date(2023, 6, 10),
        target: new Date(2023, 6, 10).getTime(),
      },
      {
        value: {
          seconds: 1,
          minutes: 2,
          hours: 3,
          days: 4,
          months: 5,
          years: 6,
        },
        target: new Date(2029, 11, 14, 3, 2, 1).getTime(),
      },
    ]

    tests.forEach(({ value, target }) => {
      expect(useExpires('', value)).toEqual({
        value: '',
        [EXTRA_PRIMARY_KEY]: {
          [PRIMARY_KEY]: target,
        },
      })
    })

    vi.setSystemTime(new Date(2023, 12, 31, 23, 59, 59))
    expect(
      useExpires('', {
        seconds: 1,
      })
    ).toEqual({
      value: '',
      [EXTRA_PRIMARY_KEY]: {
        [PRIMARY_KEY]: new Date(2024, 1, 1, 0, 0, 0).getTime(),
      },
    })
  })

  it('set', () => {
    storage.value = useExpires('bar', {
      days: 1,
    })

    expect(JSON.parse(localStorage.getItem('value')!)).toEqual({
      value: 'bar',
      [EXTRA_PRIMARY_KEY]: {
        [PRIMARY_KEY]: Date.now() + 24 * 60 * 60 * 1000,
      },
    })
  })

  it('get', () => {
    expect(storage.value).toBe('bar')
    wait(24 * 60 * 60 * 1000 * 2)
    expect(storage.value).toBe(undefined)
  })
})

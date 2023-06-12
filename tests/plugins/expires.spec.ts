import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  createStorage,
  expiresPlugin,
  getActiveExtra,
  setExpires,
} from '../../lib'
import { PRIMARY_KEY } from '../../lib/plugins/expires/plugin'
import { PRIMARY_KEY as EXTRA_PRIMARY_KEY } from '../../lib/plugins/extra'
import { wait } from '../utils/wait'

const getExpires = () => getActiveExtra(PRIMARY_KEY)

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
    setExpires(1000)
    expect(getExpires()).toBe(1000)

    setExpires(0)
    expect(getExpires()).toBe(undefined)

    setExpires(new Date(2023, 6, 10))
    expect(getExpires()).toBe(new Date(2023, 6, 10).getTime())

    setExpires()
    expect(getExpires()).toBe(undefined)

    setExpires({
      seconds: 1,
      minutes: 2,
      hours: 3,
      days: 4,
      months: 5,
      years: 6,
    })
    expect(getExpires()).toBe(new Date(2029, 11, 14, 3, 2, 1).getTime())

    vi.setSystemTime(new Date(2023, 12, 31, 23, 59, 59))
    setExpires({
      seconds: 1,
    })
    expect(getExpires()).toBe(new Date(2024, 1, 1, 0, 0, 0).getTime())
  })

  it('set', () => {
    setExpires({ days: 1 })
    storage.value = 'bar'

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

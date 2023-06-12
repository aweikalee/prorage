import { describe, it, expect, beforeEach } from 'vitest'
import { createNamespace } from '../lib'

describe('plugin', () => {
  let test: any
  beforeEach(() => {
    test = createNamespace('test', {
      saveFlush: 'sync',
    })
  })

  it('write', () => {
    test.value = 'bar'
    expect(localStorage.getItem('test')).toBe(JSON.stringify('bar'))
  })

  it('read', () => {
    expect(test.value).toBe('bar')
  })

  it('delete', () => {
    test.value = undefined
    expect(localStorage.getItem('test')).toBe(null)
    expect(test.value).toBe(undefined)
  })
})

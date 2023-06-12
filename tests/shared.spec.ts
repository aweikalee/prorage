import { describe, it, expect, beforeEach } from 'vitest'
import {
  createNamespace,
  createStorage,
  isNamespace,
  isStorage,
  toProrageRaw,
} from '../lib'
import { isReactive } from '@vue/reactivity'

describe('shared', () => {
  const storage = createStorage()
  const namespace = createNamespace('test')
  const object = {}

  it('isNamespace', () => {
    expect(isNamespace(object)).toBe(false)
    expect(isNamespace(storage)).toBe(false)
    expect(isNamespace(namespace)).toBe(true)
  })

  it('isStorage', () => {
    expect(isStorage(object)).toBe(false)
    expect(isStorage(namespace)).toBe(false)
    expect(isStorage(storage)).toBe(true)
  })

  it('toProrageRaw', () => {
    expect(toProrageRaw(object)).toBe(object)
    expect(toProrageRaw(namespace)).not.toBe(namespace)
    expect(isReactive(toProrageRaw(namespace))).toBe(true)
    expect(toProrageRaw(storage)).not.toBe(storage)
    expect(isReactive(toProrageRaw(storage))).toBe(true)
  })
})

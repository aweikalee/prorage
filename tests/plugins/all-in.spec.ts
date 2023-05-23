import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createProrage,
  createExpiresPlugin,
  objectsPlugin,
  primitivesPlugin,
  Options,
} from '../../lib'
import { wait } from '../utils/wait'

const test = {
  bigint: () => 42n,
  date: () => new Date('2023-05-20T00:00:00.000Z'),
  regexp: () => /test/gi,
}

describe('plugins all in', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2023, 5, 23))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('expires, primitives, objects', () => {
    const { useExpires, plugin: expiresPlugin } = createExpiresPlugin({
      multiplier: 1,
    })

    const options: Options = {
      plugins: [expiresPlugin, primitivesPlugin(), objectsPlugin()],
    }

    const { storage: writer } = createProrage(options)

    const { storage: reader } = createProrage(options)

    const target = {
      bigint: test.bigint(),
      expires: {
        regexp: 1,
        test: 1,
      },
      date: test.date(),
    }

    it('write and reader', () => {
      writer.test = target
      useExpires(100, () => (writer.test.expires.regexp = test.regexp()))

      expect(reader.test.bigint).toStrictEqual(test.bigint())
      expect(reader.test.expires.regexp).toStrictEqual(test.regexp())
      expect(reader.test.date).toStrictEqual(test.date())

      wait(100)
      expect(reader.test.expires.regexp).toBeUndefined()
      expect(reader.test.expires.test).toBe(1)
    })
  })

  describe('expires, primitives, objects', () => {
    const { useExpires, plugin: expiresPlugin } = createExpiresPlugin({
      multiplier: 1,
    })

    const options: Options = {
      plugins: [objectsPlugin(), primitivesPlugin(), expiresPlugin],
    }

    const { storage: writer } = createProrage(options)

    const { storage: reader } = createProrage(options)

    const target = {
      bigint: test.bigint(),
      expires: {
        regexp: 1,
        test: 1,
      },
      date: test.date(),
    }

    it('write and reader', () => {
      writer.test = target
      useExpires(100, () => (writer.test.expires.regexp = test.regexp()))

      expect(reader.test.bigint).toStrictEqual(test.bigint())
      expect(reader.test.expires.regexp).toStrictEqual(test.regexp())
      expect(reader.test.date).toStrictEqual(test.date())

      wait(100)
      expect(reader.test.expires.regexp).toBeUndefined()
      expect(reader.test.expires.test).toBe(1)
    })
  })
})

import { describe, it, expect } from 'vitest'
import { createMemoryStorage } from '../utils/memoryStorage'
import {
  createProrage,
  createExpiresPlugin,
  objectsPlugin,
  primitivesPlugin,
  Options,
} from '../../lib'
import { wait } from '../utils/wait'

const memoryStorage = createMemoryStorage()

const test = {
  bigint: () => 42n,
  date: () => new Date('2023-05-20T00:00:00.000Z'),
  regexp: () => /test/gi,
}

describe('expires, primitives, objects', () => {
  const { useExpires, plugin: expiresPlugin } = createExpiresPlugin({
    multiplier: 1,
  })

  const options: Options = {
    storage: memoryStorage,
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

  it('write and reader', async () => {
    writer.test = target
    useExpires(100, () => (writer.test.expires.regexp = test.regexp()))

    expect(reader.test.bigint).toStrictEqual(test.bigint())
    expect(reader.test.expires.regexp).toStrictEqual(test.regexp())
    expect(reader.test.date).toStrictEqual(test.date())

    await wait(101)
    expect(reader.test.expires.regexp).toBeUndefined()
    expect(reader.test.expires.test).toBe(1)
  })
})

describe('expires, primitives, objects', () => {
  const { useExpires, plugin: expiresPlugin } = createExpiresPlugin({
    multiplier: 1,
  })

  const options: Options = {
    storage: memoryStorage,
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

  it('write and reader', async () => {
    writer.test = target
    useExpires(100, () => (writer.test.expires.regexp = test.regexp()))

    expect(reader.test.bigint).toStrictEqual(test.bigint())
    expect(reader.test.expires.regexp).toStrictEqual(test.regexp())
    expect(reader.test.date).toStrictEqual(test.date())

    await wait(101)
    expect(reader.test.expires.regexp).toBeUndefined()
    expect(reader.test.expires.test).toBe(1)
  })
})

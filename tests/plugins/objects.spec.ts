import { describe, it, expect } from 'vitest'
import { createMemoryStorage } from '../utils/memoryStorage'
import { createProrage, objectsPlugin, primaryKeys } from '../../lib'

const memoryStorage = createMemoryStorage()

const test = {
  date: () => new Date('2023-05-20T00:00:00.000Z'),
  regexp: () => /test/gi,
  fn: () => () => {},
}

describe('basic', () => {
  const { storage: writer } = createProrage({
    storage: memoryStorage,
    plugins: [objectsPlugin()],
  })

  const { storage: reader } = createProrage({
    storage: memoryStorage,
    plugins: [objectsPlugin()],
  })

  it('Date', () => {
    writer.date = test.date()
    expect(JSON.parse(memoryStorage.getItem('date')!)).toStrictEqual({
      [primaryKeys.objects]: 'Date',
      value: test.date().toISOString(),
    })

    expect(reader.date).toBeInstanceOf(Date)
    expect(reader.date).toEqual(test.date())
  })

  it('RegExp', () => {
    writer.regexp = test.regexp()
    expect(JSON.parse(memoryStorage.getItem('regexp')!)).toStrictEqual({
      [primaryKeys.objects]: 'RegExp',
      value: {
        source: test.regexp().source,
        flags: test.regexp().flags,
      },
    })

    expect(reader.regexp).toBeInstanceOf(RegExp)
    expect(reader.regexp).toEqual(test.regexp())
  })
})

describe('options - primaryKey', () => {
  const primaryKey = 'test'
  const plugin = objectsPlugin({ primaryKey })

  const { storage: writer } = createProrage({
    storage: memoryStorage,
    plugins: [plugin],
  })

  const { storage: reader } = createProrage({
    storage: memoryStorage,
    plugins: [plugin],
  })

  it('primaryKey', () => {
    writer.date = test.date()
    expect(JSON.parse(memoryStorage.getItem('date')!)).toStrictEqual({
      [primaryKey]: 'Date',
      value: test.date().toISOString(),
    })

    expect(reader.date).toBeInstanceOf(Date)
    expect(reader.date).toEqual(test.date())
  })
})

describe('options - adapter', () => {
  const plugin = objectsPlugin({
    adapter: {
      Function: {
        writer: (value: Function) => value.toString(),
        reader: (value): Function => new Function(`return ${value}`)(),
      },
      Date: {
        writer: (value: Date) => value.getTime(),
        reader: (value): Date => new Date(value),
      },
    },
  })

  const { storage: writer } = createProrage({
    storage: memoryStorage,
    plugins: [plugin],
  })

  const { storage: reader } = createProrage({
    storage: memoryStorage,
    plugins: [plugin],
  })

  it('add', () => {
    writer.add = test.fn()
    expect(JSON.parse(memoryStorage.getItem('add')!)).toStrictEqual({
      [primaryKeys.objects]: 'Function',
      value: test.fn().toString(),
    })

    expect(reader.add).toBeInstanceOf(Function)
    expect(reader.add.toString()).toEqual(test.fn().toString())
  })

  it('replace', () => {
    writer.replace = test.date()
    expect(JSON.parse(memoryStorage.getItem('replace')!)).toStrictEqual({
      [primaryKeys.objects]: 'Date',
      value: test.date().getTime(),
    })

    expect(reader.replace).toBeInstanceOf(Date)
    expect(reader.replace).toEqual(test.date())
  })

  it('default', () => {
    writer.default = test.regexp()
    expect(JSON.parse(memoryStorage.getItem('default')!)).toStrictEqual({
      [primaryKeys.objects]: 'RegExp',
      value: {
        source: test.regexp().source,
        flags: test.regexp().flags,
      },
    })

    expect(reader.default).toBeInstanceOf(RegExp)
    expect(reader.default).toEqual(test.regexp())
  })
})

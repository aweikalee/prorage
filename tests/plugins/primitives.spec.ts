import { describe, it, expect } from 'vitest'
import { createProrage, primitivesPlugin, primaryKeys } from '../../lib'

const test = {
  bigint: () => 42n,
  symbol: () => Symbol.toPrimitive,
}

describe('basic', () => {
  const { storage: writer } = createProrage({
    plugins: [primitivesPlugin()],
  })

  const { storage: reader } = createProrage({
    plugins: [primitivesPlugin()],
  })

  it('bigint', () => {
    writer.bigint = test.bigint()
    expect(JSON.parse(localStorage.getItem('bigint')!)).toStrictEqual({
      [primaryKeys.primitives]: 'bigint',
      value: test.bigint().toString(),
    })

    expect(reader.bigint).toEqual(test.bigint())
  })
})

describe('options - primaryKey', () => {
  const primaryKey = 'test'
  const plugin = primitivesPlugin({ primaryKey })

  const { storage: writer } = createProrage({
    plugins: [plugin],
  })

  const { storage: reader } = createProrage({
    plugins: [plugin],
  })

  it('primaryKey', () => {
    writer.bigint = test.bigint()
    expect(JSON.parse(localStorage.getItem('bigint')!)).toStrictEqual({
      [primaryKey]: 'bigint',
      value: test.bigint().toString(),
    })

    expect(reader.bigint).toEqual(test.bigint())
  })
})

describe('options - adapter', () => {
  const plugin = primitivesPlugin({
    adapter: {
      symbol: {
        writer: (value: symbol) => value.toString(),
        reader: (value): bigint => {
          const _Symbol = (value: string | symbol) =>
            typeof value === 'symbol' ? value : Symbol(value)
          const _value = value.replace(/^Symbol\((.*)\)$/, '_Symbol($1)')

          return new Function('_Symbol', `return ${_value}`)(_Symbol)
        },
      },
    },
  })

  const { storage: writer } = createProrage({
    plugins: [plugin],
  })

  const { storage: reader } = createProrage({
    plugins: [plugin],
  })

  it('add', () => {
    writer.add = test.symbol()
    expect(JSON.parse(localStorage.getItem('add')!)).toStrictEqual({
      [primaryKeys.primitives]: 'symbol',
      value: test.symbol().toString(),
    })

    expect(reader.add.toString()).toEqual(test.symbol().toString())
  })

  it('replace', () => {
    const plugin = primitivesPlugin({
      adapter: {
        bigint: {
          writer: (value: bigint) => `${value.toString()}n`,
          reader: (value): symbol => new Function(`return ${value}`)(),
        },
      },
    })

    const { storage: writer } = createProrage({
      plugins: [plugin],
    })

    const { storage: reader } = createProrage({
      plugins: [plugin],
    })

    writer.replace = test.bigint()
    expect(JSON.parse(localStorage.getItem('replace')!)).toStrictEqual({
      [primaryKeys.primitives]: 'bigint',
      value: `${test.bigint().toString()}n`,
    })

    expect(reader.replace).toBe(test.bigint())
  })

  it('default', () => {
    writer.bigint = test.bigint()
    expect(JSON.parse(localStorage.getItem('bigint')!)).toStrictEqual({
      [primaryKeys.primitives]: 'bigint',
      value: test.bigint().toString(),
    })

    expect(reader.bigint).toEqual(test.bigint())
  })
})

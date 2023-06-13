import { describe, it, expect, beforeEach } from 'vitest'
import { createStorage, translatePlugin } from '../../lib'
import { PRIMARY_KEY } from '../../lib/plugins/translate'

describe('translate plugin', () => {
  let storage: any
  beforeEach(() => {
    storage = createStorage({
      saveFlush: 'sync',
      plugins: [translatePlugin()],
    })
  })

  const tests: {
    type: string
    value: any
    target: any
    name?: string
  }[] = [
    {
      type: 'BigInt',
      value: () => 42n,
      target: () => '42',
    },
    {
      name: 'Number: NaN',
      type: 'Number',
      value: () => NaN,
      target: () => 'NaN',
    },
    {
      name: 'Number: Infinity',
      type: 'Number',
      value: () => Infinity,
      target: () => 'Infinity',
    },
    {
      name: 'Number: -Infinity',
      type: 'Number',
      value: () => -Infinity,
      target: () => '-Infinity',
    },
    {
      type: 'Date',
      value: () => new Date('2023-05-20T00:00:00.000Z'),
      target: () => '2023-05-20T00:00:00.000Z',
    },
    {
      type: 'RegExp',
      value: () => /test/gi,
      target: () => ({
        source: 'test',
        flags: 'gi',
      }),
    },
  ]

  tests.forEach(({ type, name, value, target }) => {
    describe(name || type, () => {
      it('write', () => {
        storage[type] = value()

        expect(JSON.parse(localStorage.getItem(type)!)).toEqual({
          [PRIMARY_KEY]: type,
          value: target(),
        })
      })

      it('read', () => {
        expect(storage[type]).toEqual(value())
      })
    })
  })

  describe('options', () => {
    describe('dictionary', () => {
      let storage: any
      const plugin = translatePlugin({
        dictionary: [
          {
            name: 'Add',
            test: (v) => typeof v === 'symbol',
            stringify: (value: symbol) => value.toString(),
            parse: (value): symbol => {
              const _Symbol = (value: string) => {
                try {
                  return new Function(`return ${value}`)()
                } catch (e) {
                  return typeof value === 'symbol'
                    ? value
                    : Symbol.for(String(value))
                }
              }
              const _value = value.replace(/^Symbol\((.*)\)$/, '_Symbol("$1")')

              return new Function('_Symbol', `return ${_value}`)(_Symbol)
            },
          },
          {
            name: 'Replace',
            test: (v) => typeof v === 'bigint',
            stringify: (value: bigint) => `${value.toString()}n`,
            parse: (value): bigint => new Function(`return ${value}`)(),
          },
        ],
      })

      beforeEach(() => {
        storage = createStorage({
          saveFlush: 'sync',
          plugins: [plugin],
        })
      })

      const tests: {
        type: string
        value: any
        target: any
        name?: string
      }[] = [
        {
          name: "Add: Symbol.for('test')",
          type: 'Add',
          value: () => Symbol.for('test'),
          target: () => 'Symbol(test)',
        },
        {
          name: 'Add: Symbol.toPrimitive',
          type: 'Add',
          value: () => Symbol.toPrimitive,
          target: () => 'Symbol(Symbol.toPrimitive)',
        },
        {
          type: 'Replace',
          value: () => 42n,
          target: () => '42n',
        },
        {
          name: 'Default',
          type: 'Date',
          value: () => new Date('2023-05-20T00:00:00.000Z'),
          target: () => '2023-05-20T00:00:00.000Z',
        },
      ]

      tests.forEach(({ type, name, value, target }) => {
        describe(name || type, () => {
          it('write', () => {
            storage[type] = value()

            expect(JSON.parse(localStorage.getItem(type)!)).toEqual({
              [PRIMARY_KEY]: type,
              value: target(),
            })
          })

          it('read', () => {
            expect(storage[type]).toEqual(value())
          })
        })
      })
    })
  })
})

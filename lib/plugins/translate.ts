import { isObject } from '@vue/shared'
import { type ProragePlugin } from '../hook'

export const PRIMARY_KEY = '__p_translate'

export type TranslatePluginOptions = {
  dictionary?: TranslateDictionary[]
}

export type TranslateDictionary = {
  name: string
  test: (v: any) => boolean
  stringify: (v: any) => any
  parse: (v: any) => any
}

const defaultDictionary: TranslateDictionary[] = [
  {
    name: 'BigInt',
    test: (v) => typeof v === 'bigint',
    stringify: (v: bigint) => v.toString(),
    parse: (v: string) => BigInt(v),
  },

  {
    name: 'Number',
    test: (v) => Number.isNaN(v) || v === Infinity || v === -Infinity,
    stringify: (v: number) => {
      if (Number.isNaN(v)) return 'NaN'
      if (v === Infinity) return 'Infinity'
      if (v === -Infinity) return '-Infinity'
      return v
    },
    parse: (v: string) =>
      ({
        NaN: NaN,
        Infinity: Infinity,
        '-Infinity': -Infinity,
      }[v] ?? v),
  },

  {
    name: 'Date',
    test: (v) => v instanceof Date,
    stringify: (v: Date) => v.toISOString(),
    parse: (v: string): Date => new Date(v),
  },

  {
    name: 'RegExp',
    test: (v) => v instanceof RegExp,
    stringify: (v: RegExp) => ({ source: v.source, flags: v.flags }),
    parse: (v: { source: string; flags: string }): RegExp =>
      new RegExp(v.source, v.flags),
  },
]

export function translatePlugin(
  options: TranslatePluginOptions = {}
): ProragePlugin {
  return () => {
    const dictionary = [...(options.dictionary ?? []), ...defaultDictionary]

    return {
      stringify(key, value) {
        // JSON.stringify behavior:
        // when object has toJSON method,
        // value will be a string,
        // this[key] will is original object
        const originalValue = this[key]

        const find = dictionary.find(({ test }) => test(originalValue))
        if (!find) return value

        const { name, stringify } = find
        return { [PRIMARY_KEY]: name, value: stringify(originalValue) }
      },
      parse(_, value) {
        if (!isObject(value)) return value
        if (!(PRIMARY_KEY in value)) return value

        const name = value[PRIMARY_KEY]
        const find = dictionary.find((v) => v.name === name)
        if (!find) return value.value

        const { parse } = find
        return parse(value.value)
      },
    }
  }
}

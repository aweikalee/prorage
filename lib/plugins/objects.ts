import { ProragePlugin } from '../types'
import { rawType, isObject } from '../utils'
import * as primaryKeys from './primaryKeys'

export type ObjectAdapter = Record<
  string,
  {
    writer: (v: any) => any
    reader: (v: any) => any
  }
>

export const defaultAdapter: ObjectAdapter = {
  Date: {
    writer: (v: Date) => v.toISOString(),
    reader: (v: string): Date => new Date(v),
  },
  RegExp: {
    writer: (v: RegExp) => ({
      source: v.source,
      flags: v.flags,
    }),
    reader: (v: { source: string; flags: string }): RegExp =>
      new RegExp(v.source, v.flags),
  },
}

export function objectsPlugin(
  options: {
    primaryKey?: string
    adapter?: ObjectAdapter
  } = {}
): ProragePlugin {
  const primaryKey = options?.primaryKey ?? primaryKeys.objects
  const adapter = { ...defaultAdapter, ...options.adapter }

  return {
    writer(key, value) {
      // JSON.stringify behavior:
      // when object has toJSON method,
      // value will be a string,
      // this[key] will is original object
      const originalValue = this[key]

      if (!isObject(originalValue)) return value

      const type = rawType(originalValue)
      const writer = adapter[type]?.writer
      if (!writer) return value

      return { [primaryKey]: type, value: writer(originalValue) }
    },
    reader(_, value) {
      if (!isObject(value)) return value
      if (!(primaryKey in value)) return value

      const type = value[primaryKey]
      const reader = adapter[type]?.reader

      return reader ? reader(value.value) : value.value
    },
  }
}

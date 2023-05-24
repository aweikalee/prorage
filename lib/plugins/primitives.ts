import { ProragePlugin } from '../plugin'
import { isObject, typeOf } from '../utils'
import * as primaryKeys from './primaryKeys'

export type PrimitivesAdapter = Record<
  string,
  {
    writer: (v: any) => any
    reader: (v: any) => any
  }
>

const defaultAdapter: PrimitivesAdapter = {
  bigint: {
    writer: (v: BigInt) => v.toString(),
    reader: (v: string) => BigInt(v),
  },
}

export function primitivesPlugin(
  options: {
    primaryKey?: string
    adapter?: PrimitivesAdapter
  } = {}
): ProragePlugin {
  const primaryKey = options?.primaryKey ?? primaryKeys.primitives
  const adapter = { ...defaultAdapter, ...options.adapter }

  return {
    writer(_, value) {
      const type = typeOf(value)
      const writer = adapter[type]?.writer
      if (!writer) return value

      return { [primaryKey]: type, value: writer(value) }
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

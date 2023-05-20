import * as symbols from './symbols'
import { Replacer } from './types'

export function typeOf(argument: unknown) {
  const type = typeof argument
  if (argument === null) return 'null'
  if (type === 'function') return 'object'
  return type
}

export function isObject(val: unknown): val is Record<any, any> {
  return typeOf(val) === 'object'
}

export function isSymbol(val: unknown): val is symbol {
  return typeof val === 'symbol'
}

export function rawType(val: unknown) {
  // like "[object Object]"
  return Object.prototype.toString.call(val).slice(8, -1)
}
export function objectType(val: unknown) {
  const type = rawType(val)

  switch (type) {
    case 'Object':
    case 'Array':
      return 'common'
    case 'Map':
    case 'Set':
    case 'WeakMap':
    case 'WeakSet':
      return 'collection'
    default:
      return 'invalid'
  }
}

export function toRaw<T>(proxyed: T): T {
  const raw = proxyed && (proxyed as any)[symbols.RAW]
  return raw ? toRaw(raw) : proxyed
}

export function mergeReplacers(replacers: Replacer[]): Replacer {
  if (!replacers.length) return (_, value) => value

  return function (key, value) {
    return replacers.reduce(
      (value, replacer) => replacer.call(this, key, value),
      value
    )
  }
}

const primaryKeys = new Set()
export function createPluginPrimaryKey(name: string) {
  if (primaryKeys.has(name)) {
    throw new Error(`primaryKey "${name}" already exists`)
  } else {
    primaryKeys.add(name)
    return `#p_${name}_`
  }
}

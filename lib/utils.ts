import * as symbols from './symbols'
import { Replacer } from './types'

export function typeOf(argument: unknown) {
  const type = typeof argument
  if (argument === null) return 'null'
  if (type === 'function') return 'object'
  return type
}

export function isObject(val: unknown): val is Record<any, any> {
  return val !== null && typeof val === 'object'
}

export function isSymbol(val: unknown): val is symbol {
  return typeof val === 'symbol'
}

export function objectType(val: unknown) {
  // like "[object Object]"
  const rawType = Object.prototype.toString.call(val).slice(8, -1)

  switch (rawType) {
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

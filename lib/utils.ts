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

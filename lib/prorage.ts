import { StorageLike, Replacer, StringifyLike, ParseLike } from './types'
import {
  isObject,
  isSymbol,
  objectType,
  prefixUnwrap,
  prefixWrap,
  toRaw,
} from './utils'
import * as symbols from './symbols'
import { combinePlugins, ProragePlugin } from './plugin'
import { runContext, useContext } from './context'

export type Options = {
  storage?: StorageLike
  stringify?: StringifyLike
  parse?: ParseLike
  plugins?: ProragePlugin[]

  target?: Record<string, any>
  prefix?: string
}

export function createProrage<T = Record<string, any>>(options: Options = {}) {
  const target = options.target ?? ({} as T)
  const _storage = options.storage ?? localStorage
  const stringify = options.stringify ?? JSON.stringify
  const parse = options.parse ?? JSON.parse

  const prefix = options.prefix

  const proxyPlugin: ProragePlugin = () => ({
    setter(_, value) {
      return toRaw(value)
    },
    getter(key, value) {
      const { paths } = useContext()
      return toProxy(value, [...paths!, key])
    },
  })

  const ctx = {
    target,
    receiver: null as any,
  }
  const { writer, reader, setter, getter } = combinePlugins(ctx, [
    ...(options.plugins ?? []),
    proxyPlugin,
  ])

  const setterWalk = setterWalker(setter)

  function setItem(key: string | symbol) {
    if (isSymbol(key)) throw new Error('Symbol key is not supported')

    const value = stringify((target as any)[key], writer)
    const _key = prefixWrap(prefix, key)
    if (value === undefined) {
      _storage.removeItem(key)
    } else {
      _storage.setItem(_key, value)
    }
  }

  function getItem(key: string | symbol) {
    if (isSymbol(key)) throw new Error('Symbol key is not supported')

    const _key = prefixWrap(prefix, key)
    const text = _storage.getItem(_key) as string
    return parse(text, reader)
  }

  function toProxy(target: any, paths: (string | symbol)[]): any {
    if (!isObject(target)) return target

    // skip Map, Set, WeakMap, WeakSet
    // skip Function, Date, RegExp, Error...
    if (objectType(target) !== 'common') return target

    const isRoot = paths.length === 0

    const privates = Object.assign(
      isRoot
        ? {
            get length() {
              const keys = ownKeys()
              return keys.length
            },

            clear() {
              const keys = ownKeys()
              keys.forEach((key) => {
                const _key = prefixWrap(prefix, key)
                _storage.removeItem(_key)
                Reflect.deleteProperty(target, key)
              })
            },
          }
        : {},
      {
        [symbols.RAW]: target,
      }
    )

    function ownKeys() {
      let keys = Object.keys(_storage)

      if (prefix) {
        const _prefix = prefixWrap(prefix, '')
        const newKeys: typeof keys = []
        keys.forEach((key) => {
          if (String(key).startsWith(_prefix)) {
            newKeys.push(prefixUnwrap(prefix, key))
          }
        })
        keys = newKeys
      }

      // `Object.keys`, return value contains only the enumerable keys.
      // make it become the enumerable key, by setting the key.
      keys.forEach((key) => {
        if (!(key in target)) {
          target[key] = undefined
        }
      })

      return keys
    }

    const proxyed = new Proxy(target, {
      get(target, key, receiver) {
        if (key in privates) return privates[key as keyof typeof privates]

        let value = Reflect.get(target, key, receiver)

        if (isSymbol(key)) return value

        if (isRoot && value === undefined) {
          value = getItem(key)
          Reflect.set(target, key, value, receiver)
        }
        return runContext(() => {
          const ctx = useContext()
          ctx.paths = [...paths]
          return getter.call(target, key, value)
        })
      },

      set(target, key, newValue, receiver) {
        const res = runContext(() => {
          const ctx = useContext()
          ctx.paths = [...paths]
          return Reflect.set(target, key, setterWalk(key, newValue), receiver)
        })

        if (res) setItem(isRoot ? key : paths[0])

        return res
      },

      deleteProperty(target, key) {
        const res = Reflect.deleteProperty(target, key)

        if (res) setItem(isRoot ? key : paths[0])

        return res
      },

      ownKeys: isRoot ? ownKeys : undefined,
    })

    return proxyed
  }

  const storage = toProxy(target, []) as T & {
    readonly length: number
    clear(): void
  }
  ctx.receiver = storage

  return {
    storage,
  }
}

function setterWalker(setter: Replacer): Replacer {
  return function (key: string | symbol, value: any) {
    const temp = { [key]: value }
    const setted = new Set()

    function walk(holder: any, key: string | symbol) {
      let value = holder[key]
      if (setted.has(value)) return value
      setted.add(value)

      const ctx = useContext()
      const paths = [...ctx.paths!, key]

      return runContext(() => {
        const ctx = useContext()
        ctx.paths = paths

        if (isObject(value)) {
          for (const k in value) {
            if (Object.hasOwnProperty.call(value, k)) {
              const v = walk(value, k)

              if (v !== undefined) {
                value[k] = v
              } else {
                delete value[k]
              }
            }
          }
        }

        return setter.call(holder, key, value)
      })
    }

    return walk(temp, key)
  }
}

import {
  StorageLike,
  Getter,
  Setter,
  Writer,
  Reader,
  ProragePlugin,
  Replacer,
  StringifyLike,
  ParseLike,
} from './types'
import {
  isObject,
  isSymbol,
  mergeReplacers,
  objectType,
  prefixUnwrap,
  prefixWrap,
} from './utils'
import * as symbols from './symbols'
import { runHook, useParent, usePaths, useReceiver } from './hooks'

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

  const writers: Writer[] = []
  const readers: Reader[] = []
  const setters: Setter[] = []
  const getters: Getter[] = []

  options.plugins?.forEach(({ writer, reader, setter, getter }) => {
    if (writer) writers.push(writer)
    if (reader) readers.unshift(reader)
    if (setter) setters.push(setter)
    if (getter) getters.unshift(getter)
  })

  getters.push(function (key, value) {
    const paths = usePaths()
    const receiver = useReceiver()
    return toProxy(receiver, value, [...paths, key])
  })

  const writer = mergeReplacers(writers)
  const reader = mergeReplacers(readers)
  const setter = mergeReplacers(setters)
  const getter = mergeReplacers(getters)

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

  function toProxy(parent: any, target: any, paths: (string | symbol)[]): any {
    if (!isObject(target)) return target

    // skip Map, Set, WeakMap, WeakSet
    // skip Function, Date, RegExp, Error...
    if (objectType(target) !== 'common') return target

    const isRoot = parent === null && paths.length === 0

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
        [symbols.PATHS]: paths,
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
        if (key === symbols.PARENT) return parent
        if (key in privates) return privates[key as keyof typeof privates]

        let value = Reflect.get(target, key, receiver)

        if (isSymbol(key)) return value

        if (isRoot && value === undefined) {
          value = getItem(key)
          Reflect.set(target, key, value, receiver)
        }

        return runHook(() => getter.call(target, key, value), {
          [symbols.RECEIVER]: receiver,
          [symbols.PATHS]: paths,
          [symbols.PARENT]: parent,
        })
      },

      set(target, key, newValue, receiver) {
        const res = runHook(
          () => Reflect.set(target, key, setterWalk(key, newValue), receiver),
          {
            [symbols.RECEIVER]: receiver,
            [symbols.PATHS]: paths,
            [symbols.PARENT]: parent,
          }
        )

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

  const storage = toProxy(null, target, []) as T & {
    readonly length: number
    clear(): void
  }

  return {
    storage,
  }
}

function setterWalker(setter: Replacer): Replacer {
  return function (key: string | symbol, value: any) {
    const paths = usePaths().slice()
    const temp = { [key]: value }
    const parents = [useParent()]
    const receiver = useReceiver()
    const setted = new Set()

    const replaceTemp = (v: any) => (v === temp ? receiver : v)

    function walk(holder: any, key: string | symbol) {
      let value = holder[key]
      if (setted.has(value)) return value
      setted.add(value)

      const res = runHook(
        () => {
          if (isObject(value)) {
            parents.push(holder)
            paths.push(key)
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
            paths.pop()
            parents.pop()
          }

          return setter.call(holder, key, value)
        },
        {
          [symbols.PARENT]: replaceTemp(parents[parents.length - 1]),
          [symbols.PATHS]: paths,
          [symbols.RECEIVER]: holder === temp ? receiver : undefined,
        }
      )

      return res
    }

    return walk(temp, key)
  }
}

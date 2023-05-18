import {
  StorageLike,
  Getter,
  Setter,
  Writer,
  Reader,
  ProragePlugin,
  Replacer,
} from './types'
import { isObject, isSymbol, mergeReplacers } from './utils'
import * as symbols from './symbols'
import { runHook, useParent, usePaths, useReceiver } from './hooks'

export type Options = {
  storage?: StorageLike
  plugins?: ProragePlugin[]
}

export function createProrage<T = any>(options: Options = {}) {
  const target = {} as T
  const _storage = options.storage ?? localStorage

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

    const value = target[key as keyof T]
    if (value === undefined) {
      _storage.removeItem(key)
    } else {
      _storage.setItem(key, JSON.stringify(value, writer))
    }
  }

  function getItem(key: string | symbol) {
    if (isSymbol(key)) throw new Error('Symbol key is not supported')

    return JSON.parse(_storage.getItem(key as string) as string, reader)
  }

  function toProxy(
    parent: any,
    target: any,
    paths: (string | symbol)[] = []
  ): any {
    if (!isObject(target)) return target

    const privates = {
      [symbols.RAW]: target,
      [symbols.PATHS]: paths,
    }

    const proxyed = new Proxy(target, {
      get(target, key, receiver) {
        if (key === symbols.PARENT) return parent
        if (key in privates) return privates[key as keyof typeof privates]

        let value = Reflect.get(target, key, receiver)

        if (isSymbol(key)) return value

        if (paths.length === 0 && value === undefined) {
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

        if (res) setItem(paths.length === 0 ? key : paths[0])

        return res
      },

      deleteProperty(target, key) {
        const res = Reflect.deleteProperty(target, key)

        if (res) setItem(paths.length === 0 ? key : paths[0])

        return res
      },
    })

    return proxyed
  }

  const storage = toProxy(null, target, []) as T

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

    const replaceTemp = (v: any) => (v === temp ? receiver : v)

    function walk(holder: any, key: string | symbol) {
      let value = holder[key]

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

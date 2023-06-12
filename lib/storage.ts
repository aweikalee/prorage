import { reactive, toRaw } from '@vue/reactivity'
import { isString } from '@vue/shared'
import { createNamespace, type NamespaceOptions } from './namespace'
import { ReactiveFlags } from './vue-mock'
import { ProragePlugin } from './hook'
import { Flags, isNamespace } from './shared'

export interface StorageOptions extends NamespaceOptions {}

export function createStorage<T extends object = any>(
  options: StorageOptions = {}
) {
  const storage = options.storage ?? localStorage

  const baseStorage = {}
  const reactiveStorage = reactive(baseStorage)

  function maybeNamespace(key: string) {
    if (baseStorage.hasOwnProperty(key)) return true

    const value = storage.getItem(key)
    if (value !== null && value !== undefined) {
      return true
    }

    return false
  }

  function _createNamespace(key: string) {
    const undefinedPlugin: ProragePlugin = {
      afterStringify() {
        const namespace = Reflect.get(baseStorage, key)
        if (!namespace) return

        if (namespace.value === undefined) {
          Reflect.deleteProperty(reactiveStorage, key)
        }
      },
    }

    const namespace = createNamespace(key, {
      ...options,
      plugins: [...(options.plugins ?? []), undefinedPlugin],
    })

    return namespace
  }

  const proxy = new Proxy(reactiveStorage, {
    get(target, key, receiver): any {
      if (key === ReactiveFlags.RAW) return target
      if (key === Flags.RAW) return target
      if (key === Flags.IS_STORAGE) return true

      if (isString(key) && maybeNamespace(key)) {
        const baseStorage = toRaw(reactiveStorage)
        let namespace = Reflect.get(baseStorage, key)
        if (!namespace) {
          namespace = _createNamespace(key)
          Reflect.set(target, key, namespace)
        }
      }

      return Reflect.get(target, key, receiver)
    },

    set(reactiveStorage, key, value, receiver) {
      if (isString(key)) {
        const baseStorage = toRaw(reactiveStorage)
        let namespace = Reflect.get(baseStorage, key)
        if (!namespace) {
          namespace = _createNamespace(key)
          Reflect.set(reactiveStorage, key, namespace)
        }

        return Reflect.set(namespace, 'value', value)
      }

      return Reflect.set(reactiveStorage, key, value, receiver)
    },

    deleteProperty(reactiveStorage, key) {
      if (isString(key) && maybeNamespace(key)) {
        const baseStorage = toRaw(reactiveStorage)
        const namespace = Reflect.get(baseStorage, key)
        if (isNamespace(namespace)) {
          namespace.value = undefined
        } else {
          storage.removeItem(key)
        }
      }

      return Reflect.deleteProperty(reactiveStorage, key)
    },

    ownKeys(reactiveStorage) {
      const keys = Reflect.ownKeys(storage)

      // `Object.keys`, return value contains only the enumerable keys.
      // make it become the enumerable key, by setting the key.
      keys.forEach((key) => {
        if (!(key in reactiveStorage)) {
          Reflect.set(reactiveStorage, key, undefined)
        }
      })

      return Reflect.ownKeys(reactiveStorage)
    },
  })

  const prototype = {
    save(key: string) {
      if (!isString(key)) {
        throw new Error(`Namespace key should be string.`)
      }

      const namespace = Reflect.get(baseStorage, key)
      if (!isNamespace(namespace)) return

      namespace.save()
    },
    reload(key: string) {
      if (!isString(key)) {
        throw new Error(`Namespace key should be string.`)
      }

      const namespace = Reflect.get(baseStorage, key)
      if (!isNamespace(namespace)) return

      namespace.reload()
    },
  }
  Object.setPrototypeOf(baseStorage, prototype)

  return proxy as T & typeof prototype
}

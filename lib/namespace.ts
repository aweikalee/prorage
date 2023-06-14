import { reactive, ref } from '@vue/reactivity'
import { proxyNamespace } from './proxy'
import { createHooks, type ProragePlugin } from './hook'
import { watch } from './watch'
import { type StringifyLike, type StorageLike, type ParseLike } from './types'
import { extraPlugin } from './plugins/extra'
import { Flags, prefixWrap } from './shared'
import { arrayPlugin } from './plugins/array'

export interface NamespaceOptions {
  storage?: StorageLike
  stringify?: StringifyLike
  parse?: ParseLike
  plugins?: ProragePlugin[]
  saveFlush?: 'sync' | 'async'
  prefix?: string
}

export function createNamespace<T = any>(
  key: string,
  options: NamespaceOptions = {}
) {
  const storage = options.storage ?? localStorage
  const stringify = options.stringify ?? JSON.stringify
  const parse = options.parse ?? JSON.parse
  const saveFlush = options.saveFlush ?? 'async'
  const keyWithPrefix = prefixWrap(options.prefix, key)

  const plugins = [arrayPlugin, ...(options.plugins ?? []), extraPlugin]
  const hooks = createHooks(plugins)

  /* proxy */
  const baseState = {
    value: undefined as T,
  }

  const reactiveState = reactive(baseState)
  const state = proxyNamespace(reactiveState, hooks)

  /* load and save */
  function reload() {
    const text = storage.getItem(keyWithPrefix)

    hooks.beforeParse()

    let data
    if (text) {
      data = parse(text, hooks.parse) ?? {}
    }

    hooks.afterParse()

    try {
      stopWatch()
      reactiveState.value = data
    } finally {
      stopWatch.run()
    }
  }
  function save() {
    hooks.beforeStringify()
    const text = stringify(baseState.value, hooks.stringify)
    hooks.afterStringify()

    if (text === undefined) {
      storage.removeItem(keyWithPrefix)
    } else {
      storage.setItem(keyWithPrefix, text)
    }
  }
  function clear() {
    delete state.value
  }

  const stopWatch = watch(() => reactiveState.value, save, {
    deep: true,
    flush: saveFlush,
  })

  try {
    reload()
  } catch (error) {
    console.error(error)
  }

  const namespace = ref()
  Object.defineProperties(namespace, {
    // hack: forward value
    _value: {
      get: () => state.value,
      set: (value) => (state.value = value),
    },
    // hack, always triggerRefValue
    _rawValue: {
      get: () => Symbol(),
      set: () => {},
    },
    [Flags.RAW]: {
      get: () => reactiveState,
    },
    [Flags.IS_NAMESPACE]: {
      get: () => true,
    },
  })

  /* prototype */
  const prototype = {
    reload,
    save,
    clear,
  }
  Object.setPrototypeOf(prototype, Object.getPrototypeOf(namespace))
  Object.setPrototypeOf(namespace, prototype)

  return namespace as typeof namespace & typeof prototype
}

import { reactive, ref } from '@vue/reactivity'
import { proxyNamespace } from './proxy'
import { createHooks, type ProragePlugin } from './hook'
import { invalidateJob, queueJob, watch } from './watch'
import { type StorageLike } from './types'
import { extraPlugin } from './plugins/extra'
import { Flags } from './shared'

export interface NamespaceOptions {
  storage?: StorageLike
  plugins?: ProragePlugin[]
  saveFlush?: 'sync' | 'async'
}

export function createNamespace<T = any>(
  key: string,
  options: NamespaceOptions = {}
) {
  const storage = options.storage ?? localStorage
  const saveFlush = options.saveFlush ?? 'async'

  const plugins = [...(options.plugins ?? []), extraPlugin]
  const hooks = createHooks(plugins)

  /* proxy */
  const baseState = {
    value: undefined as T,
  }

  const reactiveState = reactive(baseState)
  const state = proxyNamespace(reactiveState, hooks)

  /* load and save */
  let isReloading = false
  function reload() {
    invalidateJob(save)
    const text = storage.getItem(key)

    hooks.beforeParse()

    let data
    if (text) {
      data = JSON.parse(text, hooks.parse) ?? {}
    }

    hooks.afterParse()

    try {
      isReloading = true
      reactiveState.value = data
    } finally {
      isReloading = false
    }
  }
  function save() {
    hooks.beforeStringify()
    const text = JSON.stringify(baseState.value, hooks.stringify)
    hooks.afterStringify()

    if (text === undefined) {
      storage.removeItem(key)
    } else {
      storage.setItem(key, text)
    }
  }
  function clear() {
    delete state.value
  }

  watch(
    () => reactiveState.value,
    () => {
      if (isReloading) return
      if (saveFlush === 'async') {
        queueJob(save)
      } else {
        save()
      }
    },
    {
      deep: true,
    }
  )

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

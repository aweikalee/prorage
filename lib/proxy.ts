import { isObject, toRawType } from '@vue/shared'
import { ReactiveFlags, TargetType, targetTypeMap } from './vue-mock'
import { createHooks } from './hook'
import { Flags } from './shared'

const proxyMap = new WeakMap()

export function proxyNamespace(
  target: unknown,
  hooks: ReturnType<typeof createHooks>
) {
  if (!isObject(target)) return target
  if (targetTypeMap(toRawType(target)) !== TargetType.COMMON) return target

  const existingProxy = proxyMap.get(target)
  if (existingProxy) return existingProxy

  const proxy = new Proxy(target, {
    get(target, key, receiver): any {
      if (key === ReactiveFlags.RAW) return target
      if (key === Flags.RAW) return target

      const value = Reflect.get(target, key, receiver)
      const newValue = hooks.get(target, key, value, receiver)

      return proxyNamespace(newValue, hooks)
    },

    set(target, key, value, receiver) {
      const newValue = hooks.set(target, key, value, receiver)
      return Reflect.set(target, key, newValue, receiver)
    },

    deleteProperty(target, key) {
      const result = hooks.deleteProperty(target, key)
      if (result === true || result === false) return result
      return Reflect.deleteProperty(target, key)
    },
  })

  proxyMap.set(target, proxy)
  return proxy
}

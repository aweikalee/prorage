import { isObject } from '@vue/shared'
import { toRaw } from '@vue/reactivity'
import { type ProragePlugin } from '../hook'
import { isStorage, toProrageRaw } from '../shared'

export const PRIMARY_KEY = '__p_extra'

let activeExtra: Record<string, unknown> = {}
export function setActiveExtra(key: string, value: unknown) {
  activeExtra[key] = value
}
export function deleteActiveExtra(key: string) {
  delete activeExtra[key]
}
export function getActiveExtra(key: string) {
  return activeExtra[key]
}
function clearActiveExtra() {
  activeExtra = {}
}

export function getExtra(target: object, key: string | symbol) {
  if (isStorage(target)) {
    Reflect.get(target, key) // triiger get
    target = Reflect.get(toRaw(target), key)
    key = 'value'
  }

  const raw = toRaw(toProrageRaw(target)) as any
  const value = raw[key]

  if (isObject(value)) {
    const extra = value[PRIMARY_KEY]

    if (extra && isObject(extra)) {
      return extra
    }
  }

  return {}
}

export const extraPlugin: ProragePlugin = {
  get(_, __, value) {
    if (isObject(value)) {
      const extra = value[PRIMARY_KEY]

      if (extra && isObject(extra)) {
        return value.value
      }
    }

    return value
  },

  set(_, __, value) {
    if (activeExtra && Object.keys(activeExtra).length) {
      value = {
        [PRIMARY_KEY]: activeExtra,
        value,
      }
    }

    clearActiveExtra()
    return value
  },
}

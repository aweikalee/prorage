import { isObject } from '@vue/shared'
import { toRaw } from '@vue/reactivity'
import { type ProragePlugin } from '../hook'
import { isStorage, toProrageRaw } from '../shared'

export const PRIMARY_KEY = '__p_extra'

export function useExtra<T>(value: T, extra: Record<string, unknown> = {}): T {
  if (isObject(value) && PRIMARY_KEY in value) {
    return {
      [PRIMARY_KEY]: {
        ...value[PRIMARY_KEY],
        ...extra,
      },
      value: value.value,
    } as T
  } else {
    return {
      [PRIMARY_KEY]: extra,
      value,
    } as T
  }
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
}

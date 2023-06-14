/**
 * Array operations will move the data
 * When moving, "get" and "set" will be called
 * bug, "get" will get proxy data
 * here, expected to get the original data
 */

import { hasOwn, isArray, isIntegerKey } from '@vue/shared'
import { toProrageRaw } from '../shared'
import { type ProragePlugin } from '../hook'

let calling = false
const arrayInstrumentations = createArrayInstrumentations()
function createArrayInstrumentations() {
  const instrumentations: Record<string, Function> = {}

  ;(['push', 'pop', 'shift', 'unshift', 'splice'] as const).forEach((key) => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      calling = true
      const res = (toProrageRaw(this) as any)[key].apply(this, args)
      calling = false
      return res
    }
  })

  return instrumentations
}

export const arrayPlugin: ProragePlugin = {
  get(target, key, value, receiver) {
    if (isArray(target) && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver)
    }

    if (calling && isIntegerKey(key)) {
      return Reflect.get(target, key)
    }

    return value
  },
}

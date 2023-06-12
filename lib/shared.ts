import { isObject } from '@vue/shared'

export enum Flags {
  RAW = '__p_raw',
  IS_NAMESPACE = '__p_isNamespace',
  IS_STORAGE = '__p_isStorage',
}

export function isNamespace(val: unknown) {
  return isObject(val) && val[Flags.IS_NAMESPACE] === true
}

export function isStorage(val: unknown) {
  return isObject(val) && val[Flags.IS_STORAGE] === true
}

export function toProrageRaw<T>(observed: T): T {
  const raw = observed && (observed as any)[Flags.RAW]
  return raw ? toProrageRaw(raw) : observed
}

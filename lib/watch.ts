import { EffectScheduler, isRef, ReactiveEffect } from '@vue/reactivity'
import { isArray, isObject, isMap, isPlainObject, isSet } from '@vue/shared'

export type WatchSource<T = any> = () => T
export type WatchEffect = (onCleanup: OnCleanup) => any
export type WatchCallback = () => any
export interface WatchOptions<Immediate = boolean> {
  flush?: 'async' | 'sync'
  immediate?: Immediate
  deep?: boolean
}

type OnCleanup = (cleanupFn: () => void) => void

let queue: Function[] = []
export function queueJob(job: Function) {
  if (!queue.length || !queue.includes(job)) {
    queue.push(job)
    queueFlush()
  }
}
export function invalidateJob(job: Function) {
  const i = queue.indexOf(job)
  if (~i) {
    queue.splice(i, 1)
  }
}

const resolvedPromise = Promise.resolve() as Promise<any>
let currentFlushPromise: Promise<void> | null = null
function queueFlush() {
  if (currentFlushPromise) return
  currentFlushPromise = resolvedPromise.then(flushJobs)
}

function flushJobs() {
  currentFlushPromise = null
  while (queue.length) {
    const job = queue.shift()!
    job()
  }
}

export function watchEffect(effect: WatchEffect, options: WatchOptions = {}) {
  return doWatch(effect, null, options)
}

export function watch<T = any>(
  source: WatchSource<T>,
  cb: WatchCallback,
  options: WatchOptions = {}
) {
  return doWatch(source as any, cb, options)
}

function doWatch(
  source: WatchEffect,
  cb: WatchCallback | null,
  { flush, deep, immediate }: WatchOptions
) {
  const job = () => {
    if (cb) {
      effect.run()
      cb()
    } else {
      effect.run()
    }
  }

  let scheduler: EffectScheduler = job
  if (flush === 'async') {
    scheduler = () => queueJob(job)
  }

  let cleanup: Function
  const onCleanup = (fn: () => void) => {
    cleanup = effect.onStop = () => {
      fn()
    }
  }

  let getter: () => any
  if (cb) {
    getter = () => source(onCleanup)
  } else {
    getter = () => {
      if (cleanup) {
        cleanup()
      }
      return source(onCleanup)
    }
  }

  if (cb && deep) {
    const baseGetter = getter
    getter = () => traverse(baseGetter())
  }

  const effect = new ReactiveEffect(getter, scheduler)

  if (cb) {
    if (immediate) {
      job()
    } else {
      effect.run()
    }
  } else {
    effect.run()
  }

  const unwatch = () => {
    invalidateJob(job)
    effect.stop()
  }
  const prototype = {
    run() {
      effect.active = true
      effect.run()
    },
  }
  Object.setPrototypeOf(prototype, Object.getPrototypeOf(unwatch))
  Object.setPrototypeOf(unwatch, prototype)

  return unwatch as typeof unwatch & typeof prototype
}

function traverse(value: any, seen?: Set<unknown>) {
  if (!isObject(value)) {
    return value
  }
  seen = seen || new Set()
  if (seen.has(value)) {
    return value
  }
  seen.add(value)
  if (isRef(value)) {
    traverse(value.value, seen)
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen)
    }
  } else if (isSet(value) || isMap(value)) {
    value.forEach((v: any) => {
      traverse(v, seen)
    })
  } else if (isPlainObject(value)) {
    for (const k in value) {
      traverse((value as any)[k], seen)
    }
  }
  return value
}

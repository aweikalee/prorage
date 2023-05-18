import * as symbols from './symbols'

export type HookData = {
  [symbols.PARENT]: any
  [symbols.PATHS]: (string | symbol)[]
  [symbols.RECEIVER]?: any
}

const activeHooks: any[] = []

function startHook(data: HookData) {
  activeHooks.push(data)
}
function finishHook() {
  activeHooks.pop()
}
export function runHook(fn: Function, data: HookData) {
  try {
    startHook(data)
    return fn()
  } catch (error) {
    throw error
  } finally {
    finishHook()
  }
}

export function useReceiver(): HookData[typeof symbols.RECEIVER] {
  return activeHooks[activeHooks.length - 1]?.[symbols.RECEIVER]
}

export function useParent(): HookData[typeof symbols.PARENT] {
  return activeHooks[activeHooks.length - 1]?.[symbols.PARENT]
}

export function usePaths(): HookData[typeof symbols.PATHS] {
  return activeHooks[activeHooks.length - 1]?.[symbols.PATHS]
}

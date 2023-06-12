import { vi } from 'vitest'

export function wait(time: number) {
  setTimeout(() => {}, time)
  vi.runAllTimers()
}

export function nextTick() {
  return Promise.resolve()
}

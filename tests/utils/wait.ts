import { vi } from 'vitest'

export function wait(time: number) {
  setTimeout(() => {}, time)
  vi.runAllTimers()
}

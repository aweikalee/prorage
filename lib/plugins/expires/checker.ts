import { toRaw } from '@vue/reactivity'
import { isArray, isIntegerKey } from '@vue/shared'

export type ExpiresInterval = 'none' | 'raf' | number

const arrayTraverseKey = Symbol.for('__p_array')

export class ExpiresChecker {
  map = new Map<object, Map<string | symbol, () => any>>()
  private timer: ReturnType<typeof setTimeout> | null = null
  private rafTimer: number | null = null

  constructor(private interval: ExpiresInterval) {}

  set(receiver: object, key: string | symbol) {
    if (this.interval === 'none') return
    const raw = toRaw(receiver)
    let map = this.map.get(raw)
    if (!map) this.map.set(raw, (map = new Map()))

    if (isArray(receiver) && isIntegerKey(key)) {
      map.set(arrayTraverseKey, () => {
        receiver.forEach(() => {})
      })
    } else {
      map.set(key, () => {
        Reflect.get(receiver, key)
      })
    }

    this.raf()
  }

  delete(receiver: object, key: string | symbol) {
    const raw = toRaw(receiver)
    const map = this.map.get(raw)

    if (map) {
      map.delete(key)
      if (map.size === 0) this.map.delete(raw)
    }
  }

  clear() {
    this.map.clear()
  }

  raf() {
    if (typeof this.interval === 'number') {
      if (this.timer) clearTimeout(this.timer)
      this.timer = setTimeout(() => this.check(), this.interval)
    } else if (this.interval === 'raf') {
      if (this.rafTimer) cancelAnimationFrame(this.rafTimer)
      this.rafTimer = requestAnimationFrame(() => this.check())
    }
  }

  check() {
    const list = [...this.map.values()]
    this.map.clear()
    while (list.length) {
      list.shift()!.forEach((fn) => fn())
    }
  }
}

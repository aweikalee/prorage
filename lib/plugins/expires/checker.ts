import { toRaw } from '@vue/reactivity'
import { isIntegerKey } from '@vue/shared'
import { Heap } from './heap'

export type ExpiresInterval = 'none' | 'raf' | number

const arrayTraverseKey = Symbol.for('__p_array')
const promise = Promise.resolve()

export class ExpiresChecker extends Heap<{
  expires: number
  raw: any
  key: string | symbol
  fn: Function
}> {
  private timer: ReturnType<typeof setTimeout> | null = null
  private rafTimer: number | null = null
  private running: boolean = false

  constructor(private interval: ExpiresInterval) {
    super(
      (a, b) => a.expires < b.expires,
      (a, b) => a.raw === b.raw && a.key === b.key
    )
  }

  set(receiver: object, key: string | symbol, expires: number) {
    if (this.interval === 'none') return
    const raw = toRaw(receiver)

    const target = {
      expires,
      key,
      raw,
      fn() {
        Reflect.get(receiver, key)
      },
    }

    if (Array.isArray(receiver) && isIntegerKey(key)) {
      target.key = arrayTraverseKey
      target.fn = () => {
        for (let i = receiver.length - 1; i >= 0; i -= 1) {
          Reflect.get(receiver, i)
        }
      }

      const oldIndex = this.findIndex(target)
      if (~oldIndex) {
        target.expires = Math.min(
          target.expires,
          this.list[oldIndex]?.expires ?? Infinity
        )
      }
    }

    this.insert(target)
    this.raf()
  }

  raf() {
    if (this.running) return
    this.running = true
    promise.then(() => this._raf())
  }
  _raf() {
    this.running = false
    if (typeof this.interval === 'number') {
      if (this.timer) clearTimeout(this.timer)

      let interval = this.interval
      const expires = this.top?.expires
      if (expires) {
        interval = Math.min(interval, expires - Date.now())
      }

      this.timer = setTimeout(() => this.check(), interval)
    } else if (this.interval === 'raf') {
      if (this.rafTimer) cancelAnimationFrame(this.rafTimer)
      this.rafTimer = requestAnimationFrame(() => this.check())
    }
  }

  check() {
    const recent = this.recent
    if (recent === Infinity) return
    this.raf()

    const now = Date.now()
    if (recent > now) return

    const expireds: Function[] = []
    for (const item of this.list) {
      if (item.expires > now) break
      expireds.push(item.fn)
    }

    this.list.splice(0, expireds.length)
    expireds.forEach((fn) => fn())
  }

  get top() {
    return this.list[0]
  }
  get recent() {
    return this.top?.expires ?? Infinity
  }
}

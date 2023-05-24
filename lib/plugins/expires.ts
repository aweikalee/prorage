import { ProragePlugin, ProragePluginContext } from '../plugin'
import { isObject } from '../utils'
import * as primaryKeys from './primaryKeys'
import { useContext } from '../context'

export type ExpiresOptions = {
  primaryKey?: string
  multiplier?: number
  immediate?: boolean
}

type ExpiresItem = {
  expires: number
  paths: (string | symbol)[]
  key: string | symbol
}

export function createExpiresPlugin(options: ExpiresOptions = {}) {
  const {
    primaryKey = primaryKeys.expires,
    multiplier = 24 * 60 * 60 * 1000,
    immediate = false,
  } = options

  let _expires = 0
  function useAbsoluteExpires(expires: number | Date, fn: Function) {
    const oldExpires = _expires
    try {
      _expires = typeof expires === 'number' ? expires : expires.getTime()
      fn()
    } catch (error) {
      throw error
    } finally {
      _expires = oldExpires
    }
  }
  return {
    useAbsoluteExpires,
    useExpires(expires: number, fn: Function) {
      useAbsoluteExpires(Math.floor(Date.now() + expires * multiplier), fn)
    },

    plugin: <ProragePlugin>((ctx) => {
      const control = new ExpiresControl(ctx, immediate)
      return {
        getter(key, value) {
          if (!isObject(value)) return value
          if (!(primaryKey in value)) return value
          const expires = value[primaryKey]

          const { paths } = useContext()
          const target = {
            key,
            expires,
            paths: paths!,
          }
          if (expires <= Date.now()) {
            control.remove(target)
            return
          } else {
            control.insert(target)
            return value.value
          }
        },
        setter(key, value) {
          if (!_expires) return value

          const { paths } = useContext()
          const target = {
            key,
            expires: _expires,
            paths: paths!,
          }
          control.insert(target)

          return {
            [primaryKey]: _expires,
            value,
          }
        },
      }
    }),
  }
}

class ExpiresHeap {
  private list: ExpiresItem[] = []

  insert(target: ExpiresItem) {
    const findIndex = this.list.findIndex((item) => {
      return this.compare(target, item)
    })

    if (~findIndex) {
      this.list.splice(findIndex, 0, target)
    } else {
      this.list.push(target)
    }
  }

  remove(target: ExpiresItem) {
    const index = this.findIndex(target)
    if (~index) this.splice(index, 1)
  }

  splice(start: number, deleteCount: number) {
    this.list.splice(start, deleteCount)
  }

  findIndex(target: ExpiresItem) {
    const targetPaths = target.paths
    return this.list.findIndex(({ paths }) => {
      if (paths.length !== targetPaths.length) return false
      return paths.every((path, i) => path === targetPaths[i])
    })
  }

  get length() {
    return this.list.length
  }

  get top() {
    return this.list[0]
  }

  [Symbol.iterator]() {
    return this.list[Symbol.iterator]()
  }

  get recent() {
    return this.top?.expires ?? Infinity
  }

  private compare(a: ExpiresItem, b: ExpiresItem) {
    return a.expires < b.expires
  }
}

class ExpiresControl extends ExpiresHeap {
  private timer: number | null = null

  constructor(private ctx: ProragePluginContext, private immediate: boolean) {
    super()
  }

  insert(item: ExpiresItem) {
    if (!this.immediate) return

    const index = super.findIndex(item)
    if (~index) super.splice(index, 1)
    super.insert(item)

    this.raf()
  }

  remove(item: ExpiresItem) {
    const { key, paths } = item
    let target = this.ctx.receiver

    super.remove(item)

    for (let path of paths) {
      if (path in target) {
        target = target[path]
      } else {
        return
      }
    }

    if (target) {
      delete target[key]
    }
  }

  private raf() {
    if (this.timer) cancelAnimationFrame(this.timer)
    this.timer = requestAnimationFrame(this.check.bind(this))
  }

  private check() {
    if (this.recent === Infinity) return
    this.raf()

    const now = Date.now()
    if (this.recent > now) return

    for (const item of this) {
      if (item.expires <= now) this.remove(item)
    }
  }
}

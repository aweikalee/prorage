import { ProragePlugin } from '../types'
import { typeOf } from '../utils'

export type ExpiresOptions = {
  primaryKey?: string
  multiplier?: number
}

export function createExpiresPlugin(options: ExpiresOptions = {}) {
  const { primaryKey = '#p_expires_', multiplier = 24 * 60 * 60 * 1000 } =
    options
  let _expires = 0

  return {
    useExpires(expires: number, fn: Function) {
      const oldExpires = _expires
      try {
        _expires = expires
        fn()
      } catch (error) {
        throw error
      } finally {
        _expires = oldExpires
      }
    },

    plugin: <ProragePlugin>{
      getter(key, value) {
        if (typeOf(value) !== 'object') return value
        if (!(primaryKey in value)) return value
        const expire = value[primaryKey]

        if (expire < Date.now()) {
          delete this[key]
          return
        } else {
          return value.value
        }
      },
      setter(_, value) {
        if (!_expires) return value
        const expires = Math.floor(Date.now() + _expires * multiplier)

        return {
          [primaryKey]: expires,
          value,
        }
      },
    },
  }
}

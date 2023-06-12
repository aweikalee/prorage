import { isArray, isIntegerKey } from '@vue/shared'
import { type ProragePlugin } from '../../hook'
import { ExpiresChecker, type ExpiresInterval } from './checker'
import { getExtra } from '../extra'

export type ExpiresPluginOptions = {
  checkInterval?: ExpiresInterval
  primaryKey?: string
}

export const PRIMARY_KEY = 'expires'

export function expiresPlugin(
  options: ExpiresPluginOptions = {}
): ProragePlugin {
  const { checkInterval = 'none', primaryKey = PRIMARY_KEY } = options

  return () => {
    const checker = new ExpiresChecker(checkInterval)
    return {
      afterParse() {
        checker.clear()
      },

      get(target, key, value, receiver) {
        const expires = getExtra(target, key)?.[primaryKey] as
          | number
          | undefined

        if (expires) {
          const isExpired = Date.now() > expires

          if (isExpired) {
            if (isArray(target) && isIntegerKey(key)) {
              target.splice(key as unknown as number, 1)
            } else {
              Reflect.deleteProperty(target, key)
            }
            return
          } else {
            checker.set(receiver, key)
          }
        }

        return value
      },
    }
  }
}

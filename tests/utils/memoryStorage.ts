import { StorageLike } from '../../lib'

interface StateObj {
  [key: string]: string | null
}

export function createMemoryStorage(): StorageLike {
  const state: StateObj = {}
  return {
    getItem(key: string) {
      return state[key] ?? null
    },
    setItem(key: string, value: any) {
      state[key] = value
    },
    removeItem(key: string) {
      delete state[key]
    },
  }
}

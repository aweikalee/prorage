import { StorageLike } from '../../lib'

class MemoryStorage {
  get length() {
    return Object.keys(this).length
  }
  getItem(key: string) {
    return this[key] ?? null
  }
  setItem(key: string, value: any) {
    this[key] = value
  }
  removeItem(key: string) {
    delete this[key]
  }
}

export function createMemoryStorage(): StorageLike {
  return new MemoryStorage()
}

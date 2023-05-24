export interface ProrageContext {
  paths?: (string | symbol)[]
}

const activeShare: ProrageContext[] = []

export function runContext(fn: Function) {
  try {
    activeShare.push({} as ProrageContext)
    return fn()
  } catch (error) {
    throw error
  } finally {
    activeShare.pop()
  }
}

export function useContext() {
  return activeShare[activeShare.length - 1]
}

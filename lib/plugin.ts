import { Writer, Reader, Getter, Setter } from './types'
import { mergeReplacers } from './utils'

export type ProragePlugin = {
  writer?: Writer
  reader?: Reader
  getter?: Getter
  setter?: Setter
}

export function combinePlugins(plugins: ProragePlugin[]) {
  const writers: Writer[] = []
  const readers: Reader[] = []
  const setters: Setter[] = []
  const getters: Getter[] = []

  plugins.forEach(({ writer, reader, setter, getter }) => {
    if (writer) writers.push(writer)
    if (reader) readers.unshift(reader)
    if (setter) setters.push(setter)
    if (getter) getters.unshift(getter)
  })

  const writer = mergeReplacers(writers)
  const reader = mergeReplacers(readers)
  const setter = mergeReplacers(setters)
  const getter = mergeReplacers(getters)

  return { writer, reader, setter, getter }
}

import { isFunction } from '@vue/shared'

export type ProragePlugin = PluginOptions | (() => PluginOptions)

export interface PluginOptions {
  beforeParse?: BeforeParse
  parse?: Parse
  afterParse?: AfterParse

  beforeStringify?: BeforeStringify
  stringify?: Stringify
  afterStringify?: AfterStringify

  get?: Getter
  set?: Setter
  deleteProperty?: DeleteProperty
}

export type BeforeParse = () => void
export type Parse = (this: any, key: string, value: any) => any
export type AfterParse = () => void

export type BeforeStringify = () => void
export type Stringify = (this: any, key: string, value: any) => any
export type AfterStringify = () => void

type Interceptor = (
  target: any,
  key: string | symbol,
  value: any,
  receiver: any
) => any
export type Getter = Interceptor
export type Setter = Interceptor
export type DeleteProperty = (
  target: object,
  key: string | symbol
) => boolean | void

function forEachRunner<T extends (...args: any[]) => any>(fns: T[]) {
  return function (this: any, ...args: Parameters<T>) {
    fns.forEach((fn) => {
      try {
        fn.call(this, ...args)
      } catch (err) {
        console.error(err)
      }
    })
  }
}

export function replaceRunner(
  replacers: (Stringify | Parse)[]
): Stringify | Parse {
  if (!replacers.length) return (_, value) => value

  return function (key, value) {
    return replacers.reduce(
      (value, replacer) => replacer.call(this, key, value),
      value
    )
  }
}

function interceptorRunner(interceptors: Interceptor[]): Interceptor {
  return function (target, key, value, receiver) {
    return interceptors.reduce((value, next) => {
      return next(target, key, value, receiver)
    }, value)
  }
}

function deletePropertyRunner(
  deleteProperties: DeleteProperty[]
): (target: object, key: string | symbol) => boolean | undefined {
  return function (target, key) {
    for (let i = 0; i < deleteProperties.length; i += 1) {
      const deleteProperty = deleteProperties[i]
      const result = deleteProperty(target, key)

      if (result === true || result === false) {
        return result
      }
    }

    return
  }
}

export function createHooks(plugins: ProragePlugin[] = []) {
  const beforeParses: BeforeParse[] = []
  const parses: Parse[] = []
  const afterParses: AfterParse[] = []

  const beforeStringifies: BeforeStringify[] = []
  const stringifies: Stringify[] = []
  const afterStringifies: AfterStringify[] = []

  const gets: Getter[] = []
  const sets: Setter[] = []
  const deleteProperties: DeleteProperty[] = []

  plugins.forEach((plugin) => {
    const {
      beforeParse,
      parse,
      afterParse,

      beforeStringify,
      stringify,
      afterStringify,

      get,
      set,
      deleteProperty,
    } = isFunction(plugin) ? plugin() : plugin

    if (beforeParse) beforeParses.unshift(beforeParse)
    if (parse) parses.unshift(parse)
    if (afterParse) afterParses.unshift(afterParse)

    if (beforeStringify) beforeStringifies.push(beforeStringify)
    if (stringify) stringifies.push(stringify)
    if (afterStringify) afterStringifies.push(afterStringify)

    if (get) gets.unshift(get)
    if (set) sets.push(set)
    if (deleteProperty) deleteProperties.push(deleteProperty)
  })

  return {
    beforeParse: forEachRunner(beforeParses),
    parse: replaceRunner(parses),
    afterParse: forEachRunner(afterParses),

    beforeStringify: forEachRunner(beforeStringifies),
    stringify: replaceRunner(stringifies),
    afterStringify: forEachRunner(afterStringifies),

    get: interceptorRunner(gets),
    set: interceptorRunner(sets),
    deleteProperty: deletePropertyRunner(deleteProperties),
  }
}

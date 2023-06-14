export { createStorage, type StorageOptions } from './storage'

export { createNamespace, type NamespaceOptions } from './namespace'

export {
  type ProragePlugin,
  type PluginOptions,
  type BeforeStringify,
  type Stringify,
  type AfterStringify,
  type BeforeParse,
  type Parse,
  type AfterParse,
  type Setter,
  type Getter,
  type DeleteProperty,
} from './hook'

export {
  isNamespace,
  isStorage,
  toProrageRaw,
  prefixWrap,
  prefixUnwrap,
} from './shared'

export { watch, watchEffect } from './watch'

export * from './types'

export { useExtra, getExtra } from './plugins/extra'

export {
  expiresPlugin,
  useExpires,
  type ExpiresDateOptions,
  type ExpiresDate,
} from './plugins/expires'

export {
  translatePlugin,
  type TranslatePluginOptions,
  type TranslateDictionary,
} from './plugins/translate'

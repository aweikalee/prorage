export type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export type Writer = (this: any, key: string, value: any) => any
export type Reader = (this: any, key: string, value: any) => any
export type Getter = (this: any, key: string | symbol, value: any) => any
export type Setter = (this: any, key: string | symbol, value: any) => any
export type Replacer = (this: any, key: any, value: any) => any

export type ProragePlugin = {
  writer?: Writer
  reader?: Reader
  getter?: Getter
  setter?: Setter
}

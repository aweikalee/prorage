export type StorageLike = {
  readonly length: number
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}
export type StringifyLike = (
  value: any,
  replacer?: (this: any, key: string, value: any) => any
) => string
export type ParseLike = (
  text: string,
  reviver?: (this: any, key: string, value: any) => any
) => any

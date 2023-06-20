# Plugin 的开发
**Plugin** 其实就是声明了一系列 Hook, 在特定的时机被调用.

在开发之前, 建议先了解 [Prorage 的构成](./structure.md).

## 类型
```ts
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
```

## Hooks

### 构成
Hook 主要分为两个部分:

#### 写入与读取
`StorageLike` 调用 `getItem` 与 `setItem` 时, 对数据进行 `JSON.parse` 与 `JSON.stringify`, 会调用 `parse` 与 `stringify` 相关的 Hook.

- `beforeParse` 在 `parse` 之前调用.
- `parse` 作为 `JSON.parse(text, reviver)` 的 `reviver` 参数.
- `afterParse` 在 `parse` 之后调用.


- `beforeStringify` 在 `stringify` 之前调用.
- `stringify` 作为 `JSON.stringify(value, replacer)` 的 `replacer` 参数.
- `afterStringify` 在 `stringify` 之后调用.


#### Proxy 拦截
`Proxy` 中的 `get`, `set`, `deleteProperty` 会调用对应的 Hook.

- `get` 访问时调用.
- `set` 赋值时调用.
- `deleteProperty` 删除时调用.

### 执行顺序
根据传入的 `plugins` 数组顺序, `stringify` 相关与 `get` 按顺序执行, `parse` 相关与 `set` 按逆序执行.

`beforeParse`, `afterParse`, `beforeStringify`, `afterStringify` 会按其顺序执行, Hook 之间没有关联.

`parse`, `stringify`, `get`, `set` 执行逻辑都类似 reduce, 上一个 Hook 的返回值作为下一个 Hook 的参数.

而 `deleteProperty` 比较特殊, 当 Hook 返回 `true` 或 `false`, 则会中断后续的执行.

### 参数
请参考 [hook.ts](../../lib/hook.ts) 中的类型定义.

## 注意事项
### 附加属性的处理
附加属性可以分为两类: **运行时需要使用** 与 **运行时不需要使用**.

对于**运行时需要使用**的附加属性, 比如有效期, 尽可能使用内置的 `extraPlugin` 进行完成.

对于**运行时不需要使用**的附加属性, 建议在 `stringify` 中追加, 在 `parse` 中移除.

### 数组操作
数组操作期间访问**代理数据**时, 若键名是整数类键名, 将获得**运行时数据**.

这是因为数组操作时会对元素进行移动, 移动操作相当于是通过 `set` 重新赋值, 但赋值时用的数据源是**代理数据**, 这可能使得移动前后数据不一致. 

所以为了修复该问题, 在数组操作期间对整数类键名的访问做了特殊处理.
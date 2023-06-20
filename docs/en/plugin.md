# Plugin Development
**Plugin** is a series of Hooks that are called at the right time.

Before development, it is recommended to read [Prorage Structure](./structure.md).

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
Hook has two parts:

#### Writer and Reader
When `StorageLike` calls `getItem` and `setItem`, it will call the `parse` and `stringify` related Hook.

- `beforeParse`, be called before `parse`.
- `parse`, as parameter `reviver` at `JSON.parse(text, reviver)`.
- `afterParse`, be called after `parse`.

- `beforeStringify`, be called before `stringify`.
- `stringify`, as parameter `replacer` at `JSON.stringify(value, replacer)`.
- `afterStringify`, be called after `stringify`.


#### Proxy Handler
`get`, `set`, `deleteProperty` will call the corresponding Hook in `Proxy`.

- `get` be called when accessing.
- `set` be called when assigning.
- `deleteProperty` be called when deleting.

### execution order
According to the order of the plugins array, `stringify` related and `get` are executed in order, and `parse` related and `set` are executed in reverse order.

`beforeParse`, `afterParse`, `beforeStringify`, `afterStringify` will be executed in order, and there is no association between Hooks.

`parse`, `stringify`, `get`, `set` is similar to reduce, the return value of the previous Hook is used as the parameter of the next Hook.

`deleteProperty` is special, when Hook returns `true` or `false`, will break.

### Parameters
Please refer to the type definition in [hook.ts](../../lib/hook.ts).

## Notes
### Extra Properties
Extra properties have two kinds: **required at runtime** and **not required at runtime**.

**required at runtime**, such as expires, try to use the built-in `extraPlugin` to complete.

**not required at runtime**, it is recommended to append in `stringify` and remove in `parse`.

### Array Operation
When accessing **Proxy Data** during array operation, if the key name is an integer key, will get **Runtime Data**.

This is because the array operation will move the elements, the move operation is equivalent to reassigning using `set`, but the data source used for assignment is the **Proxy Data**, which may cause the data to be inconsistent before and after the move.

So, to fix, special processing is done for accessing integer key names during array operation.
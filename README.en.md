# Prorage
[中文](./README.md) | English

Storage used like object, Based on ES6 API Proxy and [@vue/reactivity](https://github.com/vuejs/core/blob/main/packages/reactivity).

`Prorage` = `Proxy` + `Storage`

**[Playground]**: [Stackblitz](https://stackblitz.com/edit/prorage-playground?file=src%2Fstorage.ts)

## Contents

- [Prorage](#prorage)
  - [Contents](#contents)
  - [Features](#features)
  - [Quick Start](#quick-start)
    - [Installation](#installation)
    - [Usage](#usage)
  - [createStorage](#createstorage)
    - [Options](#options)
    - [API](#api)
      - [storage.clear](#storageclear)
      - [storage.reload](#storagereload)
        - [with storage event](#with-storage-event)
      - [storage.save](#storagesave)
      - [watch](#watch)
  - [Built-in Plugin](#built-in-plugin)
    - [extraPlugin](#extraplugin)
      - [API](#api-1)
        - [useExtra](#useextra)
        - [getExtra](#getextra)
    - [expiresPlugin](#expiresplugin)
      - [Options](#options-1)
      - [API](#api-2)
        - [useExpires](#useexpires)
    - [translatePlugin](#translateplugin)
      - [Options](#options-2)
        - [dictionary](#dictionary)
  - [Other](#other)
    - [Data Types Support](#data-types-support)
      - [Primitives](#primitives)
      - [Objects](#objects)
    - [Plugin Development](#plugin-development)
    - [Circular Object](#circular-object)
    - [With TypeScript](#with-typescript)
    - [With React](#with-react)
    - [Why can't trigger Vue update](#why-cant-trigger-vue-update)


## Features
- **Storage** used like object
- Customizable, most customization can be achieved by Plugins.
- No side effects, supports Tree Shaking.
- Based on `@vue/reactivity`, it can be used well with Vue.
- Better for Vue projects that without Vuex/Pinia, but can also be used without Vue.

## Quick Start
### Installation
```sh
npm install @vue/reactivity
npm install prorage
```
If you have already installed Vue, you do not need to install `@vue/reactivity`.

### Usage
```js
import { createStorage } from 'prorage'

const storage = createStorage()


storage.foo = 'foo'
delete foo

storage.bar = []
storage.bar.push('hello')
```

---

## createStorage
### Options
```js
import { createStorage, expiresPlugin } from 'prorage'

const storage = createStorage({
  storage: localStorage,
  stringify: JSON.stringify,
  parse: JSON.parse,
  saveFlush: 'async',
  plugins: [expiresPlugin()],

  prefix: 'prefix#',
})
```

| Parameter | Type | Default | Description |
| :-: | :-: | :-: | :-: |
| storage | StorageLike | `localStorage` | Storage Object |
| stringify | StringifyLike | `JSON.stringify` | Method to convert to JSON |
| parse | ParseLike | `JSON.parse` | Method to parse JSON |
| saveFlush | `"sync"` \| `"async"` | `"async"` | Timing of save execution |
| plugins | ProragePlugin[] | `[]` | Plugins |
| prefix | string |  | Prefix of storage key name |

- `StorageLike`, such as `localStorage` and `sessionStorage`, should have methods: `getItem`, `setItem` and `removeItem`. `getItem` must be a synchronous method.
- When `saveFlush` is set to `async`, multiple operations will be merged into one save, `sync` will save immediately after each operation.
- For information on `plugins`, please refer to the **Built-in Plugin** and [Plugin Development](./docs/en/plugin.md).


### API
#### storage.clear
clear data.
```js
storage.clear() // Clear all data (data that matches the prefix)

storage.clear('foo') // Clear data under the 'foo' namespace
```

#### storage.reload
reload data.
```js
storage.reload('foo')
```

It should be noted that old data will be out of control (overwritten). For example:
```js
storage.test = { a: 1 }
const temp = storage.test
temp.a = 2 // it works

storage.reload('test')
temp.a = 3 // it not works
temp === storage.test // false
```

在调用 `reload` 后 `storage.test` 上的引用被替换为重新读取的数据, 原先储存的 `temp` 不再是 `storage.test` 的数据. 故再对 `temp` 对象进行修改, 不会再影响 `storage.test`.

After run `reload`, the reference to `storage.test` is replaced with the reloaded data, and `temp` isn't the data of `storage.test`. So, modifying the `temp`, can't affect `storage.test`.

##### with storage event
```js
addEventListener('storage', ({ key }) => storage.reload(key))
```

#### storage.save
Save data.
```js
storage.save('foo')
```

#### watch
Similar to the `watch` function in Vue, but with some limitations. This API is mainly aimed at projects that without Vue.

```js
watch(
  () => storage,
  () => {
    console.log('change')
  }, {
    deep: true,
    flush: 'async'
  }
)
```

- The first parameter `source`, only supports function.
- The second parameter `callback`, no provide `oldValue` and `newValue`.
- The third parameter `options`, `deep` and `immediate` are same as Vue. `flush` only supports `sync` and `async`, `sync` is same as Vue, `async` is executed asynchronously.

---

## Built-in Plugin
### extraPlugin
Add extra properties to the data. As a basic **Plugin**, it does not need to be declared for use.

```js
import { createStorage, useExtra } from 'prorage'
const storage = createStorage()

storage.foo = useExtra('bar', {
  test: 'hello world'
})

getExtra(storage, 'foo') // { test: 'hello world' }
```

#### API

##### useExtra
create a data with extra properties.
```ts
function useExtra<T>(value: T, extra: Record<string, unknown>): T
```

##### getExtra
get the extra properties of `key` on `target`.
```ts
function getExtra(target: object, key: string | symbol): Record<string, unknown>
```

---

### expiresPlugin
add expires to the data.

```js
import { createStorage, expiresPlugin, useExpires } from 'prorage'
const storage = createStorage({
  plugins: [
    expiresPlugin({
      checkInterval: 1000,
    })
  ]
})

storage.foo = useExpires('bar', { days: 7 })
```

#### Options
| Parameter | Type | Default | Description |
| :-: | :-: | :-: | :-: |
| checkInterval | 'none' | 'raf' | number | `"none"` | Interval of checking expires |

- Expired data is **not immediately deleted**, but will be deleted **when be getted**.
- If `checkInterval` is `"raf"` or a number, the data will be periodically checked for expires using `requestAnimationFrame/setTimeout`. Only the data that **has been getted** will be added to the check queue.
- When using `setTimeout`, there is a compensation mechanism. When `expires - Date.now()` is greater than `checkInterval`, the next execution delay will be `expires - Date.now()`.


#### API
##### useExpires
```ts
function useExpires<T>(value: T, expires: ExpiresDate): T

type ExpiresDate = number | Date | ExpiresDateOptions
type ExpiresDateOptions = {
  milliseconds?: number
  seconds?: number
  minutes?: number
  hours?: number
  days?: number
  months?: number
  years?: number
}
```

- If `expires` is `number`, timestamp, absolute time for expires.
- If `expires` is `Date`, absolute time for expires.
- If `expires` is `ExpiresDateOptions`, it represents the relative time for expiration (relative to now). `months` is calculated based on the natural month, and is not equal to 30 days.
---

### translatePlugin
Translate data to a format that is better for storage.


```js
import { createStorage, translatePlugin } from 'prorage'
const storage = createStorage({
  plugins: [translatePlugin()]
})

storage.foo = new Date()
storage.bar = 123n
storage.baz = /test/gi
storage.qux = Infinity
```

Default Supports Types: `BigInt`, `NaN/Infinity/-Infinity`, `Date`, `RegExp`.

#### Options
| Parameters | Type | Default | Description |
| :-: | :-: | :-: | :-: |
| dictionary | TranslateDictionary[] | `[]` | dictionary for translate |

##### dictionary
```js
import { createStorage, translatePlugin } from 'prorage'
const storage = createStorage({
  plugins: [
    translatePlugin({
      dictionary: [
        {
          name: 'Symbol',
          test: (value) => typeof value === 'symbol',
          stringify: (value) => value.toString(),
          parse: (value) => {
            const _Symbol = (value) => {
              try {
                return new Function(`return ${value}`)()
              } catch (e) {
                return typeof value === 'symbol'
                  ? value
                  : Symbol.for(String(value))
              }
            }
            const _value = value.replace(/^Symbol\((.*)\)$/, '_Symbol("$1")')
            return new Function('_Symbol', `return ${_value}`)(_Symbol)
          },
        }
      ]
    })
  ]
})

storage.foo = Symbol.for('123')
```

| Parameters | Type | Description |
| :-: | :-: | :-: |
| name | string | Unique identifier |
| test | (value: unknown) => boolean | Test the value, if return `true`, the value will be translated by the dictionary |
| stringify | (value: any) => any | Translate to storage format |
| parse | (value: any) => any | Restores data |


- `name` 需要唯一, 内置的标识有: `BigInt`, `Number`, `Date`, `RegExp`.
- 按数组顺序进行 `test` (内置的追加在数组末尾), 匹配后该数据将不再进行其他转换操作.

- `name` is unique. The built-in name are: `BigInt`, `Number`, `Date`, `RegExp`.
- The `test` is runed in the order of the array (built-ins are appended to array end), if return `true`, the data don't try other translate.


## Other

### Data Types Support
Keys support is same as object, but `symbol` will be ignored when `JSON.stringify`.

Values of support:
#### Primitives
| Type | Basic Support | With translatePlugin |
| :-: | :-: | :-: |
| undefined | ✔️ | ✔️ |
| null | ✔️ | ✔️ |
| String | ✔️ | ✔️ |
| Boolean | ✔️ | ✔️ |
| Number | ✔️ | ✔️ |
| BigInt | ❌ | ✔️ |
| Symbol | ❌ | can support `Symbol.for` (user configurable) |

#### Objects
| Type | Basic Support | With translatePlugin | Description |
| :-: | :-: | :-: | :-: |
| Basic Object | ✔️ | ✔️ | |
| Array | ✔️ | ✔️ | |
| Date | ❌ | ✔️ | |
| RegExp | ❌ | ✔️ | |
| Function | ❌ | Barely supported (user configurable) | scopes will lose |
| Set | ❌ | ❌ | Code cost more than the benefits |
| Map | ❌ | ❌ | Code cost more than the benefits |
| WeakSet | ❌ | ❌ | No value |
| WeakMap | ❌ | ❌ | No value |

### Plugin Development
[Plugin Development](./docs/en/plugin.md)

### Circular Object
You can use JSON library like [flatted](https://github.com/WebReflection/flatted) to solve the problem of circular object.

```js
import { stringify, parse, } from 'flatted'
import { createStorage } from 'prorage'

const storage = createStorage({
  stringify,
  parse,
})

storage.test = {}
storage.test.circular = storage.test
```

### With TypeScript
```ts
import { createStorage } from 'prorage'

type MyStorage = {
  foo: string
  bar: number
}
const storage = createStorage<MyStorage>()
```

### With React
Like `@vue/reactivity` with React. Simple example: [Prorage With React - StackBlitz](https://stackblitz.com/edit/prorage-with-react?file=src%2FApp.jsx).

### Why can't trigger Vue update
If you use the *vue.xxx.global.js* or *vue.xxx-browser.js* version of Vue, it will cause dependency `@vue/reactivity` to not be the same code, resulting in independent `trigger` events between the two. Avoid using these two versions of Vue.

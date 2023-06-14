# Prorage
基与 ES6 API Proxy 与 [@vue/reactivity](https://github.com/vuejs/core/blob/main/packages/reactivity) 实现, 像普通对象一样使用的 storage.

`Prorage` = `Proxy` + `Storage`

**[playground]**: [Stackblitz](https://stackblitz.com/edit/prorage-playground?file=src%2Fstorage.ts)

## 安装
```sh
npm install @vue/reactivity
npm install prorage
```

## 使用
```js
import { createStorage } from 'prorage'

const storage = createStorage({
  storage: localStorage
})


storage.foo = 'foo'
delete foo

storage.bar = []
storage.bar.push('hello')
```

---

## Storage 实例
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

| 参数 | 类型 | 默认值 | 说明 |
| :-: | :-: | :-: | :-: |
| storage | StorageLike | `localStorage` | 储存对象 |
| stringify | StringifyLike | `JSON.stringify` | 转换为 JSON 字符串的方法 |
| parse | ParseLike | `JSON.parse` | 解析 JSON 字符串的方法 |
| saveFlush | `"sync"` \| `"async"` | `"async"` | 保存的执行时机 |
| plugins | ProragePlugin[] | `[]` | 插件 |
| prefix | string |  | 储存键名前缀 |

- `StorageLike`, 比如 `localStorage`, `sessionStorage`. 应具有方法: `getItem`, `setItem`, `removeItem`. 其中 `getItem` 必须是同步方法.
- `saveFlush` 为 `async` 时，多次操作会合并为一次保存，而 `sync` 时则会在每次操作后立即保存。
- `plugins` 相关的内容, 请阅读后文的 **内置 Plugin** 与 [Plugin 的开发](./docs/plugin.md).

### API
#### clear
清空数据.
```js
storage.clear() // 清空所有数据(符合 preifx 的数据)

storage.clear('foo') // 清空 foo 命名空间下的数据
```

#### reload
重新读取数据.
```js
storage.reload('foo')
```

需要注意的是旧数据会脱离控制(被覆盖). 举个例子:
```js
storage.test = { a: 1 }
const temp = storage.test
temp.a = 2 // 这是有效的

storage.reload('test')
temp.a = 3 // 这是无效的
temp === storage.test // false
```

在调用 `reload` 后 `storage.test` 上的引用被替换为重新读取的数据, 原先储存的 `temp` 不再是 `storage.test` 的数据. 故再对 `temp` 对象进行修改, 不会再影响 `storage.test`.

##### with storage event
```js
addEventListener('storage', ({ key }) => storage.reload(key))
```

#### save
主动保存数据, 通常不需要主动调用.
```js
storage.save('foo')
```

---

## 内置 Plugin
### extraPlugin 附加属性
为数据增加附加属性. 作为一个基础 **Plugin**, 不需要声明使用.

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
生成一个具有附加属性的数据.
```ts
function useExtra<T>(value: T, extra: Record<string, unknown>): T
```

##### getExtra
获得 `target` 对象上 `key` 键名绑定的附加属性.
```ts
function getExtra(target: object, key: string | symbol): Record<string, unknown>
```

---

### expiresPlugin 有效期
允许为数据设置有效期.

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
| 参数 | 类型 | 默认值 | 说明 |
| :-: | :-: | :-: | :-: |
| checkInterval | 'none' | 'raf' | number | `"none"` | 检查过期时间的间隔 |

- 过期数据并**不会立即删除**, 而是**下次被访问时**才会被删除.
- `checkInterval` 为 `"raf"` 或 `number` 时, 会通过 `requestAnimationFrame/setTimeout` 不断访问数据来触发过期删除. 只有**被访问过**的数据才会加入到检查队列中.

#### API
##### useExpires
```ts
function useExpires<T>(value: T, expires: ExpiresDate): T

type ExpiresDate = number | Date | ExpiresDateOptions
type ExpiresDateOptions = {
  seconds?: number
  minutes?: number
  hours?: number
  days?: number
  months?: number
  years?: number
}
```

- `expires` 为 `number`, 时间戳, 作为过期的绝对时间.
- `expires` 为 `Date`, 作为过期的绝对时间.
- `expires` 为 `ExpiresDateOptions`, 作为过期的相对时间(相对当前时间).

---

### translatePlugin 数据转换
将数据转换为更适合储存的格式.

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

默认支持的数据类型有: `BigInt`, `NaN/Infinity/-Infinity`, `Date`, `RegExp`.

#### Options
| 参数 | 类型 | 默认值 | 说明 |
| :-: | :-: | :-: | :-: |
| dictionary | TranslateDictionary[] | `[]` | 字典 |

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

| 参数 | 类型 | 说明 |
| :-: | :-: | :-: |
| name | string | 唯一标识 |
| test | (value: unknown) => boolean | 判断数据是否由该字典进行处理 |
| stringify | (value: any) => any | 转换为储存格式 |
| parse | (value: any) => any | 还原数据 |

- `name` 需要唯一, 内置的标识有: `BigInt`, `Number`, `Date`, `RegExp`.
- 按数组顺序进行 `test` (内置的追加在数组末尾), 匹配后该数据将不再进行其他转换操作.

## 其他

### 数据类型支持情况
键名支持和对象一样, 但 `symbol` 作为键名 `JSON.stringify` 时会被忽略.

键值支持情况如下.

#### 基础类型
| 数据类型 | 基础支持 | with translatePlugin |
| :-: | :-: | :-: |
| undefined | ✔️ | ✔️ |
| null | ✔️ | ✔️ |
| String | ✔️ | ✔️ |
| Boolean | ✔️ | ✔️ |
| Number | ✔️ | ✔️ |
| BigInt | ❌ | ✔️ |
| Symbol | ❌ | 可以支持 `Symbol.for` (需用户配置) |

#### 引用类型
| 数据类型 | 基础支持 | with translatePlugin | 说明 |
| :-: | :-: | :-: | :-: |
| 基础的 Object | ✔️ | ✔️ | |
| Array | ✔️ | ✔️ | |
| Date | ❌ | ✔️ | |
| RegExp | ❌ | ✔️ | |
| Function | ❌ | 可以勉强支持 (需用户配置) | 会丢失作用域 |
| Set | ❌ | ❌ | 实现成本与收益不匹配 |
| Map | ❌ | ❌ | 实现成本与收益不匹配 |
| WeakSet | ❌ | ❌ | 没有实现价值 |
| WeakMap | ❌ | ❌ | 没有实现价值 |

### Plugin 的开发
[Plugin 的开发](./docs/plugin.md)

### 循环引用
可以借助 [flatted](https://github.com/WebReflection/flatted) 之类的 JSON 库来解决循环引用的问题.

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
就和 `@vue/reactivity` 在 React 中使用一样, 实现方式很多, 以下是一种简单的使用示例: [prorage with react - StackBlitz](https://stackblitz.com/edit/prorage-with-react?file=src%2FApp.jsx).

### 为什么无法驱动 Vue 更新
若使用的 *vue.xxx.global.js* 或是 *vue.xxx-browser.js* 版本的 Vue, 会导致与 `prorage` 所依赖的 `@vue/reactivity` 不是同一份代码, 使得两者 `trigger` 事件相互独立. 应避免使用这两类版本的 Vue. 

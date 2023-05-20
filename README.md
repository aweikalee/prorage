# Prorage
基与 ES6 Proxy 实现, 像普通对象一样使用的 storage.

`Prorage` = `Proxy` + `Storage`

## 安装
```sh
npm install prorage
```

## 使用
```js
import { createProrage } from 'prorage'

const { storage } = createProrage({
  storage: localStorage,
})

storage.foo = 'bar'
delete storage.foo

storage.bar = []
storage.bar.push('hello')
```

## Options
```js
const { storage } = createProrage({
  storage: localStorage,
  plugins: [
    createExpirePlugin(),
  ],
})
```
| 参数 | 类型 | 默认值 | 说明 |
| :-: | :-: | :-: | :-: |
| storage | StorageLike | `localStorage` | 储存对象 |
| plugins | array\<ProragePlugin\> | `[]` | 扩展插件, 详细说明见后文 |

- `StorageLike`, 比如 `localStorage`, `sessionStorage`. 应具有方法: `getItem`, `setItem`, `removeItem`. 其中 `getItem` 必须是同步方法.


## 内置 Plugin
### expiresPlugin 有效期
允许为数据设置有效期。有效期结束时，数据并不会立即被删除，而是在下一次被访问时删除。

```js
import { createProrage, createExpiresPlugin } from 'prorage'

const { plugin: expiresPlugin, useExpires } = createExpiresPlugin({
  multiplier: 1,
})

const { storage } = createProrage({
  storage: localStorage,
  plugins: [expiresPlugin]
})

useExpires(1000, () => (storage.test = 'hello'))

console.log(storage.test) // hello
setTimeout(() => console.log(storage.test), 1001) // undefined
```

#### Options
| 参数 | 类型 | 默认值 | 说明 |
| :-: | :-: | :-: | :-: |
| primaryKey | string | `"#p_expires_"` | 有效期的键名, 含有该键名的对象将被认为是由该插件创建的对象 |
| multiplier | number | `24*60*60*1000` | 有效期的倍数, 默认值即一天 |

#### API
##### useExpire
```ts
function useExpire(fn: Function, expire: number): void
```

- `fn`: `fn` 中被赋值的数据将被设置有效期.
- `expires`: 有效期.

### objectsPlugin 对象类型支持扩展
增加更多特殊对象的支持, 该插件内置了 `Date`, `RegExp` 的支持.

```js
import { createProrage, objectsPlugin } from 'prorage'

const { storage } = createProrage({
  storage: localStorage,
  plugins: [objectsPlugin()]
})

storage.date = new Date()
storage.regexp = /hello/g
```

#### Options
| 参数 | 类型 | 默认值 | 说明 |
| :-: | :-: | :-: | :-: |
| primaryKey | string | `"#p_objects_"` | 有效期的键名, 含有该键名的对象将被认为是由该插件创建的对象 |
| adapter | ObjectAdapter | | 自定义读写转换 |

##### adapter
```js
import { createProrage, objectsPlugin, rawType } from 'prorage'

const { storage } = createProrage({
  storage: localStorage,
  plugins: [objectsPlugin({
    adapter: {
      Function: {
        writer: (value) => value.toString(),
        reader: (value) => new Function(`return ${value}`)(),
      },
    }
  })]
})

console.log(rawType(() => {})) // 'Function'
```
`adapter` 的键名可以调用 `rawType` 进行确认. 需提供 `writer`(写入), `reader`(读取) 两个函数对值进行转换.

除了内置的 `Date`, `RegExp` 之外, 其他特殊对象不推荐支持.

### primitivesPlugin 基础类型支持扩展
主要提供了 `BigInt` 的支持.

```js
import { primitivesPlugin } from 'prorage'

const { storage } = createProrage({
  storage: localStorage,
  plugins: [primitivesPlugin()]
})
```

#### Options
| 参数 | 类型 | 默认值 | 说明 |
| :-: | :-: | :-: | :-: |
| primaryKey | string | `"#p_primitives_"` | 有效期的键名, 含有该键名的对象将被认为是由该插件创建的对象 |
| adapter | PrimitivesAdapter | | 自定义读写转换 |

##### adapter
```js
import { createProrage, primitivesPlugin, typeOf } from 'prorage'

const { storage } = createProrage({
  storage: localStorage,
  plugins: [primitivesPlugin({
    adapter: {
      symbol: {
        writer: (value) => value.toString(),
        reader: (value) => {
          const _Symbol = (value) => typeof value ? value : Symbol(value)
          const _value = value.replace(/^Symbol\((.*)\)$/, '_Symbol($1)')

          return new Function('_Symbol', `return ${_value}`)(_Symbol)
        },
      },
    }
  })]
})

console.log(typeOf(() => {})) // object
```
`adapter` 的键名可以调用 `typeOf` 进行确认. 需提供 `writer`(写入), `reader`(读取) 两个函数对值进行转换.

除了内置的 `bigint` 之外, 其他不符合 **JSON** 标准的类型不推荐支持.

## Plugin 开发
```ts
type ProragePlugin = {
  writer?: Writer
  reader?: Reader
  getter?: Getter
  setter?: Setter
}

type Writer = (this: any, key: string, value: any) => any
type Reader = (this: any, key: string, value: any) => any
type Getter = (this: any, key: string | symbol, value: any) => any
type Setter = (this: any, key: string | symbol, value: any) => any
```

`prorage` 的参数 `plugins` 应传入 `ProragePlugin` 类型的数据. 具体可以参考内置的 `ProragePlugin`.

### 基础结构
`prorage` 将数据分为三种:
- **原始数据**, 即储存于 `storage` (比如 `localStorage`) 中的数据, 通常为字符串.
- **临时数据**, 储存在 `prorage` 内部的临时数据.
- **代理数据**, `prorage` 外部访问时得到的数据.

`ProragePlugin` 中的钩子在三者之间转换时调用:
- **原始数据** -- `JSON.parse` + `reader`  --> **临时数据** -- `getter` --> **代理数据**
- **原始数据** <-- `JSON.stringify` + `writer` -- **临时数据** <-- `setter` -- **代理数据**

### writer/getter
`writer` 作为 `JSON.stringify(value, replacer)` 的第二个参数 `replacer`. `reader` 作为 `JSON.parse(text, reviver)` 的第二个参数 `reviver`.

> `JSON.stringify` 的行为: 当对象中存在 `toJSON` 方法时, `replacer` 中访问的值将是 `toJSON` 返回值. 可以在 `replacer` 中通过 `this[key]` 获取到对象的原始值.

### getter/setter
`setter/getter` 则设计成与 `writer/reader` 相似, 但不同的是 `setter/getter` 中提供了一套 Hook 函数.

#### Hook 函数
```ts
import { usePaths, ProragePlugin } from 'prorage'

export default <ProragePlugin>{
  getter(key, value) {
    const paths = usePaths()
    /* ... */
    return value
  }
}
```

| 方法名 | 返回类型 | 说明 |
| :-: | :-: | :-: |
| useReceiver | any | 当前节点的代理对象 |
| usePaths | string[] | 当前节点完整的父路径 |
| useParent | any | 当前节点的父节点 |

- Hook 函数应在 `getter/setter` 中使用.
- `setter` 中 `useReceiver` 仅赋值操作的节点可以获取到对应的代理对象, 其他节点均为 `undefined`.

### 执行顺序
根据 `plugins` 数组的顺序, `writer` 与 `setter` 按顺序执行, `reader` 与 `getter` 按逆序执行.

## 数据类型支持情况

储存基于 `JSON.stringify` 与 `JSON.parse` 实现, 当前只支持标准 `JSON` 数据.

### 基础类型
| 数据类型 | 基础支持 | with primitivesPlugin |
| :-: | :-: | :-: |
| undefined | ✔️ | ✔️ |
| null | ✔️ | ✔️ |
| String | ✔️ | ✔️ |
| Boolean | ✔️ | ✔️ |
| Number | ✔️ | ✔️ |
| BigInt | ❌ | ✔️ |
| Symbol | ❌ | 可以勉强支持 |

### 引用类型
| 数据类型 | 基础支持 | with objectsPlugin | 说明 |
| :-: | :-: | :-: | :-: |
| 基础的 Object | ✔️ | ✔️ | |
| Array | ✔️ | ✔️ | |
| Date | ❌ | ✔️ | 计划支持 |
| RegExp | ❌ | ✔️ | 计划支持 |
| Function | ❌ | 可以勉强支持 | 会丢失作用域 |
| Set | ❌ | 可以做最基础的支持 | 与基础设计相性较差, 放弃支持 |
| Map | ❌ | 可以做最基础的支持 | 与基础设计相性较差, 放弃支持 |
| WeakSet | ❌ | ❌ | 没有实现的价值 |
| WeakMap | ❌ | ❌ | 没有实现的价值 |

使用 `symbol` 作为**键名**(Key)时, 通常将会被忽略. 若是作为根节点的键名, 则会在 `storage.setItem` 时抛出异常.
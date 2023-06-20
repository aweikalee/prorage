# Prorage 的构成

## 名词解释
- **Storage**: 由 `createStorage` 创建, 本质是为了更方便创建和使用 **Namespace**.
- **Namespace**: 由 `createNamespace` 创建, 是 `prorage` 的核心部分, **Plugin** 均在 **Namespace** 中被调用. 每个 **Namespace** 都在 `StorageLike` 上对应一个键名, 赋值在 **Namespace** 的值则会被转换为字符串保存在 `StorageLike` 的键值中.

## 实例结构

### Storage
```js
const baseStorage = {}
const reactiveStorage = reactive(baseStorage)
const storage = new Proxy(reactiveStorage, handler)
```

**Storage** 是一个空对象(`baseStorage`), 有两层 `Proxy`. 第一层是通过 `reactive` 使其具有响应. 第二层则是对 **Namespace** 的管理.

当访问 **Storage** 上的属性时, 当 `StorageLike` 上存在对应键名, 则返回对应的 **Namespace**. 赋值时则会赋值在对应 **Namespace** 上.

### Namespace
```js
const baseState = { value : undefined }
const reactiveState = reactive(baseState)
const state = new Proxy(reactiveState, handler)
const namespace = ref()
Object.defineProperties(namespace, {
  _value: {
    get: () => state.value,
    set: (value) => (state.value = value),
  },
})
```

**Namespace** 与 **Storage** 同样有两层 `Proxy`. 不同的是采用了仿 `ref` 的结构.

### toRaw 与 toProrageRaw
`toRaw` 是 Vue 提供的方法, 使用 `toRaw` 可以获得上文提到的 `baseStorage` 或 `baseState`.

`toProrageRaw`, 使用方法和 `toRaw` 一致, 可以获得 `reactiveStorage` 或 `reactiveState`. 通常仅在 **Plugin** 的开发中会使用到.

## 数据结构
数据分为三个部分:

- **持久储存数据**: 储存在 `StorageLike` 中的数据, 通常为字符串.
- **运行时数据**: `prorage` 内部使用的数据.
- **代理数据**: 外部访问时得到的数据, 通常**运行时数据**一致. 但在 `get` 阶段可以被改写.
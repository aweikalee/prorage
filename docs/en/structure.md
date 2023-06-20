# Prorage Structure

## Terminology
- **Storage**: created by `createStorage`, it is for the convenience of creating and using **Namespace**.
- **Namespace**: created by `createNamespace`, is `prorage` core, **Plugin** will be called by **Namespace**. Any **Namespace** will be found on `StorageLike`, assignment **Namespace** will be stringify and save to `StorageLike`.

## Instance Structure

### Storage
```js
const baseStorage = {}
const reactiveStorage = reactive(baseStorage)
const storage = new Proxy(reactiveStorage, handler)
```

**Storage** is a empty object(`baseStorage`), it has two `Proxy`. The first is made it reactive by `reactive`. The second is for managing **Namespace**.

When accessing the properties in **Storage**, if the key exists in `StorageLike`, the corresponding **Namespace** will be returned. When assigning a value, it will be assigned to the corresponding **Namespace**.

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

**Namespace** and **Storage** have two `Proxy` layers. The difference is that it uses a structure similar to `ref`.

### toRaw and toProrageRaw
`toRaw` is a method provided by Vue, using `toRaw` can get `baseStorage` or `baseState` mentioned above.

`toProrageRaw`, the usage is the same as `toRaw`, can get `reactiveStorage` or `reactiveState`. Usually only used in the development of **Plugin**.

## Data Structure
data has three parts:

- **Persistent Storage Data**: data stored in `StorageLike`, usually is string.
- **Runtime Data**: data used by `prorage`.
- **Proxy Data**: data accessed by external, usually the same as **Runtime Data**. But it can be rewritten in the `get` phase.

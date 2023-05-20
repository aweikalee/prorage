import {
  createProrage,
  createExpiresPlugin,
  primitivesPlugin,
  objectsPlugin,
} from '../lib'

const { plugin: expiresPlugin, useExpires } = createExpiresPlugin({
  multiplier: 1,
})

const { storage } = createProrage({
  storage: localStorage,
  plugins: [expiresPlugin, primitivesPlugin(), objectsPlugin()],
})

window.storage = storage

storage.foo = 'bar'

storage.bar = { test: 1 }

useExpires(1000, () => (storage.bar.test = 2))

console.log(storage.bar.test)

setTimeout(() => {
  console.log(storage.bar.test)
}, 1001)

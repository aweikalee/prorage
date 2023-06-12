import { createStorage, expiresPlugin, setExpires } from 'prorage'

export const storage = createStorage({
  plugins: [
    expiresPlugin({
      checkInterval: 'raf',
    }),
  ],
})

storage.foo = 'foo'

storage.bar = []
setExpires({ seconds: 3 })
storage.bar.push('bar')

setExpires({ seconds: 3 })
storage.fff = 123

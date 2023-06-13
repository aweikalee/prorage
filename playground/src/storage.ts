import {
  createStorage,
  expiresPlugin,
  setExpires,
  translatePlugin,
} from 'prorage'

export const storage = createStorage({
  prefix: 'test#',
  plugins: [
    expiresPlugin({
      checkInterval: 'raf',
    }),
    translatePlugin(),
  ],
})

addEventListener('storage', ({ key }) => storage.reload(key))

storage.normal = 'hello world'

storage.array = []
setExpires({ seconds: 3 })
storage.array.push('expires 3 seconds')
setExpires({ seconds: 10 })
storage.array.push('expires 10 seconds')

storage.translate = {
  BigInt: BigInt('123'),
  Date: new Date(2023, 6, 10),
  RegExp: /test/gi,
  Number: [NaN, Infinity, -Infinity],
}

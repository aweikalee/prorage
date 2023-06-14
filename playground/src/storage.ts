import {
  createStorage,
  expiresPlugin,
  useExpires,
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
storage.array.push(
  useExpires('expires 1 seconds', {
    seconds: 1,
  })
)
storage.array.unshift(
  useExpires('expires 2 seconds', {
    seconds: 2,
  })
)
storage.array.splice(
  0,
  0,
  useExpires('expires 3 seconds', {
    seconds: 3,
  })
)
storage.array[3] = useExpires('expires 10 seconds', {
  seconds: 10,
})

storage.translate = {
  BigInt: BigInt('123'),
  Date: new Date(2023, 6, 10),
  RegExp: /test/gi,
  Number: [NaN, Infinity, -Infinity],
}

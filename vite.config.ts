import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/index.ts'),
      name: 'prorage',
      fileName: 'prorage',
    },
  },

  plugins: [
    dts({
      entryRoot: 'lib',
      outputDir: 'types',
    }),
  ],
})

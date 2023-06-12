import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  return {
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
    },

    resolve: {
      alias:
        mode === 'development'
          ? {
              prorage: resolve(__dirname, '../lib/index.ts'),
              '@vue/reactivity': resolve(
                __dirname,
                '../node_modules/@vue/reactivity'
              ),
            }
          : {},
    },
  }
})

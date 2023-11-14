import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        util: 'rollup-plugin-node-polyfills/polyfills/util'
      }
    },
    plugins: [
      react(),
      NodeGlobalsPolyfillPlugin({
        process: true,
        buffer: true
      }),
      NodeModulesPolyfillPlugin()
    ]
  }
})

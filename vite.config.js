// vite.config.js
import vitePluginString from 'vite-plugin-string'

export default {
  base: process.env.NODE_ENV === 'production' ? '/threejs-pond/' : '',
  plugins: [
    vitePluginString()
  ]
}
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/feishu-api': {
        target: 'https://open.feishu.cn/open-apis',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/feishu-api/, '')
      },
      '/yuanqi-api': {
        target: 'https://yuanqi.tencent.com/openapi',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/yuanqi-api/, '')
      }
    }
  }
})


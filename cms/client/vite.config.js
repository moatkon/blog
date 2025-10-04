import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      // 代理静态资源到主项目的Astro服务器
      '^/(?!api|src|node_modules|@|__vite).*\\.(jpg|jpeg|png|gif|svg|webp|ico|pdf|mp4|webm|ogg|mp3|wav|flac|aac|woff|woff2|eot|ttf|otf)$': {
        target: 'http://localhost:4321',
        changeOrigin: true
      },
      // 代理其他可能的静态资源路径
      '^/images/': {
        target: 'http://localhost:4321',
        changeOrigin: true
      },
      '^/assets/': {
        target: 'http://localhost:4321',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})

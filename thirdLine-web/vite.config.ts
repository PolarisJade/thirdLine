import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 开发环境通过 Vite 代理转发 /user、/admin 到后端，规避跨域；
// 生产可用 VITE_API_BASE 指定后端地址。
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/user': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // 浏览器直接访问/刷新 /admin/** 页面时（Accept: text/html）交给 SPA 处理，
        // 避免页面文档请求被代理到后端导致返回 401 JSON 而非跳转登录页
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) {
            return req.url
          }
        },
      },
    },
  },
})

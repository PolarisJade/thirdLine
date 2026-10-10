import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite 配置
 * - dev 阶段把 /api 代理到后端 thirdLine-api（默认 http://localhost:8080），
 *   这样浏览器只访问同源地址，既能绕过跨域，也能正常读取
 *   X-Refresh-Token 续期响应头（同源下无 expose 限制）。
 * - 生产环境由 nginx 等把 /api 反向代理到后端即可，无需改前端代码。
 *   如需直连后端，把 .env.production 里的 VITE_API_BASE 改成完整域名。
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    // 与 tsconfig.json 的 paths 保持一致，否则构建时 @/ 无法解析
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          // 富文本编辑器体积较大，单独分包，避免拖慢用户端首屏
          editor: ['@wangeditor/editor', '@wangeditor/editor-for-react'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'axios'],
        },
      },
    },
  },
})

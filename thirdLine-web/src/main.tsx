import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { AuthProvider } from './contexts/AuthProvider'
import { ThemeProvider } from './contexts/ThemeProvider'
import { ToastProvider } from './components/ToastProvider'
import './styles/index.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error('找不到 #root 挂载点')
}

/**
 * 首屏加载动画（仓鼠跑轮）写在 index.html 里，好处是 React 还没起来就能显示，
 * 不会白屏；这里在应用真正挂载后把它淡出、移除。
 */
function SplashDismisser() {
  useEffect(() => {
    const splash = document.getElementById('app-splash')
    if (!splash) return

    splash.classList.add('is-leaving')
    // 淡出动画（index.html 里的 320ms transition）结束后再移除节点
    const timer = window.setTimeout(() => splash.remove(), 360)
    return () => window.clearTimeout(timer)
  }, [])

  return null
}

createRoot(container).render(
  <StrictMode>
    <SplashDismisser />
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)

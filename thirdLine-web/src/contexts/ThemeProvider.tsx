import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeContext, type ThemeContextValue } from './ThemeContext'
import { applyTheme, getInitialTheme, type ThemeMode } from '@/utils/theme'

/**
 * 主题：亮色（奶油暖调）/ 暗色（暖炭灰）切换。
 * 纯前端实现，写入 <html data-theme>，CSS 变量随之切换，不依赖后端接口。
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => getInitialTheme())

  useEffect(() => {
    applyTheme(mode)
  }, [mode])

  const setMode = useCallback((next: ThemeMode) => setModeState(next), [])

  const toggle = useCallback(() => {
    setModeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  const value = useMemo<ThemeContextValue>(() => ({ mode, toggle, setMode }), [mode, toggle, setMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

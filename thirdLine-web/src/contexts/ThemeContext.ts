import { createContext, useContext } from 'react'
import type { ThemeMode } from '@/utils/theme'

export interface ThemeContextValue {
  mode: ThemeMode
  /** 在 light / dark 之间切换 */
  toggle: () => void
  setMode: (mode: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme 必须在 <ThemeProvider> 内部使用')
  }
  return context
}

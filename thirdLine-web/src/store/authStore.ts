import { create } from 'zustand'
import type { UserVO } from '@/types'

/** localStorage 中存放 token / 用户信息的键（api/request.ts 与此保持一致） */
export const TOKEN_KEY = 'thirdline_token'
export const USER_KEY = 'thirdline_user'

interface AuthState {
  token: string | null
  user: UserVO | null
  /** 登录成功后写入 token 与用户信息 */
  setAuth: (token: string, user: UserVO) => void
  /** 仅更新用户信息（改资料后同步） */
  setUser: (user: UserVO) => void
  /** 退出登录 */
  logout: () => void
}

function readUser(): UserVO | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserVO
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: readUser(),

  setAuth: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ token, user })
  },

  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ user })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ token: null, user: null })
  },
}))

/** 是否已登录 */
export const isLoggedIn = () => !!useAuthStore.getState().token

/** 解析 JWT 负载，失败返回 null（token 为后端签发的标准 JWT，含 exp 过期时间） */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    // atob 仅按 Latin-1 解码，先逐字节转义再用 decodeURIComponent 还原 UTF-8，避免中文用户名等破坏解析
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * 判断 token 是否已过期：无 token、无法解析、或 exp 已到期均视为过期。
 * 供路由守卫在进入受保护页面前主动校验，避免仅依赖接口 401 的被动跳转。
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true
  const payload = decodeJwtPayload(token)
  const exp = payload?.exp
  if (typeof exp !== 'number') return true
  return Date.now() >= exp * 1000
}

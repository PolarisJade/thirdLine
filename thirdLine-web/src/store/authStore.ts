import { create } from 'zustand'
import type { UserVO } from '@/types'
import { TOKEN_KEY, USER_KEY } from '@/api/request'

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

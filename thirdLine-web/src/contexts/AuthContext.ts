import { createContext, useContext } from 'react'
import type { LoginDTO, RegisterDTO, UserVO } from '@/api'

export interface AuthContextValue {
  /** 当前登录用户，未登录为 null */
  user: UserVO | null
  /** 首屏是否仍在向后端校验登录态 */
  initializing: boolean
  /** 是否为管理员（role === 0） */
  isAdmin: boolean
  login: (dto: LoginDTO) => Promise<UserVO>
  register: (dto: RegisterDTO) => Promise<UserVO>
  logout: (redirectTo?: string) => void
  /** 重新拉取 /user/user/info 校准用户信息 */
  refresh: () => Promise<void>
  /** 本地更新用户信息（资料修改成功后同步到顶栏） */
  patchUser: (patch: Partial<UserVO>) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth 必须在 <AuthProvider> 内部使用')
  }
  return context
}

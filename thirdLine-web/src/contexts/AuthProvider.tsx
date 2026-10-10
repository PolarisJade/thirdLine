import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROLE_ADMIN, userApi, type LoginDTO, type RegisterDTO, type UserVO } from '@/api'
import { getStoredUser, getToken, setStoredUser, setToken, setUnauthorizedHandler } from '@/api/token'
import { AuthContext, type AuthContextValue } from './AuthContext'

/**
 * 登录态管理。
 *
 * 数据来源：
 *  - 登录 / 注册：POST /user/user/login、POST /user/user/register，返回 LoginVO{token,userInfo}
 *  - 登录态校验：GET /user/user/info（未登录返回 code 401，拦截器自动清理并跳转登录页）
 * token 用 localStorage 持久化，请求由 axios 请求拦截器统一带 Authorization: Bearer {token}。
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  /** 先用本地缓存的用户信息渲染，避免首屏头像/昵称闪烁 */
  const [user, setUser] = useState<UserVO | null>(() => (getToken() ? getStoredUser<UserVO>() : null))
  const [initializing, setInitializing] = useState<boolean>(() => Boolean(getToken()))

  const persist = useCallback((next: UserVO | null) => {
    setUser(next)
    setStoredUser(next)
  }, [])

  const logout = useCallback(
    (redirectTo?: string) => {
      setToken(null)
      persist(null)
      navigate(redirectTo ?? '/login', { replace: true })
    },
    [navigate, persist],
  )

  /** 401 统一处理：清理本地登录态并跳转登录页，带上回跳地址 */
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setStoredUser(null)
      const { pathname, search } = window.location
      const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
      const isAdminArea = pathname.startsWith('/admin')
      if (isAuthPage) return
      const target = isAdminArea ? '/admin/login' : '/login'
      navigate(`${target}?redirect=${encodeURIComponent(pathname + search)}`, { replace: true })
    })
    return () => setUnauthorizedHandler(null)
  }, [navigate])

  /** 首屏校验登录态：本地有 token 时向后端确认是否仍然有效 */
  useEffect(() => {
    let cancelled = false
    const token = getToken()

    if (!token) {
      setInitializing(false)
      return
    }

    userApi
      .info()
      .then((info) => {
        if (!cancelled) persist(info)
      })
      .catch(() => {
        // 401 已由拦截器统一处理；其它错误同样按未登录处理，避免卡在加载态
        if (!cancelled) {
          setToken(null)
          persist(null)
        }
      })
      .finally(() => {
        if (!cancelled) setInitializing(false)
      })

    return () => {
      cancelled = true
    }
  }, [persist])

  const login = useCallback(
    async (dto: LoginDTO) => {
      const result = await userApi.login(dto)
      setToken(result.token)
      persist(result.userInfo)
      return result.userInfo
    },
    [persist],
  )

  const register = useCallback(
    async (dto: RegisterDTO) => {
      const result = await userApi.register(dto)
      // 后端注册成功即自动登录，直接落 token
      setToken(result.token)
      persist(result.userInfo)
      return result.userInfo
    },
    [persist],
  )

  const refresh = useCallback(async () => {
    const info = await userApi.info()
    persist(info)
  }, [persist])

  const patchUser = useCallback(
    (patch: Partial<UserVO>) => {
      setUser((prev) => {
        if (!prev) return prev
        const next = { ...prev, ...patch }
        setStoredUser(next)
        return next
      })
    },
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      isAdmin: user?.role === ROLE_ADMIN,
      login,
      register,
      logout,
      refresh,
      patchUser,
    }),
    [user, initializing, login, register, logout, refresh, patchUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { isTokenExpired, useAuthStore } from '@/store/authStore'

/** 后台路由守卫：未登录或登录过期跳转登录页并记录来源；非管理员账号回首页 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const location = useLocation()

  // token 已过期时主动清理本地登录态（避免残留过期 token 反复触发守卫）
  useEffect(() => {
    if (token && isTokenExpired(token)) {
      logout()
    }
  }, [token, logout])

  // 无 token 或 token 已过期：跳转登录页，登录后回跳原目标页面
  if (!token || isTokenExpired(token)) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }
  // 普通注册用户不得进入管理后台（后端接口已同步拦截，这里避免页面裸奔）
  if (user?.role !== 0) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

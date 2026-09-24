import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'

/** 后台路由守卫：未登录跳转登录页并记录来源；非管理员账号回首页 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }
  // 普通注册用户不得进入管理后台（后端接口已同步拦截，这里避免页面裸奔）
  if (user?.role !== 0) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Icon } from '@/components/Icon'

/**
 * 需要登录才能访问的页面包装（前台）。
 * 未登录时跳转 /login，并把当前地址放进 redirect 参数，登录后自动回跳。
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (initializing) return
    if (!user) {
      const { pathname, search } = window.location
      navigate(`/login?redirect=${encodeURIComponent(pathname + search)}`, { replace: true })
    }
  }, [user, initializing, navigate])

  if (initializing) {
    return <FullScreenLoader text="正在校验登录状态…" />
  }

  if (!user) {
    // 跳转进行中，渲染占位避免闪一下页面内容
    return <FullScreenLoader text="正在前往登录页…" />
  }

  return <>{children}</>
}

/**
 * 管理端路由守卫。
 * 除登录态外还校验 role === 0（管理员），普通用户访问会被挡回前台首页。
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, initializing } = useAuth()
  const navigate = useNavigate()
  const deniedRef = useRef(false)

  useEffect(() => {
    if (initializing) return

    if (!user) {
      const { pathname, search } = window.location
      if (!deniedRef.current) {
        deniedRef.current = true
        navigate(`/admin/login?redirect=${encodeURIComponent(pathname + search)}`, { replace: true })
      }
      return
    }

    // 已登录但不是管理员：JwtInterceptor 会拒绝 /admin/** 请求，直接送回前台
    if (!isAdmin && !deniedRef.current) {
      deniedRef.current = true
      navigate('/', { replace: true })
    }
  }, [user, isAdmin, initializing, navigate])

  if (initializing) {
    return <FullScreenLoader text="正在校验管理员身份…" />
  }

  if (!user || !isAdmin) {
    return <FullScreenLoader text="没有管理权限，正在跳转…" />
  }

  return <>{children}</>
}

/** 全屏加载态：用于路由守卫生效前的过渡 */
function FullScreenLoader({ text }: { text: string }) {
  return (
    <div
      className="row"
      style={{
        minHeight: '100vh',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        color: 'var(--text-tertiary)',
        fontSize: 13.5,
      }}
    >
      <div className="spinner" />
      <div className="row" style={{ gap: 8 }}>
        <Icon name="refresh" size={15} />
        {text}
      </div>
    </div>
  )
}

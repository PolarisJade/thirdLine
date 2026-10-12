import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icon, type IconName } from '@/components/Icon'
import { Avatar } from '@/components/Form'
import { Button } from '@/components/Button'
import { RouteFallback } from '@/components/RouteFallback'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { danmakuApi } from '@/api'
import { cx } from '@/utils/format'
import { avatarPlaceholder, withFallback } from '@/utils/placeholder'

interface NavItem {
  to: string
  label: string
  icon: IconName
  end?: boolean
  /** 有内容需要处理的角标来源 */
  badge?: 'reports'
}

const NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: '概览',
    items: [{ to: '/admin', label: '数据看板', icon: 'dashboard', end: true }],
  },
  {
    title: '内容',
    items: [
      { to: '/admin/articles', label: '文章管理', icon: 'article' },
      { to: '/admin/categories', label: '分类管理', icon: 'folder' },
      { to: '/admin/tags', label: '标签管理', icon: 'tag' },
      { to: '/admin/tech-stacks', label: '技术栈管理', icon: 'code' },
      { to: '/admin/portfolio', label: '作品集管理', icon: 'grid' },
      { to: '/admin/photos', label: '相册管理', icon: 'image' },
      { to: '/admin/music', label: '音乐管理', icon: 'music' },
    ],
  },
  {
    title: '互动',
    items: [
      { to: '/admin/danmaku', label: '弹幕管理', icon: 'message' },
      { to: '/admin/reports', label: '举报处理', icon: 'flag', badge: 'reports' },
    ],
  },
  {
    title: '系统',
    items: [{ to: '/admin/settings', label: '账号设置', icon: 'settings' }],
  },
]

/**
 * 管理端布局：左侧导航 + 顶栏 + 内容区。
 * 所有 /admin/** 接口都由后端 JwtInterceptor 校验管理员身份。
 */
export function AdminLayout() {
  const { user, logout } = useAuth()
  const { mode, toggle } = useTheme()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingReports, setPendingReports] = useState(0)

  // 拉取待处理举报数，作为侧边栏角标
  useEffect(() => {
    let cancelled = false

    danmakuApi
      .reportPage(0, 1, 1)
      .then((result) => {
        if (!cancelled) setPendingReports(result.total)
      })
      .catch(() => {
        // 角标非关键功能，失败静默
      })

    return () => {
      cancelled = true
    }
  }, [pathname])

  // 路由变化后关闭移动端侧边栏
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const currentLabel = NAV_GROUPS.flatMap((group) => group.items).find((item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to),
  )?.label

  return (
    <div className="admin-shell">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="modal-mask"
          style={{ zIndex: 115, alignItems: 'stretch', padding: 0 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cx('admin-sidebar', sidebarOpen && 'admin-sidebar--open')}>
        <div className="admin-sidebar__brand">
          <span className="brand__mark">
            <Icon name="sparkles" size={18} strokeWidth={2} />
          </span>
          <span className="admin-sidebar__brand-text">
            <span className="admin-sidebar__brand-name">thirdLine</span>
            <span className="admin-sidebar__brand-tag">Admin</span>
          </span>
        </div>

        <nav className="admin-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="admin-nav__group-title">{group.title}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => cx('admin-nav__link', isActive && 'admin-nav__link--active')}
                >
                  <Icon name={item.icon} size={17} />
                  {item.label}
                  {item.badge === 'reports' && pendingReports > 0 && (
                    <span className="admin-nav__badge">{pendingReports > 99 ? '99+' : pendingReports}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-user">
            <Avatar
              size="sm"
              src={withFallback(user?.avatar, avatarPlaceholder(user?.username ?? 'admin'))}
              name={user?.nickname}
            />
            <span className="admin-user__text">
              <span className="admin-user__name">{user?.nickname || user?.username}</span>
              <span className="admin-user__role">管理员</span>
            </span>
          </div>

          <Button variant="ghost" size="sm" icon="logout" block onClick={() => logout('/admin/login')}>
            退出登录
          </Button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-sidebar-toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="打开侧边栏"
          >
            <Icon name="menu" size={19} />
          </button>

          <span className="admin-topbar__title">{currentLabel ?? '管理后台'}</span>

          <div className="admin-topbar__actions">
            <Button variant="ghost" size="sm" icon="external" onClick={() => window.open('/', '_blank')}>
              查看前台
            </Button>
            <button
              type="button"
              className="btn btn--ghost btn--icon"
              onClick={toggle}
              aria-label={mode === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
              title={mode === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
            >
              <Icon name={mode === 'light' ? 'moon' : 'sun'} size={18} />
            </button>
          </div>
        </header>

        <div className="admin-content">
          {/* 子路由都是 React.lazy：切页时先显示占位，避免内容区白屏 */}
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

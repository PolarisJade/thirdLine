import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { Avatar, Dropdown } from 'antd'
import { useAuthStore } from '@/store/authStore'

/** 前台公开布局：极简顶部导航 + 内容区 + 页脚（分类栏已移至首页文章列表上方） */
export default function PublicLayout() {
  const [keyword, setKeyword] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const isAdmin = user?.role === 0

  // 首页未滚动时导航透明悬浮在 hero 背景图上，滚过阈值后恢复实底
  const isHome = location.pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const onHero = isHome && !scrolled

  useEffect(() => {
    if (!isHome) {
      setScrolled(false)
      return
    }
    // 阈值与首页 hero 高度（39vh、最小 280px）对齐：波浪到达导航底部时恢复实底
    const onScroll = () => {
      const heroH = Math.max(window.innerHeight * 0.39, 280)
      setScrolled(window.scrollY > heroH - 64)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const kw = keyword.trim()
    navigate(kw ? `/search?keyword=${encodeURIComponent(kw)}` : '/')
  }

  const onLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  /** 悬浮在 hero 图上与实底导航下的按钮样式 */
  const ghostBtn = onHero
    ? 'rounded-md border border-white/60 bg-white/15 px-4 py-1.5 text-sm text-white backdrop-blur transition hover:bg-white/25'
    : 'rounded-md border border-line bg-surface px-4 py-1.5 text-sm text-charcoal transition hover:border-charcoal'
  const primaryBtn = onHero
    ? 'rounded-md border border-white bg-white px-4 py-1.5 text-sm text-ink transition hover:bg-white/85'
    : 'mui-btn-primary !py-1.5 !px-4 text-sm'

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header
        className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
          onHero ? 'border-transparent bg-transparent' : 'border-line bg-canvas/85 backdrop-blur'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6 px-6">
          <Link
            to="/"
            className={`font-serif text-2xl font-semibold tracking-tightest transition-colors ${
              onHero ? 'text-white' : 'text-ink'
            }`}
          >
            thirdLine
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-6 md:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `font-mono text-sm uppercase tracking-widest transition ${
                  onHero
                    ? isActive
                      ? 'text-white'
                      : 'text-white/75 hover:text-white'
                    : isActive
                      ? 'text-ink'
                      : 'text-muted hover:text-ink'
                }`
              }
            >
              首页
            </NavLink>
            <NavLink
              to="/album"
              className={({ isActive }) =>
                `font-mono text-sm uppercase tracking-widest transition ${
                  onHero
                    ? isActive
                      ? 'text-white'
                      : 'text-white/75 hover:text-white'
                    : isActive
                      ? 'text-ink'
                      : 'text-muted hover:text-ink'
                }`
              }
            >
              相册
            </NavLink>
            <NavLink
              to="/portfolio"
              className={({ isActive }) =>
                `font-mono text-sm uppercase tracking-widest transition ${
                  onHero
                    ? isActive
                      ? 'text-white'
                      : 'text-white/75 hover:text-white'
                    : isActive
                      ? 'text-ink'
                      : 'text-muted hover:text-ink'
                }`
              }
            >
              作品集
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <form onSubmit={onSearch} className="relative hidden sm:block">
              <MagnifyingGlass
                size={16}
                className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 ${
                  onHero ? 'text-white/80' : 'text-muted'
                }`}
              />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索文章"
                className={`h-9 w-40 rounded-md border pl-8 pr-3 text-sm outline-none transition focus:w-52 ${
                  onHero
                    ? 'border-white/40 bg-white/15 text-white placeholder:text-white/70 focus:border-white'
                    : 'border-line bg-surface text-charcoal focus:border-charcoal'
                }`}
              />
            </form>
            {/* 未登录：登录 + 注册；管理员：入口按钮；普通用户：头像 + 昵称下拉 */}
            {!user ? (
              <div className="flex items-center gap-3">
                <Link to="/register" className={ghostBtn}>
                  注册
                </Link>
                <Link to="/login" className={primaryBtn}>
                  登录
                </Link>
              </div>
            ) : isAdmin ? (
              <Link to="/admin/article" className={primaryBtn}>
                管理后台
              </Link>
            ) : (
              <Dropdown
                placement="bottomRight"
                menu={{
                  items: [{ key: 'logout', label: '退出登录' }],
                  onClick: ({ key }) => {
                    if (key === 'logout') onLogout()
                  },
                }}
              >
                <button
                  type="button"
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition ${
                    onHero
                      ? 'border-white/60 bg-white/15 text-white backdrop-blur hover:bg-white/25'
                      : 'border-line bg-surface text-charcoal hover:border-charcoal'
                  }`}
                >
                  <Avatar src={user.avatar || undefined} size={24} className="!bg-bone !text-charcoal">
                    {(user.nickname || user.username).slice(0, 1).toUpperCase()}
                  </Avatar>
                  <span className="max-w-[6rem] truncate">{user.nickname || user.username}</span>
                </button>
              </Dropdown>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* relative + 实底：保证首页固定背景图不会从页脚透出 */}
      <footer className="relative border-t border-line bg-canvas">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 py-10 text-muted sm:flex-row">
          <span className="font-serif text-lg text-ink">thirdLine</span>
          <span className="font-mono text-xs">
            © {new Date().getFullYear()} thirdLine · Powered by React
          </span>
        </div>
      </footer>
    </div>
  )
}

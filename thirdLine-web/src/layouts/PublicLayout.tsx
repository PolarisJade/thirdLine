import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { Avatar, Dropdown } from 'antd'
import { useAuthStore } from '@/store/authStore'
import { getCurrentUser } from '@/api/user'
import MusicPlayer from '@/components/MusicPlayer'
import logo from '@/assets/logo.png'

/** 前台公开布局：极简顶部导航 + 内容区（分类栏已移至首页文章列表上方） */
export default function PublicLayout() {
  const [keyword, setKeyword] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)
  const isAdmin = user?.role === 0

  // 打开页面时若本地存有 token，向后端校验登录态：
  // 成功则同步最新用户信息；401（未登录 / 过期）由拦截器清除登录态，右上角回到未登录
  useEffect(() => {
    if (!token) return
    getCurrentUser()
      .then(setUser)
      .catch(() => {
        // 401 已由请求拦截器调用 logout 清除登录态，这里静默处理
      })
  }, [token, setUser])

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

  /** 导航菜单项：加大加粗；选中时文字下方出现黑色圆角下划线（伪元素实现，不影响布局且带淡入淡出过渡）；
   *  注意：项目关闭了 preflight，伪元素必须显式声明 after:content-[''] 才有内容层，否则不渲染 */
  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `relative font-mono text-lg font-bold uppercase tracking-widest transition after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-[3px] after:rounded-full after:bg-ink after:content-[''] after:transition-opacity after:duration-200 ${
      isActive ? 'after:opacity-100' : 'after:opacity-0'
    } ${
      onHero
        ? isActive
          ? 'text-white'
          : 'text-white/75 hover:text-white'
        : isActive
          ? 'text-ink'
          : 'text-muted hover:text-ink'
    }`

  /** 悬浮在 hero 图上与实底导航下的按钮样式 */
  const ghostBtn = onHero
    ? 'rounded-md border border-white/60 bg-white/15 px-4 py-1.5 text-base text-white backdrop-blur transition hover:bg-white/25'
    : 'rounded-md border border-line bg-surface px-4 py-1.5 text-base text-charcoal transition hover:border-charcoal'
  const primaryBtn = onHero
    ? 'rounded-md border border-white bg-white px-4 py-1.5 text-base text-ink transition hover:bg-white/85'
    : 'mui-btn-primary !py-1.5 !px-4 text-base'

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header
        className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
          onHero ? 'border-transparent bg-transparent' : 'border-line bg-canvas/85 backdrop-blur'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6 px-6">
          <Link to="/" className="flex shrink-0 items-center">
            <img
              src={logo}
              alt="thirdLine"
              className={`h-10 w-auto transition duration-300 ${onHero ? 'brightness-0 invert' : ''}`}
            />
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-6 md:flex">
            <NavLink
              to="/"
              end
              className={navItemClass}
            >
              首页
            </NavLink>
            <NavLink
              to="/album"
              className={navItemClass}
            >
              相册
            </NavLink>
            <NavLink
              to="/portfolio"
              className={navItemClass}
            >
              作品集
            </NavLink>
            <NavLink
              to="/danmaku"
              className={navItemClass}
            >
              弹幕
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
                className={`h-9 w-40 rounded-md border pl-8 pr-3 text-base outline-none transition focus:w-52 ${
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
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-base transition ${
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

      {/* 全局悬浮音乐播放器：挂载于公开布局，切换前台路由不中断播放 */}
      <MusicPlayer />
    </div>
  )
}

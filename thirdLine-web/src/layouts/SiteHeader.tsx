import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { Avatar } from '@/components/Form'
import { ThemeSwitch } from '@/components/ThemeSwitch'
import { useAuth } from '@/contexts/AuthContext'
import { useScrolled } from '@/hooks/useAsync'
import { cx } from '@/utils/format'
import { avatarPlaceholder, withFallback } from '@/utils/placeholder'

/** 用户端主导航；与后端接口一一对应的页面 */
const NAV_ITEMS = [
  { to: '/', label: '首页', icon: 'home' as const },
  { to: '/articles', label: '文章', icon: 'article' as const },
  { to: '/portfolio', label: '作品集', icon: 'grid' as const },
  { to: '/gallery', label: '相册', icon: 'image' as const },
  { to: '/music', label: '音乐', icon: 'music' as const },
  { to: '/links', label: '友链', icon: 'link' as const },
  { to: '/about', label: '关于', icon: 'user' as const },
]

export function SiteHeader() {
  const { user, isAdmin, logout } = useAuth()
  const scrolled = useScrolled()
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭用户菜单
  useEffect(() => {
    if (!menuOpen) return

    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [menuOpen])

  // 移动端抽屉打开时锁定滚动
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      <header className={cx('site-header', scrolled && 'site-header--scrolled')}>
        <div className="site-header__inner">
          <Link to="/" className="brand" aria-label="返回首页">
            <span className="brand__mark">
              <Icon name="sparkles" size={19} strokeWidth={2} />
            </span>
            <span className="brand__text">
              <span className="brand__name">thirdLine</span>
              <span className="brand__tag">第三行</span>
            </span>
          </Link>

          <nav className="main-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => cx('main-nav__link', isActive && 'main-nav__link--active')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="site-header__actions">
            <ThemeSwitch />

            {user ? (
              <div className="user-menu" ref={menuRef}>
                <button
                  type="button"
                  className="user-menu__trigger"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  aria-expanded={menuOpen}
                >
                  <Avatar size="sm" src={withFallback(user.avatar, avatarPlaceholder(user.username))} name={user.nickname} />
                  <span className="user-menu__name">{user.nickname || user.username}</span>
                  <Icon name="chevronDown" size={13} />
                </button>

                {menuOpen && (
                  <div className="user-menu__dropdown glass glass--strong">
                    <div className="user-menu__head">
                      <span className="user-menu__head-name">{user.nickname || user.username}</span>
                      <span className="user-menu__head-mail">{user.email || '未填写邮箱'}</span>
                    </div>
                    <div className="user-menu__divider" />

                    <button
                      type="button"
                      className="user-menu__item"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate('/profile')
                      }}
                    >
                      <Icon name="user" size={16} />
                      个人中心
                    </button>

                    <button
                      type="button"
                      className="user-menu__item"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate('/profile?tab=security')
                      }}
                    >
                      <Icon name="settings" size={16} />
                      账号安全
                    </button>

                    {/* 后端 /admin/** 仅允许 role=0 的管理员，因此只对管理员展示入口 */}
                    {isAdmin && (
                      <button
                        type="button"
                        className="user-menu__item"
                        onClick={() => {
                          setMenuOpen(false)
                          navigate('/admin')
                        }}
                      >
                        <Icon name="dashboard" size={16} />
                        管理后台
                      </button>
                    )}

                    <div className="user-menu__divider" />

                    <button
                      type="button"
                      className="user-menu__item user-menu__item--danger"
                      onClick={() => {
                        setMenuOpen(false)
                        logout('/')
                      }}
                    >
                      <Icon name="logout" size={16} />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn--primary btn--sm">
                <Icon name="user" size={15} />
                登录
              </Link>
            )}

            <button
              type="button"
              className="nav-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="打开导航菜单"
            >
              <Icon name="menu" size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* 移动端导航抽屉 */}
      {mobileOpen && (
        <div className="mobile-nav" onClick={() => setMobileOpen(false)}>
          <div className="mobile-nav__panel glass glass--strong" onClick={(event) => event.stopPropagation()}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => cx('mobile-nav__link', isActive && 'mobile-nav__link--active')}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </NavLink>
            ))}

            <div className="user-menu__divider" />

            {user ? (
              <>
                <NavLink to="/profile" onClick={() => setMobileOpen(false)} className="mobile-nav__link">
                  <Icon name="user" size={18} />
                  个人中心
                </NavLink>
                {isAdmin && (
                  <NavLink to="/admin" onClick={() => setMobileOpen(false)} className="mobile-nav__link">
                    <Icon name="dashboard" size={18} />
                    管理后台
                  </NavLink>
                )}
                <button
                  type="button"
                  className="mobile-nav__link"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => {
                    setMobileOpen(false)
                    logout('/')
                  }}
                >
                  <Icon name="logout" size={18} />
                  退出登录
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="mobile-nav__link">
                <Icon name="user" size={18} />
                登录 / 注册
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}

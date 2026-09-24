import { useMemo } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Dropdown, Layout, Menu } from 'antd'
import {
  Article,
  NotePencil,
  SquaresFour,
  Tag as TagIcon,
  Images,
  Briefcase,
  UserCircle,
  SignOut,
  ArrowSquareOut,
} from '@phosphor-icons/react'
import { useAuthStore } from '@/store/authStore'

const { Sider, Header, Content } = Layout

/** 后台整体布局：左侧导航 + 顶部用户区 + 内容区 */
export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const items = useMemo(
    () => [
      { key: '/admin/article', icon: <Article size={18} weight="bold" />, label: '文章管理' },
      { key: '/admin/article/new', icon: <NotePencil size={18} weight="bold" />, label: '写文章' },
      { key: '/admin/category', icon: <SquaresFour size={18} weight="bold" />, label: '分类管理' },
      { key: '/admin/tag', icon: <TagIcon size={18} weight="bold" />, label: '标签管理' },
      { key: '/admin/photo', icon: <Images size={18} weight="bold" />, label: '相册管理' },
      { key: '/admin/portfolio', icon: <Briefcase size={18} weight="bold" />, label: '作品集管理' },
      { key: '/admin/profile', icon: <UserCircle size={18} weight="bold" />, label: '个人资料' },
    ],
    [],
  )

  // 选中项：编辑文章时高亮"文章管理"
  const selectedKey = location.pathname.startsWith('/admin/article/') && location.pathname !== '/admin/article/new'
    ? '/admin/article'
    : location.pathname

  const onLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <Layout className="min-h-screen">
      <Sider width={230} theme="light" className="!border-r border-line">
        <div className="flex h-16 items-center border-b border-line px-6">
          <Link to="/" className="font-serif text-xl font-semibold tracking-tightest text-ink">
            thirdLine
          </Link>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items}
          className="!border-none px-3 py-4"
          onClick={({ key }) => navigate(key)}
          style={{ fontSize: 14 }}
        />
      </Sider>

      <Layout>
        <Header className="!flex h-16 items-center justify-between !border-b border-line !bg-canvas !px-8">
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            Admin Console
          </span>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-1.5 font-mono text-xs text-muted transition hover:text-ink"
            >
              <ArrowSquareOut size={16} /> 前台
            </Link>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'profile',
                    label: '个人资料',
                    icon: <UserCircle size={16} />,
                    onClick: () => navigate('/admin/profile'),
                  },
                  { type: 'divider' },
                  {
                    key: 'logout',
                    label: '退出登录',
                    icon: <SignOut size={16} />,
                    onClick: onLogout,
                  },
                ],
              }}
              trigger={['click']}
            >
              <div className="flex cursor-pointer items-center gap-2">
                <Avatar
                  size={32}
                  src={user?.avatar || undefined}
                  style={{ background: '#111' }}
                >
                  {user?.nickname?.charAt(0) || 'U'}
                </Avatar>
                <span className="text-sm text-charcoal">{user?.nickname || user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="bg-bone p-8">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

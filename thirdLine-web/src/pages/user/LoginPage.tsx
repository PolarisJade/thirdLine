import { Link } from 'react-router-dom'
import { AuthCard } from '@/components/AuthCard'
import { Icon } from '@/components/Icon'
import { HERO_IMAGE } from '@/utils/placeholder'

const HIGHLIGHTS = [
  { icon: 'article' as const, text: '写下踩过的坑，让下次少走弯路' },
  { icon: 'grid' as const, text: '收藏做过的作品，看得见成长' },
  { icon: 'message' as const, text: '发一条弹幕，留下此刻的想法' },
]

/**
 * 登录页。
 *
 * 登录 / 注册是同一张翻转卡的两面，表单逻辑都在 {@link AuthCard} 里，
 * 这里只负责左侧氛围图、返回首页，以及决定卡片从哪一面开始。
 * 登录调用 POST /user/user/login，账号支持用户名或注册邮箱（后端 UserServiceImpl 已做兼容）。
 */
export function LoginPage() {
  return (
    <div className="auth-page">
      {/* ------------------------------------------------------------ 左侧氛围 */}
      <aside className="auth-aside">
        <div className="auth-aside__bg">
          <img src={HERO_IMAGE} alt="" aria-hidden="true" />
        </div>

        <div className="auth-aside__content">
          <span className="row" style={{ gap: 10 }}>
            <span className="brand__mark">
              <Icon name="sparkles" size={18} strokeWidth={2} />
            </span>
            <span style={{ fontSize: 17, fontWeight: 800 }}>thirdLine</span>
          </span>

          <h1 className="auth-aside__title">
            欢迎回到
            <br />
            第三条线
          </h1>

          <p className="auth-aside__desc">
            这里放着我的技术笔记、做过的项目，还有一些不想忘记的瞬间。
            登录后可以发弹幕、管理自己的资料。
          </p>

          <div className="auth-aside__points">
            {HIGHLIGHTS.map((item) => (
              <span className="auth-aside__point" key={item.text}>
                <Icon name={item.icon} size={16} />
                {item.text}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------ 右侧表单 */}
      <main className="auth-main">
        <div className="auth-doodle-column">
          <Link to="/" className="auth-doodle-back">
            <Icon name="chevronLeft" size={15} />
            返回首页
          </Link>
          <AuthCard initialMode="login" />
        </div>
      </main>
    </div>
  )
}

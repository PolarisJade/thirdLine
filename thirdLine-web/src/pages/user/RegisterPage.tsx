import { Link } from 'react-router-dom'
import { AuthCard } from '@/components/AuthCard'
import { Icon } from '@/components/Icon'
import { HERO_IMAGE } from '@/utils/placeholder'

const HIGHLIGHTS = [
  { icon: 'message' as const, text: '登录后可以发弹幕、参与互动' },
  { icon: 'user' as const, text: '维护自己的头像与昵称' },
  { icon: 'zap' as const, text: '注册即自动登录，无需二次填写' },
]

/**
 * 注册页。
 *
 * 登录 / 注册是同一张翻转卡的两面，表单逻辑都在 {@link AuthCard} 里，
 * 这里只负责左侧氛围图、返回首页，以及让卡片从注册面开始。
 * 流程：POST /user/user/email/code 发验证码 -> POST /user/user/register 注册（后端注册成功即返回 token）。
 */
export function RegisterPage() {
  return (
    <div className="auth-page">
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
            加入
            <br />
            第三行
          </h1>

          <p className="auth-aside__desc">用邮箱注册一个账号，就能在这里留下你的痕迹。</p>

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

      <main className="auth-main">
        <div className="auth-doodle-column">
          <Link to="/" className="auth-doodle-back">
            <Icon name="chevronLeft" size={15} />
            返回首页
          </Link>
          <AuthCard initialMode="register" />
        </div>
      </main>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastContext'
import { Button } from '@/components/Button'
import { Field, Input } from '@/components/Form'
import { Icon } from '@/components/Icon'
import { HERO_IMAGE } from '@/utils/placeholder'
import { errorMessage } from '@/utils/format'

const HIGHLIGHTS = [
  { icon: 'article' as const, text: '写下踩过的坑，让下次少走弯路' },
  { icon: 'grid' as const, text: '收藏做过的作品，看得见成长' },
  { icon: 'message' as const, text: '发一条弹幕，留下此刻的想法' },
]

/**
 * 登录页。
 * 调用 POST /user/user/login，账号支持用户名或注册邮箱（后端 UserServiceImpl 已做兼容）。
 */
export function LoginPage() {
  const { login, user, initializing } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirect = searchParams.get('redirect') || '/'

  // 已登录用户直接跳走，避免停留在登录页
  useEffect(() => {
    if (!initializing && user) {
      navigate(redirect.startsWith('/login') ? '/' : redirect, { replace: true })
    }
  }, [user, initializing, navigate, redirect])

  const submit = async () => {
    if (!username.trim() || !password) {
      setError('请输入用户名和密码')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const info = await login({ username: username.trim(), password })
      toast.success(`欢迎回来，${info.nickname || info.username}`)

      // 管理员登录后默认进后台
      if (info.role === 0 && redirect === '/') {
        navigate('/admin', { replace: true })
      } else {
        navigate(redirect, { replace: true })
      }
    } catch (submitError) {
      setError(errorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

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
        <div className="auth-card glass glass--strong">
          <Link to="/" className="row text-sm text-muted" style={{ gap: 6, marginBottom: 'var(--space-5)' }}>
            <Icon name="chevronLeft" size={15} />
            返回首页
          </Link>

          <h2 className="auth-card__title">登录</h2>
          <p className="auth-card__subtitle">用用户名或注册邮箱都可以登录</p>

          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault()
              void submit()
            }}
          >
            <Field label="账号" required>
              <Input
                icon="user"
                placeholder="用户名或邮箱"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </Field>

            <Field label="密码" required error={error ?? undefined}>
              <Input
                icon="lock"
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                suffix={
                  <Button
                    variant="ghost"
                    iconOnly
                    size="sm"
                    icon={showPassword ? 'eyeOff' : 'eye'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                    type="button"
                  />
                }
              />
            </Field>

            <Button type="submit" variant="primary" size="lg" block loading={submitting}>
              登录
            </Button>
          </form>

          <div className="auth-card__switch">
            还没有账号？{' '}
            <Link
              to={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="auth-link"
            >
              立即注册
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

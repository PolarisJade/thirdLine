import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { userApi } from '@/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastContext'
import { Button } from '@/components/Button'
import { Field, Input } from '@/components/Form'
import { Icon } from '@/components/Icon'
import { HERO_IMAGE } from '@/utils/placeholder'
import { errorMessage } from '@/utils/format'

/** 与后端 UserServiceImpl / EmailCodeService 的校验规则保持一致 */
const USERNAME_MIN = 3
const USERNAME_MAX = 20
const PASSWORD_MIN = 6
const EMAIL_PATTERN = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/
/** 邮箱验证码发送间隔，后端默认 60 秒 */
const CODE_COOLDOWN = 60

const HIGHLIGHTS = [
  { icon: 'message' as const, text: '登录后可以发弹幕、参与互动' },
  { icon: 'user' as const, text: '维护自己的头像与昵称' },
  { icon: 'zap' as const, text: '注册即自动登录，无需二次填写' },
]

/**
 * 注册页。
 * 流程：POST /user/user/email/code 发验证码 -> POST /user/user/register 注册（后端注册成功即返回 token）。
 */
export function RegisterPage() {
  const { register, user, initializing } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [cooldown, setCooldown] = useState(0)
  const [sendingCode, setSendingCode] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const timerRef = useRef<number | null>(null)
  const redirect = searchParams.get('redirect') || '/'

  /** 验证码倒计时 */
  useEffect(() => {
    if (cooldown <= 0) return

    timerRef.current = window.setTimeout(() => setCooldown((prev) => prev - 1), 1000)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [cooldown])

  useEffect(() => {
    if (!initializing && user) navigate(redirect, { replace: true })
  }, [user, initializing, navigate, redirect])

  /** 前端先做一遍校验，减少无效请求 */
  const validate = (): boolean => {
    const next: Record<string, string> = {}

    if (!EMAIL_PATTERN.test(email.trim())) next.email = '请输入正确的邮箱地址'
    if (!code.trim()) next.code = '请输入邮箱验证码'
    if (username.trim().length < USERNAME_MIN || username.trim().length > USERNAME_MAX) {
      next.username = `用户名长度需在 ${USERNAME_MIN}-${USERNAME_MAX} 个字符之间`
    }
    if (password.length < PASSWORD_MIN) next.password = `密码长度不能少于 ${PASSWORD_MIN} 位`
    if (password !== confirm) next.confirm = '两次输入的密码不一致'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const sendCode = async () => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setErrors((prev) => ({ ...prev, email: '请先填写正确的邮箱地址' }))
      return
    }

    setSendingCode(true)
    try {
      await userApi.sendEmailCode(email.trim().toLowerCase())
      toast.success('验证码已发送，请查收邮件（5 分钟内有效）')
      setCooldown(CODE_COOLDOWN)
      setErrors((prev) => ({ ...prev, email: '' }))
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setSendingCode(false)
    }
  }

  const submit = async () => {
    if (!validate()) return

    setSubmitting(true)
    try {
      const info = await register({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        username: username.trim(),
        password,
        nickname: nickname.trim() || undefined,
      })
      toast.success(`注册成功，欢迎你，${info.nickname || info.username}`)
      navigate(redirect, { replace: true })
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

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
            第三条线
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
        <div className="auth-card glass glass--strong">
          <Link to="/" className="row text-sm text-muted" style={{ gap: 6, marginBottom: 'var(--space-5)' }}>
            <Icon name="chevronLeft" size={15} />
            返回首页
          </Link>

          <h2 className="auth-card__title">注册</h2>
          <p className="auth-card__subtitle">需要邮箱验证码，注册成功后会直接登录</p>

          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault()
              void submit()
            }}
          >
            <Field label="邮箱" required error={errors.email}>
              <Input
                icon="mail"
                type="email"
                placeholder="用于接收验证码"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                suffix={
                  <button
                    type="button"
                    className="code-btn"
                    disabled={cooldown > 0 || sendingCode}
                    onClick={() => void sendCode()}
                  >
                    {sendingCode ? '发送中…' : cooldown > 0 ? `${cooldown}s 后重发` : '获取验证码'}
                  </button>
                }
              />
            </Field>

            <Field label="邮箱验证码" required error={errors.code} hint="验证码 5 分钟内有效，仅可使用一次">
              <Input
                icon="check"
                placeholder="请输入邮件里的验证码"
                value={code}
                maxLength={12}
                onChange={(event) => setCode(event.target.value)}
              />
            </Field>

            <Field label="用户名" required error={errors.username} hint={`${USERNAME_MIN}-${USERNAME_MAX} 个字符，注册后不可修改`}>
              <Input
                icon="user"
                placeholder="用于登录的账号名"
                autoComplete="username"
                value={username}
                maxLength={USERNAME_MAX}
                onChange={(event) => setUsername(event.target.value)}
              />
            </Field>

            <Field label="昵称" hint="选填，不填则默认使用用户名">
              <Input
                icon="heart"
                placeholder="展示给别人的名字"
                value={nickname}
                maxLength={20}
                onChange={(event) => setNickname(event.target.value)}
              />
            </Field>

            <Field label="密码" required error={errors.password} hint={`至少 ${PASSWORD_MIN} 位`}>
              <Input
                icon="lock"
                type={showPassword ? 'text' : 'password'}
                placeholder="设置登录密码"
                autoComplete="new-password"
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

            <Field label="确认密码" required error={errors.confirm}>
              <Input
                icon="lock"
                type={showPassword ? 'text' : 'password'}
                placeholder="再输入一次密码"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </Field>

            <Button type="submit" variant="primary" size="lg" block loading={submitting}>
              注册并登录
            </Button>
          </form>

          <div className="auth-card__switch">
            已经有账号了？{' '}
            <Link
              to={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="auth-link"
            >
              去登录
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

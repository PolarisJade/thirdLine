import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { userApi } from '@/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastContext'
import { cx, errorMessage } from '@/utils/format'

type Mode = 'login' | 'register'

/** 与后端 UserServiceImpl / EmailCodeService 的校验规则保持一致 */
const USERNAME_MIN = 3
const USERNAME_MAX = 20
const PASSWORD_MIN = 6
const EMAIL_PATTERN = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/
/** 邮箱验证码发送间隔，后端默认 60 秒 */
const CODE_COOLDOWN = 60
/** 翻面时长，跟 auth-doodle.css 里 .doodle-card-inner 的 transition 对齐 */
const FLIP_MS = 800

/**
 * 登录 / 注册翻转卡片。
 *
 * 左边是登录，右边是注册，顶上那个手绘开关负责翻面（也可以直接点「登录 / 注册」文字）。
 * 两张表单的校验、验证码倒计时、登录后跳转（管理员进后台）都保持原有行为。
 *
 * 路由同步：/login 和 /register 仍是两个路由，卡片会按当前路由决定初始卡面。
 * 因为两个路由是两个页面组件，改 URL 会重挂载本组件，所以翻面动画播完（FLIP_MS）
 * 才更新地址栏，否则动画会被重挂载掐断；这样刷新和直接打开链接也都落在正确的卡面。
 */
export function AuthCard({ initialMode }: { initialMode: Mode }) {
  const { login, register, user, initializing } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [mode, setMode] = useState<Mode>(initialMode)
  const flipTimerRef = useRef<number | null>(null)
  /** 开关的 id 用 useId 生成：同一页万一渲染两张卡也不会撞 id */
  const flipId = useId()

  /* ---------------------------------------------------------------- 登录 */
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loggingIn, setLoggingIn] = useState(false)

  /* ---------------------------------------------------------------- 注册 */
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [sendingCode, setSendingCode] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  /** 带上 redirect 参数，翻面和跳转都不丢 */
  const backTo = redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''
  const firstError = Object.values(errors).find(Boolean) ?? null

  // 已登录用户不要停在登录 / 注册页
  useEffect(() => {
    if (initializing || !user) return
    const target = redirect.startsWith('/login') || redirect.startsWith('/register') ? '/' : redirect
    navigate(target, { replace: true })
  }, [user, initializing, navigate, redirect])

  // 从别处导航进来（页头的「登录 / 注册」）时同步卡面
  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  // 验证码倒计时
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((prev) => prev - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  // 卸载时清掉还没执行的翻面跳转
  useEffect(
    () => () => {
      if (flipTimerRef.current) window.clearTimeout(flipTimerRef.current)
    },
    [],
  )

  const goTo = (next: Mode) => {
    if (next === mode) return
    setMode(next)
    if (flipTimerRef.current) window.clearTimeout(flipTimerRef.current)
    flipTimerRef.current = window.setTimeout(() => {
      navigate(`/${next === 'login' ? 'login' : 'register'}${backTo}`, { replace: true })
    }, FLIP_MS)
  }

  /** 用户改了某个字段就把它的报错清掉，别让红描边一直挂着 */
  const clearError = (key: string) => {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev))
  }

  const submitLogin = async () => {
    if (!account.trim() || !password) {
      setLoginError('请输入账号和密码')
      return
    }

    setLoggingIn(true)
    setLoginError(null)
    try {
      const info = await login({ username: account.trim(), password })
      toast.success(`欢迎回来，${info.nickname || info.username}`)

      // 管理员登录后默认进后台
      if (info.role === 0 && redirect === '/') {
        navigate('/admin', { replace: true })
      } else {
        navigate(redirect, { replace: true })
      }
    } catch (error) {
      setLoginError(errorMessage(error))
    } finally {
      setLoggingIn(false)
    }
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

  const submitRegister = async () => {
    // 前端先校验一遍，减少无效请求
    const next: Record<string, string> = {}
    if (!EMAIL_PATTERN.test(email.trim())) next.email = '请输入正确的邮箱地址'
    if (!code.trim()) next.code = '请输入邮箱验证码'
    if (username.trim().length < USERNAME_MIN || username.trim().length > USERNAME_MAX) {
      next.username = `用户名长度需在 ${USERNAME_MIN}-${USERNAME_MAX} 个字符之间`
    }
    if (newPassword.length < PASSWORD_MIN) next.password = `密码长度不能少于 ${PASSWORD_MIN} 位`
    if (newPassword !== confirm) next.confirm = '两次输入的密码不一致'

    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    setRegistering(true)
    try {
      const info = await register({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        username: username.trim(),
        password: newPassword,
        nickname: nickname.trim() || undefined,
      })
      toast.success(`注册成功，欢迎你，${info.nickname || info.username}`)
      navigate(redirect, { replace: true })
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="doodle-wrapper">
      {/* 翻转的驱动源：受控 checkbox，键盘也能切换 */}
      <input
        type="checkbox"
        id={flipId}
        className="doodle-toggle"
        checked={mode === 'register'}
        onChange={() => goTo(mode === 'register' ? 'login' : 'register')}
        aria-label="切换登录与注册"
      />

      <div className="doodle-header">
        <button type="button" className="doodle-mode-text login-text" onClick={() => goTo('login')}>
          登录
        </button>
        <label className="doodle-switch-label" htmlFor={flipId}>
          <span className="doodle-switch-handle" />
        </label>
        <button type="button" className="doodle-mode-text signup-text" onClick={() => goTo('register')}>
          注册
        </button>
      </div>

      <div className="doodle-card-scene">
        {/* 三处手绘装饰 */}
        <svg
          className="doodle-svg doodle-star"
          viewBox="0 0 24 24"
          fill="#ffd166"
          stroke="var(--ink)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <svg
          className="doodle-svg doodle-sparkle"
          viewBox="0 0 24 24"
          fill="#06d6a0"
          stroke="var(--ink)"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M12 2 Q12 12 22 12 Q12 12 12 22 Q12 12 2 12 Q12 12 12 2 Z" />
        </svg>
        <svg
          className="doodle-svg doodle-swirl"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M3 12 C 3 5 10 5 16 5 C 20 5 21 9 18 12 C 15 15 10 13 12 9 C 14 5 22 9 21 16" />
        </svg>

        <div className="doodle-card-inner">
          {/* -------------------------------------------------------- 登录面 */}
          <div className="doodle-card-front">
            <div className="doodle-title">欢迎回来</div>

            <form
              className="doodle-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault()
                void submitLogin()
              }}
            >
              <div className="doodle-input-wrapper">
                <input
                  className="doodle-input"
                  name="username"
                  type="text"
                  placeholder="用户名 / 邮箱"
                  aria-label="用户名或邮箱"
                  autoComplete="username"
                  value={account}
                  onChange={(event) => setAccount(event.target.value)}
                />
              </div>

              <div className="doodle-input-wrapper">
                <input
                  className="doodle-input doodle-input--suffix"
                  name="password"
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="密码"
                  aria-label="密码"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="doodle-eye"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  aria-label={showLoginPassword ? '隐藏密码' : '显示密码'}
                >
                  {showLoginPassword ? '隐藏' : '显示'}
                </button>
              </div>

              {loginError && (
                <p className="doodle-error" role="alert">
                  {loginError}
                </p>
              )}

              <button className="doodle-btn" type="submit" disabled={loggingIn}>
                {loggingIn ? '登录中…' : '登录'}
              </button>
            </form>
          </div>

          {/* -------------------------------------------------------- 注册面 */}
          <div className="doodle-card-back">
            <div className="doodle-title doodle-title-alt">加入我们</div>

            <form
              className="doodle-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault()
                void submitRegister()
              }}
            >
              <div className="doodle-input-wrapper">
                <input
                  className={cx('doodle-input', errors.email && 'doodle-input--error')}
                  name="email"
                  type="email"
                  placeholder="邮箱（收验证码）"
                  aria-label="邮箱"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    clearError('email')
                  }}
                />
              </div>

              <div className="doodle-field-row">
                <input
                  className={cx('doodle-input', errors.code && 'doodle-input--error')}
                  name="code"
                  type="text"
                  placeholder="验证码"
                  aria-label="邮箱验证码"
                  maxLength={12}
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value)
                    clearError('code')
                  }}
                />
                <button
                  type="button"
                  className="doodle-code-btn"
                  disabled={cooldown > 0 || sendingCode}
                  title={cooldown > 0 ? '验证码已发送，请稍后重发' : '发送验证码到上面的邮箱'}
                  onClick={() => void sendCode()}
                >
                  {sendingCode ? '发送中' : cooldown > 0 ? `${cooldown}s` : '获取验证码'}
                </button>
              </div>

              <div className="doodle-input-wrapper">
                <input
                  className={cx('doodle-input', errors.username && 'doodle-input--error')}
                  name="username"
                  type="text"
                  placeholder={`用户名（${USERNAME_MIN}-${USERNAME_MAX} 字符）`}
                  aria-label="用户名"
                  autoComplete="username"
                  maxLength={USERNAME_MAX}
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value)
                    clearError('username')
                  }}
                />
              </div>

              <div className="doodle-input-wrapper">
                <input
                  className="doodle-input"
                  name="nickname"
                  type="text"
                  placeholder="昵称（选填）"
                  aria-label="昵称，选填"
                  maxLength={20}
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                />
              </div>

              <div className="doodle-input-wrapper">
                <input
                  className={cx('doodle-input', 'doodle-input--suffix', errors.password && 'doodle-input--error')}
                  name="new-password"
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder={`密码（至少 ${PASSWORD_MIN} 位）`}
                  aria-label="密码"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value)
                    clearError('password')
                  }}
                />
                <button
                  type="button"
                  className="doodle-eye"
                  onClick={() => setShowRegPassword((prev) => !prev)}
                  aria-label={showRegPassword ? '隐藏密码' : '显示密码'}
                >
                  {showRegPassword ? '隐藏' : '显示'}
                </button>
              </div>

              <div className="doodle-input-wrapper">
                <input
                  className={cx('doodle-input', errors.confirm && 'doodle-input--error')}
                  name="confirm-password"
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="再输一次密码"
                  aria-label="确认密码"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => {
                    setConfirm(event.target.value)
                    clearError('confirm')
                  }}
                />
              </div>

              {firstError && (
                <p className="doodle-error" role="alert">
                  {firstError}
                </p>
              )}

              <button className="doodle-btn doodle-btn-alt" type="submit" disabled={registering}>
                {registering ? '注册中…' : '注册并登录'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

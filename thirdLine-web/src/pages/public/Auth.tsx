import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Form, Input, message } from 'antd'
import { login, register, sendEmailCode } from '@/api/user'
import { useAuthStore } from '@/store/authStore'
import type { LoginDTO, RegisterDTO } from '@/types'
import heroBg from '@/assets/首页背景.jpg'

const EMAIL_PATTERN = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/

type AuthMode = 'login' | 'register'

/**
 * 用户端登录 / 注册合一页：
 * 卡片顶部分段标签点击切换两种表单；/login 与 /register 路径分别对应初始视图。
 */
export default function Auth() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialMode: AuthMode = location.pathname === '/register' ? 'register' : 'login'
  const [mode, setMode] = useState<AuthMode>(initialMode)
  // 切换动画阶段：in 淡入展示 / out 淡出，结束后再替换表单并淡入，形成交叉渐变
  const [phase, setPhase] = useState<'in' | 'out'>('in')
  const pendingMode = useRef<AuthMode | null>(null)

  const setAuth = useAuthStore((s) => s.setAuth)
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'

  // ---- 登录表单 ----
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginForm] = Form.useForm<LoginDTO>()

  // ---- 注册表单 ----
  const [registerForm] = Form.useForm<RegisterDTO & { confirmPassword?: string }>()
  const [registerLoading, setRegisterLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<number>()

  // 组件卸载时清理倒计时定时器
  useEffect(() => () => window.clearInterval(timerRef.current), [])

  // 两个路径复用同一组件实例，外部导航到 /login 或 /register 时同步切换视图（直接替换，不走淡出）
  useEffect(() => {
    const next: AuthMode = location.pathname === '/register' ? 'register' : 'login'
    setMode((prev) => {
      if (prev !== next) {
        // 外部导航打断淡出动画时，清空挂起状态，避免标签被锁死
        pendingMode.current = null
        setPhase('in')
      }
      return next
    })
  }, [location.pathname])

  const startCountdown = (seconds = 60) => {
    setCountdown(seconds)
    timerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const switchMode = (next: AuthMode) => {
    // 已在目标视图或淡出动画进行中，不重复触发
    if (next === mode || pendingMode.current) return
    pendingMode.current = next
    setPhase('out')
  }

  /** 淡出动画结束：提交模式切换、同步地址栏，再播放淡入 */
  const onFadeOutEnd = () => {
    const next = pendingMode.current
    if (phase !== 'out' || !next) return
    pendingMode.current = null
    setMode(next)
    setPhase('in')
    navigate(next === 'register' ? '/register' : '/login', { replace: true })
  }

  const onLoginFinish = async (values: LoginDTO) => {
    setLoginLoading(true)
    try {
      const data = await login(values)
      setAuth(data.token, data.userInfo)
      navigate(from, { replace: true })
    } catch {
      // 错误提示由拦截器处理
    } finally {
      setLoginLoading(false)
    }
  }

  /** 先校验邮箱格式与是否已填，再请求发送验证码；发送中防重复点击 */
  const onSendCode = async () => {
    if (sending) return
    try {
      const { email } = await registerForm.validateFields(['email'])
      setSending(true)
      await sendEmailCode(email.trim())
      message.success('验证邮件已发送，请注意查收')
      startCountdown()
    } catch {
      // 校验失败或接口错误提示均已处理
    } finally {
      setSending(false)
    }
  }

  const onRegisterFinish = async (values: RegisterDTO) => {
    setRegisterLoading(true)
    try {
      const data = await register(values)
      setAuth(data.token, data.userInfo)
      message.success('注册成功，已自动登录')
      navigate('/', { replace: true })
    } catch {
      // 错误提示由拦截器处理
    } finally {
      setRegisterLoading(false)
    }
  }

  const isLogin = mode === 'login'

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-6 py-16">
      {/* 背景图：复用首页主视觉，轻压暗遮罩保证白色标题与卡片可读 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-charcoal bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/30" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-semibold tracking-tightest text-white">
            {isLogin ? '欢迎回来' : '创建账号'}
          </h1>
          <p className="mt-3 font-mono text-xs uppercase tracking-widest text-white/70">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </p>
        </div>

        <div className="mui-card p-8">
          {/* 分段切换标签：点击在登录 / 注册表单间切换 */}
          <div className="mb-6 flex rounded-lg bg-surface p-1">
            {(
              [
                { key: 'login', label: '登录' },
                { key: 'register', label: '注册' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => switchMode(tab.key)}
                className={`flex-1 cursor-pointer rounded-md py-1.5 text-sm transition-colors ${
                  mode === tab.key ? 'bg-ink text-white' : 'text-muted hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 切换时先淡出再淡入；antd 表单值存在 form store 中，不会因切换丢失 */}
          <div
            key={mode}
            className={phase === 'out' ? 'auth-fade-out' : 'auth-fade-in'}
            onAnimationEnd={onFadeOutEnd}
          >
            {isLogin ? (
              <Form
                form={loginForm}
                layout="horizontal"
                colon={false}
                labelAlign="left"
                labelCol={{ flex: '4em' }}
                wrapperCol={{ flex: 1 }}
                onFinish={onLoginFinish}
                requiredMark={false}
                size="large"
              >
              <Form.Item
                label="账号"
                name="username"
                rules={[{ required: true, message: '请输入用户名或邮箱' }]}
              >
                <Input placeholder="用户名或注册邮箱" autoComplete="username" />
              </Form.Item>
              <Form.Item
                label="密码"
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password placeholder="密码" autoComplete="current-password" />
              </Form.Item>
                <Form.Item
                  className="!mb-0 mt-2"
                  labelCol={{ span: 0 }}
                  wrapperCol={{ span: 24 }}
                >
                  <Button type="primary" htmlType="submit" block loading={loginLoading}>
                    登录
                  </Button>
                </Form.Item>
              </Form>
            ) : (
              <Form
                form={registerForm}
                layout="horizontal"
                colon={false}
                labelAlign="left"
                labelCol={{ flex: '4em' }}
                wrapperCol={{ flex: 1 }}
                onFinish={onRegisterFinish}
                requiredMark={false}
                size="large"
              >
                <Form.Item
                  label="邮箱"
                  name="email"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { pattern: EMAIL_PATTERN, message: '邮箱格式不正确' },
                  ]}
                >
                  <Input placeholder="用于接收验证码" autoComplete="email" />
                </Form.Item>
                <Form.Item
                  label="验证码"
                  name="code"
                  rules={[{ required: true, message: '请输入邮箱验证码' }]}
                >
                  {/* 发送按钮内嵌到输入框后缀，保证与其他字段一样标签、输入框同行 */}
                  <Input
                    placeholder="6 位验证码"
                    maxLength={6}
                    autoComplete="one-time-code"
                    suffix={
                      countdown > 0 ? (
                        <span className="text-xs text-muted">{countdown}s 后重发</span>
                      ) : (
                        <span
                          className={`cursor-pointer whitespace-nowrap text-sm text-ink transition-opacity hover:opacity-60 ${
                            sending ? 'pointer-events-none opacity-50' : ''
                          }`}
                          onClick={onSendCode}
                        >
                          {sending ? '发送中…' : '获取验证码'}
                        </span>
                      )
                    }
                  />
                </Form.Item>
                <Form.Item
                  label="用户名"
                  name="username"
                  rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 3, max: 20, message: '用户名长度需在 3-20 个字符之间' },
                  ]}
                >
                  <Input placeholder="登录时使用" autoComplete="username" />
                </Form.Item>
                <Form.Item label="昵称" name="nickname">
                  <Input placeholder="展示昵称，选填，默认为用户名" maxLength={30} />
                </Form.Item>
                <Form.Item
                  label="密码"
                  name="password"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码长度不能少于 6 位' },
                  ]}
                >
                  <Input.Password placeholder="至少 6 位" autoComplete="new-password" />
                </Form.Item>
                <Form.Item
                  label="确认密码"
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请再次输入密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve()
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'))
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="再次输入密码" autoComplete="new-password" />
                </Form.Item>
                <Form.Item
                  className="!mb-0 mt-2"
                  labelCol={{ span: 0 }}
                  wrapperCol={{ span: 24 }}
                >
                  <Button type="primary" htmlType="submit" block loading={registerLoading}>
                    注册
                  </Button>
                </Form.Item>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

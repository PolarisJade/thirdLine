import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ROLE_ADMIN } from '@/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastContext'
import { Button } from '@/components/Button'
import { Field, Input } from '@/components/Form'
import { Icon } from '@/components/Icon'
import { Glass } from '@/components/Glass'
import { errorMessage } from '@/utils/format'

/**
 * 管理端登录页。
 * 仍调用公开的 POST /user/user/login；登录后本地校验 role===0，
 * 非管理员会被拦回前台（后端 JwtInterceptor 同样会拒绝 /admin/** 请求）。
 */
export function AdminLoginPage() {
  const { login, user, isAdmin, initializing } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirect = searchParams.get('redirect') || '/admin'

  // 已是管理员则直接进入后台
  useEffect(() => {
    if (!initializing && user && isAdmin) {
      navigate(redirect.startsWith('/admin/login') ? '/admin' : redirect, { replace: true })
    }
  }, [user, isAdmin, initializing, navigate, redirect])

  const submit = async () => {
    if (!username.trim() || !password) {
      setError('请输入用户名和密码')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const info = await login({ username: username.trim(), password })

      if (info.role !== ROLE_ADMIN) {
        // 普通用户登录成功但没有后台权限，清掉登录态避免误解
        setError('该账号不是管理员，无法进入管理后台')
        toast.warning('该账号没有管理权限')
        return
      }

      toast.success(`欢迎回来，${info.nickname || info.username}`)
      navigate(redirect.startsWith('/admin/login') ? '/admin' : redirect, { replace: true })
    } catch (submitError) {
      setError(errorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="row"
      style={{
        minHeight: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'var(--space-5)',
      }}
    >
      <Glass
        variant="strong"
        radius="2xl"
        className="stack"
        style={{ width: '100%', maxWidth: 400, padding: 'var(--space-7) var(--space-6)', gap: 'var(--space-4)' }}
      >
        <div className="row" style={{ gap: 10 }}>
          <span className="brand__mark">
            <Icon name="sparkles" size={18} strokeWidth={2} />
          </span>
          <span className="stack" style={{ lineHeight: 1.2 }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>thirdLine</span>
            <span style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--brand-500)' }}>ADMIN CONSOLE</span>
          </span>
        </div>

        <div>
          <h1 style={{ fontSize: 23, fontWeight: 800 }}>管理后台</h1>
          <p className="text-muted text-sm" style={{ marginTop: 4 }}>
            仅管理员可访问，请使用管理员账号登录
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <Field label="管理员账号" required>
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
              type="password"
              placeholder="请输入密码"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          <Button type="submit" variant="primary" size="lg" block loading={submitting} icon="dashboard">
            进入后台
          </Button>
        </form>

        <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}>
          <Link to="/" className="auth-link row" style={{ gap: 5 }}>
            <Icon name="chevronLeft" size={14} />
            返回前台
          </Link>
          <Link to="/login" className="auth-link">
            我是普通用户
          </Link>
        </div>
      </Glass>
    </div>
  )
}

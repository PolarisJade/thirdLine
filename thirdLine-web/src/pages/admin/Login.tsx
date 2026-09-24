import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Form, Input, message } from 'antd'
import { login } from '@/api/user'
import { useAuthStore } from '@/store/authStore'
import type { LoginDTO } from '@/types'

/** 后台登录页（极简卡片） */
export default function Login() {
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/admin/article'

  const onFinish = async (values: LoginDTO) => {
    setLoading(true)
    try {
      const data = await login(values)
      setAuth(data.token, data.userInfo)
      // 普通注册用户误入后台登录：保留登录态，带回首页
      if (data.userInfo.role !== 0) {
        message.info('当前为普通用户账号，已返回首页')
        navigate('/', { replace: true })
        return
      }
      navigate(from, { replace: true })
    } catch {
      // 错误提示由拦截器处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bone px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-4xl font-semibold tracking-tightest text-ink">thirdLine</h1>
          <p className="mt-3 font-mono text-xs uppercase tracking-widest text-muted">
            Admin Console
          </p>
        </div>

        <div className="mui-card p-8">
          <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="用户名" autoComplete="username" />
            </Form.Item>
            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="密码" autoComplete="current-password" />
            </Form.Item>
            <Form.Item className="!mb-0 mt-2">
              <Button type="primary" htmlType="submit" block loading={loading}>
                登录
              </Button>
            </Form.Item>
          </Form>
        </div>

        <p className="mt-6 text-center font-mono text-xs text-muted">
          仅站点管理员可登录 ·
          <Link to="/register" className="ml-1 underline underline-offset-4 hover:text-ink">注册账号</Link>
          <Link to="/" className="ml-1 underline underline-offset-4 hover:text-ink">返回首页</Link>
        </p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Button, Form, Input, message } from 'antd'
import { updateInfo, updatePassword } from '@/api/user'
import { useAuthStore } from '@/store/authStore'
import type { PasswordUpdateDTO, UserUpdateDTO } from '@/types'
import UploadImage from '@/components/UploadImage'

/** 个人资料：修改昵称 / 头像 / 邮箱，以及修改密码 */
export default function Profile() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [infoForm] = Form.useForm<UserUpdateDTO>()
  const [pwdForm] = Form.useForm<PasswordUpdateDTO>()
  const [savingInfo, setSavingInfo] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)

  const onSaveInfo = async (values: UserUpdateDTO) => {
    setSavingInfo(true)
    try {
      const updated = await updateInfo(values)
      setUser(updated)
      message.success('资料已更新')
    } finally {
      setSavingInfo(false)
    }
  }

  const onSavePwd = async (values: PasswordUpdateDTO) => {
    if (values.newPassword !== values.oldPassword) {
      setSavingPwd(true)
      try {
        await updatePassword({ oldPassword: values.oldPassword, newPassword: values.newPassword })
        message.success('密码已修改')
        pwdForm.resetFields()
      } finally {
        setSavingPwd(false)
      }
    } else {
      message.error('新密码不能与旧密码相同')
    }
  }

  return (
    <div>
      <h2 className="mb-6 font-serif text-2xl font-semibold text-ink">个人资料</h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 基本信息 */}
        <div className="mui-card !rounded-lg bg-canvas p-6">
          <h3 className="mb-5 font-mono text-xs uppercase tracking-widest text-muted">基本信息</h3>
          <Form
            form={infoForm}
            layout="vertical"
            requiredMark={false}
            onFinish={onSaveInfo}
            initialValues={{
              nickname: user?.nickname,
              avatar: user?.avatar ?? '',
              email: user?.email ?? '',
            }}
          >
            <div className="mb-4 flex items-center gap-4">
              <Form.Item name="avatar" label="头像" className="!mb-0">
                <UploadImage module="avatar" width={80} height={80} />
              </Form.Item>
              <div className="font-mono text-xs text-muted">
                用户名：{user?.username}
              </div>
            </div>

            <Form.Item label="昵称" name="nickname" rules={[{ required: true, message: '请输入昵称' }]}>
              <Input placeholder="展示昵称" maxLength={30} />
            </Form.Item>
            <Form.Item label="邮箱" name="email" rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
              <Input placeholder="联系邮箱" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={savingInfo}>
              保存资料
            </Button>
          </Form>
        </div>

        {/* 修改密码 */}
        <div className="mui-card !rounded-lg bg-canvas p-6">
          <h3 className="mb-5 font-mono text-xs uppercase tracking-widest text-muted">修改密码</h3>
          <Form form={pwdForm} layout="vertical" requiredMark={false} onFinish={onSavePwd}>
            <Form.Item label="旧密码" name="oldPassword" rules={[{ required: true, message: '请输入旧密码' }]}>
              <Input.Password placeholder="当前密码" autoComplete="current-password" />
            </Form.Item>
            <Form.Item
              label="新密码"
              name="newPassword"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少 6 位' },
              ]}
            >
              <Input.Password placeholder="新密码" autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              label="确认新密码"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请再次输入新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'))
                  },
                }),
              ]}
            >
              <Input.Password placeholder="再次输入新密码" autoComplete="new-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={savingPwd}>
              修改密码
            </Button>
          </Form>
        </div>
      </div>
    </div>
  )
}

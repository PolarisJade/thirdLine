import { useState } from 'react'
import { Link } from 'react-router-dom'
import { userApi } from '@/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastContext'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { Avatar, Field, Input } from '@/components/Form'
import { ImageUpload } from '@/components/ImageUpload'
import { errorMessage, formatDateTime } from '@/utils/format'
import { avatarPlaceholder, withFallback } from '@/utils/placeholder'

/**
 * 账号设置（管理端）。
 * 资料修改：PUT /admin/user/info
 * 密码修改：PUT /admin/user/password
 * 注意：后端 UserUpdateDTO 只支持 nickname / avatar / email 三个字段，用户名与角色不可改。
 */
export function SettingsPage() {
  const { user, patchUser } = useAuth()
  const toast = useToast()

  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [avatar, setAvatar] = useState(user?.avatar ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  if (!user) return null

  const saveProfile = async () => {
    if (!nickname.trim()) {
      toast.warning('昵称不能为空')
      return
    }

    setSavingProfile(true)
    try {
      const dto: { nickname?: string; email?: string; avatar?: string } = {}
      if (nickname.trim() !== (user.nickname ?? '')) dto.nickname = nickname.trim()
      if (email.trim() !== (user.email ?? '')) dto.email = email.trim()
      if (avatar.trim() !== (user.avatar ?? '')) dto.avatar = avatar.trim()

      if (Object.keys(dto).length === 0) {
        toast.info('资料没有变化')
        return
      }

      const updated = await userApi.updateInfo(dto)
      patchUser(updated)
      toast.success('资料已更新')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async () => {
    if (!oldPassword || !newPassword) {
      setPasswordError('旧密码和新密码都不能为空')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('新密码长度不能少于 6 位')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的新密码不一致')
      return
    }
    if (oldPassword === newPassword) {
      setPasswordError('新密码不能与旧密码相同')
      return
    }

    setSavingPassword(true)
    setPasswordError(null)
    try {
      await userApi.updatePassword({ oldPassword, newPassword })
      toast.success('密码修改成功，下次请使用新密码登录')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      setPasswordError(errorMessage(error))
    } finally {
      setSavingPassword(false)
    }
  }

  const dirty =
    nickname !== (user.nickname ?? '') || email !== (user.email ?? '') || avatar !== (user.avatar ?? '')

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-head__title">账号设置</h1>
          <p className="admin-page-head__desc">管理你的管理员资料与登录密码</p>
        </div>
        <Link to="/" target="_blank" className="btn btn--glass">
          <Icon name="external" size={16} />
          打开前台
        </Link>
      </div>

      <div className="dash-columns">
        {/* -------------------------------------------------------- 账号信息 */}
        <Glass className="dash-panel" variant="strong" style={{ padding: 'var(--space-6)' }}>
          <h2 className="dash-panel__title">
            <Icon name="user" size={17} />
            基本资料
          </h2>

          <div className="row" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
            <Avatar
              size="lg"
              src={withFallback(avatar || user.avatar, avatarPlaceholder(user.username))}
              name={nickname || user.nickname}
            />
            <div className="stack" style={{ gap: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{nickname || user.nickname || user.username}</span>
              <span className="text-xs text-muted">
                用户名 {user.username} · 注册于 {formatDateTime(user.createTime)}
              </span>
            </div>
          </div>

          <div className="stack" style={{ gap: 'var(--space-4)' }}>
            <Field label="昵称" hint="会显示在文章作者、页脚等处">
              <Input
                icon="heart"
                value={nickname}
                maxLength={20}
                placeholder="你的昵称"
                onChange={(event) => setNickname(event.target.value)}
              />
            </Field>

            <Field label="邮箱" hint="前台页脚的「联系我」会展示这个邮箱">
              <Input
                icon="mail"
                type="email"
                value={email}
                placeholder="your@email.com"
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>

            <Field label="头像" hint="上传后自动保存到 OSS，建议 1:1 正方形">
              <div style={{ maxWidth: 300 }}>
                <ImageUpload
                  value={avatar}
                  module="avatar"
                  aspect="1 / 1"
                  hint="建议 1:1，不超过 5MB"
                  onChange={setAvatar}
                />
              </div>
            </Field>

            <div className="row wrap" style={{ gap: 12 }}>
              <Button
                variant="primary"
                icon="check"
                loading={savingProfile}
                disabled={!dirty}
                onClick={() => void saveProfile()}
              >
                保存资料
              </Button>
              <Button
                variant="ghost"
                icon="refresh"
                disabled={!dirty}
                onClick={() => {
                  setNickname(user.nickname ?? '')
                  setEmail(user.email ?? '')
                  setAvatar(user.avatar ?? '')
                }}
              >
                撤销修改
              </Button>
              {dirty && <span className="text-xs" style={{ color: 'var(--warning)' }}>有未保存的修改</span>}
            </div>
          </div>
        </Glass>

        {/* -------------------------------------------------------- 修改密码 */}
        <Glass className="dash-panel" variant="strong" style={{ padding: 'var(--space-6)' }}>
          <h2 className="dash-panel__title">
            <Icon name="lock" size={17} />
            修改密码
          </h2>

          <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-4)', lineHeight: 1.8 }}>
            修改成功后当前登录态仍然有效，下次登录请使用新密码。
          </p>

          <div className="stack" style={{ gap: 'var(--space-4)' }}>
            <Field label="当前密码" required>
              <Input
                icon="lock"
                type="password"
                autoComplete="current-password"
                value={oldPassword}
                placeholder="请输入当前密码"
                onChange={(event) => setOldPassword(event.target.value)}
              />
            </Field>

            <Field label="新密码" required error={passwordError ?? undefined} hint="至少 6 位，不能与旧密码相同">
              <Input
                icon="lock"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                placeholder="请输入新密码"
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </Field>

            <Field label="确认新密码" required>
              <Input
                icon="check"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                placeholder="再次输入新密码"
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </Field>

            <Button
              variant="primary"
              icon="lock"
              loading={savingPassword}
              onClick={() => void savePassword()}
              style={{ alignSelf: 'flex-start' }}
            >
              确认修改密码
            </Button>
          </div>

          <div
            className="row"
            style={{
              gap: 10,
              marginTop: 'var(--space-5)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--warning-soft)',
              alignItems: 'flex-start',
            }}
          >
            <Icon name="alert" size={16} style={{ color: 'var(--warning)', marginTop: 2 }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              本站的 token 有效期为 24 小时，修改密码不会强制其它设备下线，
              如果在公共设备登录过，建议修改密码后手动退出登录。
            </span>
          </div>
        </Glass>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { userApi } from '@/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastContext'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { Avatar, Field, Input } from '@/components/Form'
import { ImageUpload } from '@/components/ImageUpload'
import { cx, errorMessage, formatDateTime } from '@/utils/format'
import { avatarPlaceholder, withFallback } from '@/utils/placeholder'

type Tab = 'profile' | 'security'

/**
 * 个人中心。
 * 资料修改：PUT /admin/user/info（后端用登录态取 userId，只更新传入字段）
 * 密码修改：PUT /admin/user/password
 */
export function ProfilePage() {
  const { user, patchUser } = useAuth()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const tab = (searchParams.get('tab') as Tab) || 'profile'

  /* -------------------------------------------------------------- 资料表单 */
  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [avatar, setAvatar] = useState(user?.avatar ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  /* -------------------------------------------------------------- 密码表单 */
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
      // 只提交被修改的字段，后端对 null 字段不做更新
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
      toast.success('密码修改成功，下次请用新密码登录')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      setPasswordError(errorMessage(error))
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="container">
      <div className="page__header">
        <h1 className="page__title">个人中心</h1>
        <p className="page__desc">管理你的展示信息与账号安全</p>
      </div>

      <div className="profile-grid">
        {/* ---------------------------------------------------------- 侧栏 */}
        <Glass className="profile-side" variant="strong">
          <Avatar
            size="xl"
            src={withFallback(avatar || user.avatar, avatarPlaceholder(user.username))}
            name={nickname || user.nickname}
          />
          <span className="profile-side__name">{nickname || user.nickname || user.username}</span>
          <span className="badge badge--neutral">
            <Icon name="user" size={12} />
            {user.role === 0 ? '管理员' : '普通用户'}
          </span>

          <div className="stack" style={{ gap: 8, width: '100%', marginTop: 'var(--space-3)' }}>
            <span className="about-contact" style={{ cursor: 'default' }}>
              <Icon name="user" size={15} />
              用户名
              <span className="about-contact__value">{user.username}</span>
            </span>
            <span className="about-contact" style={{ cursor: 'default' }}>
              <Icon name="mail" size={15} />
              邮箱
              <span className="about-contact__value">{user.email || '未填写'}</span>
            </span>
            <span className="about-contact" style={{ cursor: 'default' }}>
              <Icon name="calendar" size={15} />
              注册时间
              <span className="about-contact__value">{formatDateTime(user.createTime)}</span>
            </span>
          </div>
        </Glass>

        {/* ---------------------------------------------------------- 主区 */}
        <div className="stack" style={{ gap: 'var(--space-4)' }}>
          <div className="tabs" style={{ width: 'fit-content' }}>
            <button
              type="button"
              className={cx('tabs__item', tab === 'profile' && 'tabs__item--active')}
              onClick={() => setSearchParams({ tab: 'profile' }, { replace: true })}
            >
              基本资料
            </button>
            <button
              type="button"
              className={cx('tabs__item', tab === 'security' && 'tabs__item--active')}
              onClick={() => setSearchParams({ tab: 'security' }, { replace: true })}
            >
              账号安全
            </button>
          </div>

          {tab === 'profile' ? (
            <Glass className="profile-panel" variant="strong">
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 'var(--space-5)' }}>基本资料</h2>

              <div className="form-grid">
                <Field label="昵称" hint="展示在文章作者等位置">
                  <Input
                    icon="heart"
                    value={nickname}
                    maxLength={20}
                    placeholder="你的昵称"
                    onChange={(event) => setNickname(event.target.value)}
                  />
                </Field>

                <Field label="邮箱" hint="用于接收通知，可随时修改">
                  <Input
                    icon="mail"
                    type="email"
                    value={email}
                    placeholder="your@email.com"
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </Field>
              </div>

              <div style={{ marginTop: 'var(--space-5)' }}>
                <Field label="头像" hint="建议使用正方形图片，上传后自动保存到 OSS">
                  <div style={{ maxWidth: 320 }}>
                    <ImageUpload
                      value={avatar}
                      module="avatar"
                      aspect="1 / 1"
                      hint="建议 1:1 正方形，不超过 5MB"
                      onChange={setAvatar}
                    />
                  </div>
                </Field>
              </div>

              <div className="row wrap" style={{ gap: 12, marginTop: 'var(--space-5)' }}>
                <Button variant="primary" icon="check" loading={savingProfile} onClick={() => void saveProfile()}>
                  保存修改
                </Button>
                <Button
                  variant="ghost"
                  icon="refresh"
                  onClick={() => {
                    setNickname(user.nickname ?? '')
                    setEmail(user.email ?? '')
                    setAvatar(user.avatar ?? '')
                  }}
                >
                  重置
                </Button>
              </div>
            </Glass>
          ) : (
            <Glass className="profile-panel" variant="strong">
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 'var(--space-2)' }}>修改密码</h2>
              <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-5)' }}>
                修改成功后当前登录状态仍然有效，下次登录请使用新密码。
              </p>

              <div className="form-grid">
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
              </div>

              <Button
                variant="primary"
                icon="lock"
                loading={savingPassword}
                style={{ marginTop: 'var(--space-5)' }}
                onClick={() => void savePassword()}
              >
                确认修改
              </Button>
            </Glass>
          )}
        </div>
      </div>
    </div>
  )
}

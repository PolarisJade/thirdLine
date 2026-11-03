import { useEffect, useState, type FormEvent } from 'react'
import { adminUserApi, ROLE_ADMIN, ROLE_USER, type AdminUserDTO, type UserVO } from '@/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ToastContext'
import { useDebounced } from '@/hooks/useAsync'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Avatar, Badge, Field, Input, Select, SwitchRow } from '@/components/Form'
import { ConfirmDialog, Modal } from '@/components/Modal'
import { EmptyState, Pagination, TableSkeleton } from '@/components/Feedback'
import { errorMessage, formatDateTime } from '@/utils/format'

interface UserForm {
  username: string
  nickname: string
  email: string
  avatar: string
  password: string
  role: number
  status: number
}

const EMPTY_FORM: UserForm = {
  username: '', nickname: '', email: '', avatar: '', password: '', role: ROLE_USER, status: 1,
}
const ROLE_OPTIONS = [{ label: '普通用户', value: ROLE_USER }, { label: '管理员', value: ROLE_ADMIN }]
const STATUS_OPTIONS = [{ label: '正常', value: 1 }, { label: '已禁用', value: 0 }]

function passwordError(value: string): string | undefined {
  if (!value.trim() || value.length < 6) return '密码至少需要 6 个字符'
  if (new TextEncoder().encode(value).length > 72) return '密码的 UTF-8 编码不能超过 72 字节'
}

export function UserManagePage() {
  const { user: currentUser, patchUser } = useAuth()
  const toast = useToast()
  const [keyword, setKeyword] = useState('')
  const [role, setRole] = useState<number | undefined>()
  const [status, setStatus] = useState<number | undefined>()
  const search = useDebounced(keyword.trim(), 400)
  const list = usePaginatedList<UserVO>(
    (page, size) => adminUserApi.page({ page, size, keyword: search || undefined, role, status }),
    [search, role, status], 10,
  )
  const { setPage } = list
  useEffect(() => { setPage(1) }, [search, role, status, setPage])

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<UserVO | null>(null)
  const [form, setForm] = useState<UserForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof UserForm, string>>>({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<UserVO | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<UserVO | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [resetTarget, setResetTarget] = useState<UserVO | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetting, setResetting] = useState(false)
  const busy = saving || deleting || updatingStatus || resetting || list.refreshing
  const editingSelf = editing?.id === currentUser?.id
  const hasFilter = Boolean(keyword.trim() || role !== undefined || status !== undefined)

  const resetFilters = () => { setKeyword(''); setRole(undefined); setStatus(undefined) }
  const openEditor = (user: UserVO | null = null) => {
    setEditing(user)
    setForm(user ? {
      username: user.username, nickname: user.nickname ?? '', email: user.email ?? '',
      avatar: user.avatar ?? '', password: '', role: user.role, status: user.status,
    } : { ...EMPTY_FORM })
    setErrors({})
    setSaveError('')
    setEditorOpen(true)
  }
  const changeField = <K extends keyof UserForm>(key: K, value: UserForm[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => ({ ...previous, [key]: undefined }))
    setSaveError('')
  }
  const refreshList = () => {
    if (list.records.length === 1 && list.page > 1) list.setPage(list.page - 1)
    else list.reload()
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    const nextErrors: typeof errors = {}
    const username = form.username.trim()
    const email = form.email.trim().toLowerCase()
    const avatar = form.avatar.trim()
    if (username.length < 3 || username.length > 20) nextErrors.username = '用户名长度需在 3–20 个字符之间'
    if (!/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(email) || email.length > 255) nextErrors.email = '请输入有效的邮箱地址'
    if (form.nickname.trim().length > 50) nextErrors.nickname = '昵称不能超过 50 个字符'
    if (avatar && (!/^https?:\/\//.test(avatar) || avatar.length > 1024)) nextErrors.avatar = '请输入有效的 http:// 或 https:// 地址'
    if (!editing) nextErrors.password = passwordError(form.password)
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    const dto: AdminUserDTO = {
      username, email, nickname: form.nickname.trim(), avatar, role: form.role, status: form.status,
    }
    setSaving(true)
    setSaveError('')
    try {
      if (editing) {
        const updated = await adminUserApi.update({ ...dto, id: editing.id })
        if (editing.id === currentUser?.id) patchUser(updated)
      } else {
        await adminUserApi.create({ ...dto, password: form.password })
      }
      toast.success(editing ? '用户信息已保存' : '用户已创建')
      setEditorOpen(false)
      list.reload()
    } catch (error) {
      setSaveError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async () => {
    if (!pendingStatus || updatingStatus) return
    setUpdatingStatus(true)
    try {
      await adminUserApi.update({ id: pendingStatus.id, status: pendingStatus.status === 1 ? 0 : 1 })
      toast.success(pendingStatus.status === 1 ? '账号已禁用' : '账号已启用')
      setPendingStatus(null)
      refreshList()
    } catch (error) { toast.error(errorMessage(error)) }
    finally { setUpdatingStatus(false) }
  }

  const deleteUser = async () => {
    if (!pendingDelete || deleting) return
    setDeleting(true)
    try {
      await adminUserApi.remove(pendingDelete.id)
      toast.success('用户已删除')
      setPendingDelete(null)
      refreshList()
    } catch (error) { toast.error(errorMessage(error)) }
    finally { setDeleting(false) }
  }

  const resetPassword = async (event: FormEvent) => {
    event.preventDefault()
    if (!resetTarget || resetting) return
    const error = passwordError(newPassword)
    if (error) { setResetError(error); return }
    if (newPassword !== confirmPassword) { setResetError('两次输入的密码不一致'); return }
    setResetting(true)
    setResetError('')
    try {
      await adminUserApi.resetPassword(resetTarget.id, newPassword)
      toast.success('密码已重置，下次登录请使用新密码')
      setResetTarget(null)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) { setResetError(errorMessage(error)) }
    finally { setResetting(false) }
  }

  return (
    <div className="stack user-management" aria-busy={list.loading || list.refreshing}>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-head__title">用户管理</h1>
          <p className="admin-page-head__desc">共 {list.total} 个账号 · 管理用户资料、角色与访问状态</p>
        </div>
        <Button variant="primary" icon="plus" disabled={busy} onClick={() => openEditor()}>新增用户</Button>
      </div>

      <Glass className="panel user-management__filters" variant="strong">
        <div className="filter-bar">
          <Input icon="search" aria-label="搜索用户" placeholder="搜索用户名、昵称或邮箱" maxLength={255}
            value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          <Select aria-label="按角色筛选" placeholder="全部角色" value={role ?? ''} options={ROLE_OPTIONS}
            onChange={(event) => setRole(event.target.value === '' ? undefined : Number(event.target.value))} />
          <Select aria-label="按状态筛选" placeholder="全部状态" value={status ?? ''} options={STATUS_OPTIONS}
            onChange={(event) => setStatus(event.target.value === '' ? undefined : Number(event.target.value))} />
          {hasFilter && <Button variant="ghost" size="sm" icon="close" onClick={resetFilters}>清除筛选</Button>}
          <Button variant="ghost" size="sm" icon="refresh" loading={list.refreshing} onClick={list.reload}>刷新</Button>
        </div>
      </Glass>

      <Glass className="panel panel--flush" variant="strong">
        {list.loading ? <TableSkeleton rows={6} columns={6} /> : list.error ? (
          <EmptyState icon="alert" title="加载失败" desc={list.error}
            action={<Button variant="primary" icon="refresh" onClick={list.reload}>重试</Button>} />
        ) : list.records.length === 0 ? (
          <EmptyState icon={hasFilter ? 'search' : 'users'} title={hasFilter ? '没有符合条件的用户' : '暂无用户'}
            desc={hasFilter ? '请调整关键词或筛选条件。' : '创建账号后，即可在这里管理。'}
            action={<Button variant="primary" onClick={hasFilter ? resetFilters : () => openEditor()}>
              {hasFilter ? '清除筛选' : '新增用户'}</Button>} />
        ) : (
          <div className="table-wrap">
            <table className="table user-management__table">
              <thead><tr><th>用户</th><th>邮箱</th><th>角色</th><th>状态</th><th>注册时间</th><th className="user-management__actions-head">操作</th></tr></thead>
              <tbody>{list.records.map((user) => {
                const self = user.id === currentUser?.id
                return (
                  <tr key={user.id}>
                    <td><div className="cell-row">
                      <Avatar src={user.avatar} name={user.nickname || user.username} size="sm" />
                      <div>
                        <div className="cell-title">{user.nickname || user.username} {self && <Badge tone="info">当前账号</Badge>}</div>
                        <div className="cell-sub">{user.username} · ID {user.id}</div>
                      </div>
                    </div></td>
                    <td className="user-management__email">{user.email || '未设置'}</td>
                    <td><Badge tone={user.role === ROLE_ADMIN ? 'info' : 'neutral'}>{user.role === ROLE_ADMIN ? '管理员' : '普通用户'}</Badge></td>
                    <td><Badge tone={user.status === 1 ? 'success' : 'danger'}>{user.status === 1 ? '正常' : '已禁用'}</Badge></td>
                    <td className="text-sm text-muted">{formatDateTime(user.createTime)}</td>
                    <td><div className="table__actions">
                      <Button variant="ghost" size="sm" icon="edit" disabled={busy} onClick={() => openEditor(user)}>编辑</Button>
                      <Button variant="ghost" size="sm" icon="lock" disabled={busy} onClick={() => {
                        setResetTarget(user); setNewPassword(''); setConfirmPassword(''); setResetError('')
                      }}>重置密码</Button>
                      <Button variant="ghost" size="sm" icon={user.status === 1 ? 'eyeOff' : 'check'} disabled={self || busy}
                        title={self ? '不能禁用当前登录管理员' : undefined} onClick={() => setPendingStatus(user)}>
                        {user.status === 1 ? '禁用' : '启用'}</Button>
                      <Button variant="ghost" size="sm" icon="trash" className="user-management__danger" disabled={self || busy}
                        title={self ? '不能删除当前登录管理员' : '删除用户'} onClick={() => setPendingDelete(user)}>删除</Button>
                    </div></td>
                  </tr>
                )
              })}</tbody>
            </table>
          </div>
        )}
        {!list.loading && !list.error && list.total > 0 && <Pagination current={list.page} total={list.total}
          size={list.size} onChange={list.setPage} onSizeChange={list.setSize} />}
      </Glass>

      <Modal open={editorOpen} onClose={() => { if (!saving) setEditorOpen(false) }} maskClosable={false}
        title={editing ? '编辑用户' : '新增用户'} footer={<>
          <Button variant="ghost" disabled={saving} onClick={() => setEditorOpen(false)}>取消</Button>
          <Button variant="primary" type="submit" form="admin-user-form" loading={saving}>{editing ? '保存修改' : '创建用户'}</Button>
        </>}>
        <form id="admin-user-form" className="user-management__form" onSubmit={(event) => void save(event)} noValidate>
          {saveError && <p className="field__error" role="alert">{saveError}</p>}
          <fieldset disabled={saving} className="user-management__fieldset">
            <Field label="用户名" required error={errors.username} hint="3–20 个字符，用于登录">
              <Input autoFocus autoComplete="off" value={form.username} maxLength={20}
                onChange={(event) => changeField('username', event.target.value)} />
            </Field>
            <Field label="昵称" error={errors.nickname}>
              <Input value={form.nickname} maxLength={50} placeholder="展示名称，可留空"
                onChange={(event) => changeField('nickname', event.target.value)} />
            </Field>
            <Field label="邮箱" required error={errors.email}>
              <Input type="email" autoComplete="off" value={form.email} maxLength={255}
                onChange={(event) => changeField('email', event.target.value)} />
            </Field>
            <Field label="头像地址" error={errors.avatar} hint="可留空，使用默认头像">
              <Input type="url" value={form.avatar} maxLength={1024} placeholder="https://"
                onChange={(event) => changeField('avatar', event.target.value)} />
            </Field>
            {!editing && <Field label="初始密码" required error={errors.password} hint="至少 6 个字符，UTF-8 编码不超过 72 字节">
              <Input type="password" autoComplete="new-password" value={form.password}
                onChange={(event) => changeField('password', event.target.value)} />
            </Field>}
            <Field label="角色" hint={editingSelf ? '当前登录管理员不能降级' : '管理员可访问全部后台管理功能'}>
              <Select aria-label="用户角色" value={form.role} options={ROLE_OPTIONS} disabled={saving || editingSelf}
                onChange={(event) => changeField('role', Number(event.target.value))} />
            </Field>
            <SwitchRow label="启用账号" desc="禁用后无法登录，已有登录状态将在下次身份校验时失效"
              checked={form.status === 1} disabled={saving || editingSelf} onChange={(checked) => changeField('status', checked ? 1 : 0)} />
          </fieldset>
        </form>
      </Modal>

      <Modal open={resetTarget !== null} onClose={() => { if (!resetting) setResetTarget(null) }} maskClosable={false}
        title="重置用户密码" size="sm" footer={<>
          <Button variant="ghost" disabled={resetting} onClick={() => setResetTarget(null)}>取消</Button>
          <Button variant="primary" type="submit" form="admin-user-password-form" loading={resetting}>重置密码</Button>
        </>}>
        <form id="admin-user-password-form" className="user-management__form" onSubmit={(event) => void resetPassword(event)} noValidate>
          <p className="text-sm text-muted">为「{resetTarget?.username}」设置新密码，下次登录时使用。</p>
          <Field label="新密码" required hint="至少 6 个字符，UTF-8 编码不超过 72 字节">
            <Input autoFocus type="password" autoComplete="new-password" disabled={resetting} value={newPassword}
              onChange={(event) => { setNewPassword(event.target.value); setResetError('') }} />
          </Field>
          <Field label="确认新密码" required>
            <Input type="password" autoComplete="new-password" disabled={resetting} value={confirmPassword}
              onChange={(event) => { setConfirmPassword(event.target.value); setResetError('') }} />
          </Field>
          {resetError && <p className="field__error" role="alert">{resetError}</p>}
        </form>
      </Modal>

      <ConfirmDialog open={pendingStatus !== null} title={pendingStatus?.status === 1 ? '禁用账号' : '启用账号'}
        message={pendingStatus?.status === 1
          ? `确定禁用「${pendingStatus.username}」吗？该用户将无法登录，已有登录状态将在下次身份校验时失效。`
          : `确定重新启用「${pendingStatus?.username}」吗？该用户将可以正常登录。`}
        confirmText={pendingStatus?.status === 1 ? '确认禁用' : '确认启用'} danger={pendingStatus?.status === 1}
        loading={updatingStatus} onConfirm={() => void updateStatus()} onCancel={() => { if (!updatingStatus) setPendingStatus(null) }} />
      <ConfirmDialog open={pendingDelete !== null} title="删除用户" confirmText="确认删除" loading={deleting}
        message={<>确定删除「<strong>{pendingDelete?.username}</strong>」吗？此操作无法恢复。有关联文章的账号无法删除，可选择禁用；友链申请记录会保留。</>}
        onConfirm={() => void deleteUser()} onCancel={() => { if (!deleting) setPendingDelete(null) }} />
    </div>
  )
}

import { useState } from 'react'
import { friendLinkApi, type FriendLinkAdminVO, type FriendLinkDTO } from '@/api'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { useDebounced } from '@/hooks/useAsync'
import { useToast } from '@/components/ToastContext'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { Badge, Field, Input, Select, Textarea } from '@/components/Form'
import { LinkAvatar } from '@/components/LinkAvatar'
import { ConfirmDialog, Modal } from '@/components/Modal'
import { EmptyState, Pagination, TableSkeleton } from '@/components/Feedback'
import { errorMessage, formatDateTime } from '@/utils/format'

interface LinkForm {
  id?: number
  name: string
  url: string
  avatar: string
  description: string
  email: string
  /** 0 隐藏 / 1 显示 */
  status: number
  /** 后台内部备注，前台不展示 */
  remark: string
}

const EMPTY_FORM: LinkForm = {
  name: '',
  url: '',
  avatar: '',
  description: '',
  email: '',
  status: 1,
  remark: '',
}

/** 来源：0 管理员添加 / 1 访客申请 */
const SOURCE_LABEL: Record<number, string> = {
  0: '管理员添加',
  1: '访客申请',
}

/**
 * 友链管理。
 *
 * 列表：GET /admin/friend-link/page（分页 + keyword + auditStatus + status，后端把待审核排最前）
 * 审核：PUT /admin/friend-link/{id}/audit（1 通过 / 2 拒绝，拒绝必须填原因；
 *       通过或拒绝都会由后端异步给申请邮箱发通知，拒绝原因会写进邮件）
 * 显隐：PUT /admin/friend-link/{id}/status
 * 增改：POST / PUT /admin/friend-link，删除：DELETE /admin/friend-link/{id}
 *
 * 两个状态字段要分清：auditStatus 是审核流程（待审核/已通过/已拒绝），
 * status 是通过之后单独的显示开关，前台可见的条件是「两者都通过」。
 */
export function FriendLinkManagePage() {
  const toast = useToast()

  const [keyword, setKeyword] = useState('')
  const [auditStatus, setAuditStatus] = useState<number | undefined>(undefined)
  const [displayStatus, setDisplayStatus] = useState<number | undefined>(undefined)
  const debouncedKeyword = useDebounced(keyword, 420)

  const list = usePaginatedList<FriendLinkAdminVO>(
    (page, size) =>
      friendLinkApi.adminPage({
        page,
        size,
        keyword: debouncedKeyword.trim() || undefined,
        auditStatus,
        status: displayStatus,
      }),
    [debouncedKeyword, auditStatus, displayStatus],
    10,
  )

  /* ------------------------------------------------------------ 新增 / 编辑 */
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<LinkForm>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  /* ---------------------------------------------------------------- 拒绝 */
  const [rejectTarget, setRejectTarget] = useState<FriendLinkAdminVO | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting] = useState(false)

  /* ---------------------------------------------------------------- 删除 */
  const [pendingDelete, setPendingDelete] = useState<FriendLinkAdminVO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  const openEdit = (link: FriendLinkAdminVO) => {
    setForm({
      id: link.id,
      name: link.name ?? '',
      url: link.url ?? '',
      avatar: link.avatar ?? '',
      description: link.description ?? '',
      email: link.email ?? '',
      status: link.status ?? 1,
      remark: link.remark ?? '',
    })
    setFormError(null)
    setFormOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) {
      setFormError('站点名称不能为空')
      return
    }
    if (!form.url.trim()) {
      setFormError('站点地址不能为空')
      return
    }

    setSaving(true)
    setFormError(null)

    // 可空文本传空串：后端会把它当成「清空该字段」，而不是「保持不动」
    const dto: FriendLinkDTO = {
      name: form.name.trim(),
      url: form.url.trim(),
      avatar: form.avatar.trim(),
      description: form.description.trim(),
      email: form.email.trim(),
      remark: form.remark.trim(),
      status: form.status,
    }

    try {
      if (form.id) {
        await friendLinkApi.update({ ...dto, id: form.id })
        toast.success('友链已更新')
      } else {
        await friendLinkApi.save(dto)
        toast.success('友链已添加')
      }
      setFormOpen(false)
      list.reload()
    } catch (saveError) {
      setFormError(errorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  /* ---------------------------------------------------------------- 审核 */
  const approve = async (link: FriendLinkAdminVO) => {
    try {
      await friendLinkApi.audit(link.id, { id: link.id, auditStatus: 1 })
      toast.success(`已通过，${link.name} 现在会显示在前台`)
      list.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const openReject = (link: FriendLinkAdminVO) => {
    setRejectTarget(link)
    setRejectReason('')
  }

  const submitReject = async () => {
    if (!rejectTarget) return

    const reason = rejectReason.trim()
    if (!reason) {
      toast.warning('请填写拒绝原因')
      return
    }

    setRejecting(true)
    try {
      await friendLinkApi.audit(rejectTarget.id, {
        id: rejectTarget.id,
        auditStatus: 2,
        rejectReason: reason,
      })
      toast.success('已拒绝该申请')
      setRejectTarget(null)
      list.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setRejecting(false)
    }
  }

  /* ------------------------------------------------------------ 显隐 / 删除 */
  const toggleStatus = async (link: FriendLinkAdminVO) => {
    const next = link.status === 1 ? 0 : 1
    try {
      await friendLinkApi.updateStatus(link.id, next)
      toast.success(next === 1 ? '已显示' : '已隐藏')
      list.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return

    setDeleting(true)
    try {
      await friendLinkApi.remove(pendingDelete.id)
      toast.success('友链已删除')
      setPendingDelete(null)
      list.reload()
    } catch (deleteError) {
      toast.error(errorMessage(deleteError))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-head__title">友链管理</h1>
          <p className="admin-page-head__desc">
            共 {list.total} 条 · 待审核的排在最前，审核通过后才会出现在前台友链页
          </p>
        </div>
        <Button type="button" variant="primary" icon="plus" onClick={openCreate}>
          添加友链
        </Button>
      </div>

      <Glass className="panel" variant="strong" style={{ padding: 'var(--space-4) var(--space-5)' }}>
        <div className="filter-bar">
          <Input
            icon="search"
            placeholder="搜索站点名称、地址或描述…"
            value={keyword}
            style={{ maxWidth: 300 }}
            onChange={(event) => {
              setKeyword(event.target.value)
              list.setPage(1)
            }}
          />
          <Select
            value={auditStatus ?? ''}
            placeholder="全部审核状态"
            style={{ maxWidth: 170 }}
            options={[
              { label: '待审核', value: 0 },
              { label: '已通过', value: 1 },
              { label: '已拒绝', value: 2 },
            ]}
            onChange={(event) => {
              setAuditStatus(event.target.value === '' ? undefined : Number(event.target.value))
              list.setPage(1)
            }}
          />
          <Select
            value={displayStatus ?? ''}
            placeholder="全部显示状态"
            style={{ maxWidth: 170 }}
            options={[
              { label: '显示中', value: 1 },
              { label: '已隐藏', value: 0 },
            ]}
            onChange={(event) => {
              setDisplayStatus(event.target.value === '' ? undefined : Number(event.target.value))
              list.setPage(1)
            }}
          />
        </div>
      </Glass>

      <Glass className="panel panel--flush" variant="strong">
        {list.loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : list.error ? (
          <EmptyState
            icon="alert"
            title="加载失败"
            desc={list.error}
            action={
              <Button type="button" variant="primary" icon="refresh" onClick={list.reload}>
                重试
              </Button>
            }
          />
        ) : list.records.length === 0 ? (
          <EmptyState
            icon="link"
            title="还没有友链"
            desc="可以在前台页面提交申请，也可以在这里直接添加。"
            action={
              <Button type="button" variant="primary" icon="plus" onClick={openCreate}>
                添加友链
              </Button>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 260 }}>站点</th>
                    <th>来源</th>
                    <th>审核</th>
                    <th>显示</th>
                    <th>提交时间</th>
                    <th style={{ textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.records.map((link) => (
                    <tr key={link.id}>
                      <td>
                        <div className="cell-row">
                          <LinkAvatar src={link.avatar} name={link.name} />
                          <div style={{ minWidth: 0 }}>
                            <div className="cell-title">{link.name}</div>
                            <a
                              className="cell-sub truncate-1"
                              href={link.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              style={{ display: 'block' }}
                              title={link.url}
                            >
                              {link.url}
                            </a>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="text-sm text-muted">{SOURCE_LABEL[link.source ?? 0] ?? '—'}</span>
                        {link.email && (
                          <div className="cell-sub truncate-1" style={{ maxWidth: 150 }} title={link.email}>
                            {link.email}
                          </div>
                        )}
                      </td>

                      <td>
                        {link.auditStatus === 1 ? (
                          <Badge tone="success">已通过</Badge>
                        ) : link.auditStatus === 2 ? (
                          <Badge tone="danger">已拒绝</Badge>
                        ) : (
                          <Badge tone="warning">待审核</Badge>
                        )}
                        {link.auditStatus === 2 && link.rejectReason && (
                          <div className="cell-sub truncate-1" style={{ maxWidth: 170 }} title={link.rejectReason}>
                            {link.rejectReason}
                          </div>
                        )}
                      </td>

                      <td>
                        {/* 显示开关要审核通过后才生效，未通过的显示「—」，避免看起来像已经上线 */}
                        {link.auditStatus === 1 ? (
                          link.status === 1 ? (
                            <Badge tone="neutral">显示中</Badge>
                          ) : (
                            <Badge tone="neutral">已隐藏</Badge>
                          )
                        ) : (
                          <span className="text-sm text-muted" title="审核通过后该开关才生效">
                            —
                          </span>
                        )}
                      </td>

                      <td>
                        <span className="text-sm text-muted">{formatDateTime(link.createTime)}</span>
                      </td>

                      <td>
                        <div className="table__actions">
                          <a
                            className="btn btn--ghost btn--sm"
                            href={link.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            title="打开站点"
                          >
                            <Icon name="external" size={15} />
                          </a>

                          {link.auditStatus !== 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              icon="check"
                              title="审核通过"
                              onClick={() => void approve(link)}
                            />
                          )}

                          {link.auditStatus !== 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              icon="close"
                              title="拒绝申请"
                              onClick={() => openReject(link)}
                            />
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={link.status === 1 ? 'eyeOff' : 'eye'}
                            title={
                              link.auditStatus !== 1
                                ? '审核通过后才能切换显示'
                                : link.status === 1
                                  ? '在前台隐藏'
                                  : '在前台显示'
                            }
                            disabled={link.auditStatus !== 1}
                            onClick={() => void toggleStatus(link)}
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon="edit"
                            title="编辑"
                            onClick={() => openEdit(link)}
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon="trash"
                            title="删除"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => setPendingDelete(link)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              current={list.page}
              total={list.total}
              size={list.size}
              onChange={list.setPage}
              onSizeChange={list.setSize}
            />
          </>
        )}
      </Glass>

      {/* ------------------------------------------------------ 新增/编辑弹窗 */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? '编辑友链' : '添加友链'}
        size="lg"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>
              取消
            </Button>
            <Button
              type="button"
              variant="primary"
              icon="check"
              loading={saving}
              onClick={() => void save()}
            >
              {form.id ? '保存修改' : '添加友链'}
            </Button>
          </>
        }
      >
        <div className="stack" style={{ gap: 'var(--space-4)' }}>
          <div className="form-grid">
            <Field label="站点名称" required error={formError ?? undefined}>
              <Input
                icon="sparkles"
                value={form.name}
                maxLength={64}
                placeholder="例如：第三行"
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </Field>

            <Field label="站点地址" required hint="以 http:// 或 https:// 开头">
              <Input
                icon="external"
                value={form.url}
                maxLength={255}
                placeholder="https://example.com"
                onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
              />
            </Field>
          </div>

          <Field label="站点图标" hint="图片地址；留空则前台用站点名首字母兜底">
            <Input
              icon="image"
              value={form.avatar}
              maxLength={500}
              placeholder="https://example.com/logo.png"
              onChange={(event) => setForm((prev) => ({ ...prev, avatar: event.target.value }))}
            />
          </Field>

          <Field label="站点描述" hint="会显示在前台友链卡片里">
            <Textarea
              rows={3}
              maxLength={255}
              showCount
              value={form.description}
              placeholder="一句话介绍这个站点…"
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </Field>

          <div className="form-grid">
            <Field label="联系邮箱" hint="仅后台可见，用于回信告知审核结果">
              <Input
                icon="mail"
                type="email"
                value={form.email}
                maxLength={64}
                placeholder="you@example.com"
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </Field>

            <Field label="显示状态" hint="审核通过后仍可单独隐藏，不用删除">
              <Select
                value={form.status}
                options={[
                  { label: '显示（前台可见）', value: 1 },
                  { label: '隐藏', value: 0 },
                ]}
                onChange={(event) => setForm((prev) => ({ ...prev, status: Number(event.target.value) }))}
              />
            </Field>
          </div>

          <Field label="内部备注" hint="前台不展示，可以记联系方式、交换条件等">
            <Textarea
              rows={2}
              maxLength={200}
              value={form.remark}
              placeholder="例如：已互加友链，2026-10 交换"
              onChange={(event) => setForm((prev) => ({ ...prev, remark: event.target.value }))}
            />
          </Field>
        </div>
      </Modal>

      {/* ---------------------------------------------------------- 拒绝弹窗 */}
      <Modal
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        title="拒绝友链申请"
        size="sm"
        maskClosable={!rejecting}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRejectTarget(null)}
              disabled={rejecting}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="danger"
              icon="close"
              loading={rejecting}
              onClick={() => void submitReject()}
            >
              确认拒绝
            </Button>
          </>
        }
      >
        <div className="stack" style={{ gap: 'var(--space-4)' }}>
          <p className="text-sm text-muted" style={{ margin: 0, lineHeight: 1.75 }}>
            站点「<strong>{rejectTarget?.name}</strong>」
            {rejectTarget?.email ? `（${rejectTarget.email}）` : ''}
            将被标记为已拒绝。拒绝原因会通过邮件发送给申请人；申请时没有填写邮箱则不会收到通知。
          </p>

          <Field label="拒绝原因" required>
            <Textarea
              rows={3}
              maxLength={200}
              showCount
              value={rejectReason}
              placeholder="例如：站点无法访问 / 内容与本站无关"
              onChange={(event) => setRejectReason(event.target.value)}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除友链"
        message={
          <>
            确定要删除「<strong>{pendingDelete?.name}</strong>」吗？
            <br />
            删除后不可恢复，若只是想暂时不展示，建议用「隐藏」。
          </>
        }
        confirmText="确认删除"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

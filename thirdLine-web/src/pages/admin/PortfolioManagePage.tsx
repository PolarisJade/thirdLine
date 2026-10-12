import { useState } from 'react'
import { portfolioApi, techStackApi, type PortfolioDTO, type PortfolioVO } from '@/api'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { useAsync, useDebounced } from '@/hooks/useAsync'
import { useToast } from '@/components/ToastContext'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { Badge, Field, Input, Select, Textarea } from '@/components/Form'
import { ImageUpload } from '@/components/ImageUpload'
import { Modal, ConfirmDialog } from '@/components/Modal'
import { EmptyState, Pagination, TableSkeleton } from '@/components/Feedback'
import { cx, errorMessage, formatDate } from '@/utils/format'
import { portfolioCover, withFallback } from '@/utils/placeholder'

interface WorkForm {
  id?: number
  title: string
  summary: string
  coverImage: string
  /** 关联的技术栈ID（来自技术栈字典） */
  techStackIds: number[]
  role: string
  period: string
  demoUrl: string
  repoUrl: string
  /** 0 草稿 / 1 已发布 */
  status: number
}

const EMPTY_FORM: WorkForm = {
  title: '',
  summary: '',
  coverImage: '',
  techStackIds: [],
  role: '',
  period: '',
  demoUrl: '',
  repoUrl: '',
  status: 1,
}

/**
 * 作品集管理。
 * 列表：GET /admin/portfolio/page（分页 + keyword + status）
 * 增删改：POST / PUT / DELETE /admin/portfolio
 * 技术栈改为从字典表选择：提交 techStackIds，后端写 tl_portfolio_tech_stack 关联。
 */
export function PortfolioManagePage() {
  const toast = useToast()

  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<number | undefined>(undefined)
  const debouncedKeyword = useDebounced(keyword, 420)

  /** 技术栈字典（含禁用项），用于表单多选 */
  const techStacks = useAsync(() => techStackApi.adminList(), [])

  const list = usePaginatedList<PortfolioVO>(
    (page, size) => portfolioApi.adminPage({ page, size, keyword: debouncedKeyword.trim() || undefined, status }),
    [debouncedKeyword, status],
    10,
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<WorkForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [pendingDelete, setPendingDelete] = useState<PortfolioVO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  /** 表单里切换某个技术栈的选中状态 */
  const toggleTechStack = (techStackId: number) => {
    setForm((prev) => ({
      ...prev,
      techStackIds: prev.techStackIds.includes(techStackId)
        ? prev.techStackIds.filter((id) => id !== techStackId)
        : [...prev.techStackIds, techStackId],
    }))
  }

  const openEdit = (work: PortfolioVO) => {
    setForm({
      id: work.id,
      title: work.title ?? '',
      summary: work.summary ?? '',
      coverImage: work.coverImage ?? '',
      techStackIds: (work.techStacks ?? []).map((item) => item.id),
      role: work.role ?? '',
      period: work.period ?? '',
      demoUrl: work.demoUrl ?? '',
      repoUrl: work.repoUrl ?? '',
      status: work.status ?? 1,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.title.trim()) {
      setFormError('作品标题不能为空')
      return
    }

    setSaving(true)
    setFormError(null)

    const dto: PortfolioDTO = {
      title: form.title.trim(),
      summary: form.summary.trim() || undefined,
      coverImage: form.coverImage.trim() || undefined,
      techStackIds: form.techStackIds,
      role: form.role.trim() || undefined,
      period: form.period.trim() || undefined,
      demoUrl: form.demoUrl.trim() || undefined,
      repoUrl: form.repoUrl.trim() || undefined,
      status: form.status,
    }

    try {
      if (form.id) {
        await portfolioApi.update({ ...dto, id: form.id })
        toast.success('作品已更新')
      } else {
        await portfolioApi.save(dto)
        toast.success('作品已添加')
      }
      setModalOpen(false)
      list.reload()
    } catch (saveError) {
      setFormError(errorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  /** 快捷切换发布状态：只提交 id + status */
  const toggleStatus = async (work: PortfolioVO) => {
    const nextStatus = work.status === 1 ? 0 : 1
    try {
      await portfolioApi.update({ id: work.id, title: work.title, status: nextStatus })
      toast.success(nextStatus === 1 ? '已发布' : '已转为草稿')
      list.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return

    setDeleting(true)
    try {
      await portfolioApi.remove(pendingDelete.id)
      toast.success('作品已删除')
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
          <h1 className="admin-page-head__title">作品集管理</h1>
          <p className="admin-page-head__desc">共 {list.total} 个作品 · 草稿不会出现在前台作品集页</p>
        </div>
        <Button variant="primary" icon="plus" onClick={openCreate}>
          添加作品
        </Button>
      </div>

      <Glass className="panel" variant="strong" style={{ padding: 'var(--space-4) var(--space-5)' }}>
        <div className="filter-bar">
          <Input
            icon="search"
            placeholder="搜索作品标题或摘要…"
            value={keyword}
            style={{ maxWidth: 280 }}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Select
            value={status ?? ''}
            placeholder="全部状态"
            style={{ maxWidth: 150 }}
            options={[
              { label: '已发布', value: 1 },
              { label: '草稿', value: 0 },
            ]}
            onChange={(event) => setStatus(event.target.value === '' ? undefined : Number(event.target.value))}
          />
        </div>
      </Glass>

      <Glass className="panel panel--flush" variant="strong">
        {list.loading ? (
          <TableSkeleton rows={5} columns={4} />
        ) : list.error ? (
          <EmptyState
            icon="alert"
            title="加载失败"
            desc={list.error}
            action={
              <Button variant="primary" icon="refresh" onClick={list.reload}>
                重试
              </Button>
            }
          />
        ) : list.records.length === 0 ? (
          <EmptyState
            icon="grid"
            title="还没有作品"
            desc="把做过的项目放进来，让成长看得见。"
            action={
              <Button variant="primary" icon="plus" onClick={openCreate}>
                添加作品
              </Button>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 280 }}>作品</th>
                    <th>技术栈</th>
                    <th>角色 / 周期</th>
                    <th>状态</th>
                    <th>发布时间</th>
                    <th style={{ textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.records.map((work) => (
                    <tr key={work.id}>
                      <td>
                        <div className="cell-row">
                          <img
                            className="thumb"
                            src={withFallback(work.coverImage, portfolioCover(work.id))}
                            alt=""
                            loading="lazy"
                          />
                          <div style={{ minWidth: 0 }}>
                            <div className="cell-title">{work.title}</div>
                            <div className="cell-sub truncate-1">{work.summary || '暂无简介'}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="tag-list">
                          {(work.techStacks ?? []).slice(0, 3).map((tech) => (
                            <span className="tag-chip" key={tech.id}>
                              {tech.name}
                            </span>
                          ))}
                          {(work.techStacks?.length ?? 0) > 3 && (
                            <span className="tag-chip">+{(work.techStacks?.length ?? 0) - 3}</span>
                          )}
                          {(work.techStacks?.length ?? 0) === 0 && <span className="text-muted text-sm">—</span>}
                        </div>
                      </td>

                      <td>
                        <span className="text-sm text-muted">
                          {work.role || '—'}
                          <br />
                          {work.period || '—'}
                        </span>
                      </td>

                      <td>
                        {work.status === 1 ? <Badge tone="success">已发布</Badge> : <Badge tone="warning">草稿</Badge>}
                      </td>

                      <td>
                        <span className="text-sm text-muted">
                          {work.publishTime ? formatDate(work.publishTime) : formatDate(work.createTime)}
                        </span>
                      </td>

                      <td>
                        <div className="table__actions">
                          {work.demoUrl && (
                            <a
                              className="btn btn--ghost btn--sm"
                              href={work.demoUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              title="打开演示"
                            >
                              <Icon name="external" size={15} />
                            </a>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            icon={work.status === 1 ? 'eyeOff' : 'check'}
                            onClick={() => void toggleStatus(work)}
                            title={work.status === 1 ? '转为草稿' : '发布'}
                          />

                          <Button variant="ghost" size="sm" icon="edit" onClick={() => openEdit(work)} title="编辑" />

                          <Button
                            variant="ghost"
                            size="sm"
                            icon="trash"
                            onClick={() => setPendingDelete(work)}
                            style={{ color: 'var(--danger)' }}
                            title="删除"
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
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? '编辑作品' : '添加作品'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              取消
            </Button>
            <Button variant="primary" onClick={() => void save()} loading={saving} icon="check">
              {form.id ? '保存修改' : '添加作品'}
            </Button>
          </>
        }
      >
        <div className="stack" style={{ gap: 'var(--space-4)' }}>
          <Field label="作品标题" required error={formError ?? undefined}>
            <Input
              icon="grid"
              value={form.title}
              maxLength={80}
              placeholder="例如：thirdLine 个人博客系统"
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            />
          </Field>

          <Field label="作品简介" hint="列表卡片会展示这段文字">
            <Textarea
              value={form.summary}
              maxLength={200}
              showCount
              rows={3}
              placeholder="用一两句话介绍这个作品解决了什么问题…"
              onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
            />
          </Field>

          <div className="form-grid">
            <div>
              <span className="field__label">技术栈</span>
              {/* 用 div 而不是 Field 包裹：Field 是 <label>，里面放按钮会触发标签的点击转发 */}
              <div className="tag-picker" style={{ marginTop: 8 }}>
                {techStacks.loading ? (
                  <span className="tag-picker__empty">技术栈加载中…</span>
                ) : (techStacks.data?.length ?? 0) === 0 ? (
                  <span className="tag-picker__empty">暂无技术栈，可在「技术栈管理」中创建</span>
                ) : (
                  techStacks.data?.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={cx('tag-chip', form.techStackIds.includes(item.id) && 'tag-chip--active')}
                      onClick={() => toggleTechStack(item.id)}
                    >
                      <Icon name={form.techStackIds.includes(item.id) ? 'check' : 'code'} size={12} />
                      {item.name}
                      {item.status === 0 && <span style={{ opacity: 0.6 }}>已禁用</span>}
                    </button>
                  ))
                )}
              </div>
              <span className="field__hint" style={{ display: 'block', marginTop: 6 }}>
                {form.techStackIds.length > 0
                  ? `已选 ${form.techStackIds.length} 个技术栈 · 可多选`
                  : '从技术栈字典中选择，字典在「技术栈管理」里维护'}
              </span>
            </div>

            <Field label="我的角色">
              <Input
                icon="user"
                value={form.role}
                maxLength={40}
                placeholder="例如：前端负责人 / 独立开发"
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              />
            </Field>

            <Field label="项目周期">
              <Input
                icon="calendar"
                value={form.period}
                maxLength={40}
                placeholder="例如：2025-01 ~ 2025-06"
                onChange={(event) => setForm((prev) => ({ ...prev, period: event.target.value }))}
              />
            </Field>

            <Field label="发布状态">
              <Select
                value={form.status}
                options={[
                  { label: '立即发布（前台可见）', value: 1 },
                  { label: '保存为草稿', value: 0 },
                ]}
                onChange={(event) => setForm((prev) => ({ ...prev, status: Number(event.target.value) }))}
              />
            </Field>
          </div>

          <div className="form-grid">
            <Field label="在线演示地址">
              <Input
                icon="external"
                value={form.demoUrl}
                placeholder="https://demo.example.com"
                onChange={(event) => setForm((prev) => ({ ...prev, demoUrl: event.target.value }))}
              />
            </Field>

            <Field label="源码仓库地址">
              <Input
                icon="github"
                value={form.repoUrl}
                placeholder="https://github.com/your/repo"
                onChange={(event) => setForm((prev) => ({ ...prev, repoUrl: event.target.value }))}
              />
            </Field>
          </div>

          <Field label="作品封面" hint="建议 16:10，宽度 800px 以上">
            <ImageUpload
              value={form.coverImage}
              module="portfolio"
              aspect="16 / 10"
              onChange={(coverImage) => setForm((prev) => ({ ...prev, coverImage }))}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除作品"
        message={
          <>
            确定要删除作品「<strong>{pendingDelete?.title}</strong>」吗？
            <br />
            删除后不可恢复。
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

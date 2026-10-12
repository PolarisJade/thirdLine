import { useState } from 'react'
import { techStackApi, type TechStackVO } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/components/ToastContext'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { Field, Input, SwitchRow } from '@/components/Form'
import { Modal, ConfirmDialog } from '@/components/Modal'
import { EmptyState, TableSkeleton } from '@/components/Feedback'
import { errorMessage } from '@/utils/format'

/**
 * 技术栈管理（作品集子模块）。
 * 列表 / 新增 / 修改 / 删除分别对应 /admin/tech-stack 的 GET、POST、PUT、DELETE。
 * 技术栈已关联作品时后端返回 TECH_STACK_IN_USE，前端直接展示后端文案。
 */
export function TechStackManagePage() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => techStackApi.adminList(), [])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TechStackVO | null>(null)
  const [name, setName] = useState('')
  const [sort, setSort] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [pendingDelete, setPendingDelete] = useState<TechStackVO | null>(null)
  const [deleting, setDeleting] = useState(false)

  /** 快速新增：一个输入框直接回车添加，编辑作品时不用来回切页面 */
  const [quickName, setQuickName] = useState('')
  const [quickSaving, setQuickSaving] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setName('')
    setSort('')
    setEnabled(true)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (item: TechStackVO) => {
    setEditing(item)
    setName(item.name)
    setSort(item.sort === null || item.sort === undefined ? '' : String(item.sort))
    setEnabled(item.status !== 0)
    setFormError(null)
    setModalOpen(true)
  }

  const save = async () => {
    if (!name.trim()) {
      setFormError('技术栈名称不能为空')
      return
    }

    setSaving(true)
    setFormError(null)
    const payload = {
      name: name.trim(),
      sort: sort.trim() === '' ? undefined : Number(sort),
      status: enabled ? 1 : 0,
    }
    try {
      if (editing) {
        await techStackApi.update({ id: editing.id, ...payload })
        toast.success('技术栈已更新')
      } else {
        await techStackApi.save(payload)
        toast.success('技术栈已创建')
      }
      setModalOpen(false)
      reload()
    } catch (saveError) {
      setFormError(errorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  const quickCreate = async () => {
    const value = quickName.trim()
    if (!value) return

    setQuickSaving(true)
    try {
      await techStackApi.save({ name: value })
      toast.success(`技术栈「${value}」已创建`)
      setQuickName('')
      reload()
    } catch (createError) {
      toast.error(errorMessage(createError))
    } finally {
      setQuickSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return

    setDeleting(true)
    try {
      await techStackApi.remove(pendingDelete.id)
      toast.success('技术栈已删除')
      setPendingDelete(null)
      reload()
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
          <h1 className="admin-page-head__title">技术栈管理</h1>
          <p className="admin-page-head__desc">
            共 {data?.length ?? 0} 个技术栈 · 作品通过关联表引用这里的技术栈，已关联作品的无法删除
          </p>
        </div>
        <Button variant="primary" icon="plus" onClick={openCreate}>
          新建技术栈
        </Button>
      </div>

      {/* -------------------------------------------------------- 快速新增 */}
      <Glass className="panel" variant="strong" style={{ padding: 'var(--space-4) var(--space-5)' }}>
        <div className="filter-bar">
          <span className="filter-panel__label">快速添加</span>
          <Input
            icon="code"
            placeholder="输入技术栈名称后回车即可创建"
            value={quickName}
            maxLength={64}
            style={{ maxWidth: 320 }}
            onChange={(event) => setQuickName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void quickCreate()
            }}
          />
          <Button
            variant="glass"
            size="sm"
            icon="plus"
            loading={quickSaving}
            disabled={!quickName.trim()}
            onClick={() => void quickCreate()}
          >
            添加
          </Button>
        </div>
      </Glass>

      <Glass className="panel" variant="strong">
        {loading ? (
          <TableSkeleton rows={4} columns={3} />
        ) : error ? (
          <EmptyState
            icon="alert"
            title="加载失败"
            desc={error}
            action={
              <Button variant="primary" icon="refresh" onClick={reload}>
                重试
              </Button>
            }
          />
        ) : (data?.length ?? 0) === 0 ? (
          <EmptyState
            icon="code"
            title="还没有技术栈"
            desc="先在字典里建好技术栈，再到作品集里勾选使用。"
            action={
              <Button variant="primary" icon="plus" onClick={openCreate}>
                新建技术栈
              </Button>
            }
          />
        ) : (
          <div className="chip-manager">
            {data?.map((item) => (
              <div className="chip-item glass glass--subtle" key={item.id}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: 30,
                    borderRadius: 10,
                    flexShrink: 0,
                    color: 'var(--brand-600)',
                    background: 'color-mix(in srgb, var(--brand-400) 16%, transparent)',
                  }}
                >
                  <Icon name="code" size={15} />
                </span>

                <span className="chip-item__name">{item.name}</span>

                {item.status === 0 && <span className="text-xs text-muted">已禁用</span>}
                <span className="text-xs text-muted">排序 {item.sort ?? 0}</span>

                <button
                  type="button"
                  className="chip-item__action"
                  onClick={() => openEdit(item)}
                  aria-label={`编辑 ${item.name}`}
                  title="编辑"
                >
                  <Icon name="edit" size={15} />
                </button>

                <button
                  type="button"
                  className="chip-item__action chip-item__action--danger"
                  onClick={() => setPendingDelete(item)}
                  aria-label={`删除 ${item.name}`}
                  title="删除"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Glass>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? '编辑技术栈' : '新建技术栈'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              取消
            </Button>
            <Button variant="primary" onClick={() => void save()} loading={saving}>
              {editing ? '保存' : '创建'}
            </Button>
          </>
        }
      >
        <div className="stack" style={{ gap: 'var(--space-4)' }}>
          <Field label="技术栈名称" required error={formError ?? undefined}>
            <Input
              icon="code"
              value={name}
              maxLength={64}
              placeholder="例如：Spring Boot"
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void save()
              }}
            />
          </Field>

          <Field label="排序值" hint="越小越靠前；留空则自动排到末尾">
            <Input
              icon="dashboard"
              type="number"
              value={sort}
              placeholder="例如：10"
              onChange={(event) => setSort(event.target.value)}
            />
          </Field>

          <SwitchRow
            label="启用"
            desc="禁用后前台不展示该技术栈，已有作品仍会保留关联"
            checked={enabled}
            onChange={setEnabled}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除技术栈"
        message={
          <>
            确定要删除技术栈「<strong>{pendingDelete?.name}</strong>」吗？
            <br />
            如果它已关联作品，后端会拒绝删除。
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

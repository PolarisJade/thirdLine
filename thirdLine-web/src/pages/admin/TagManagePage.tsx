import { useState } from 'react'
import { tagApi, type TagVO } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/components/ToastContext'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { Field, Input } from '@/components/Form'
import { Modal, ConfirmDialog } from '@/components/Modal'
import { EmptyState, TableSkeleton } from '@/components/Feedback'
import { errorMessage } from '@/utils/format'

/**
 * 标签管理。
 * 列表 / 新增 / 重命名 / 删除分别对应 /admin/tag 的 GET、POST、PUT、DELETE。
 * 标签已关联文章时后端返回 TAG_IN_USE，前端直接展示后端文案。
 */
export function TagManagePage() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => tagApi.adminList(), [])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TagVO | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [pendingDelete, setPendingDelete] = useState<TagVO | null>(null)
  const [deleting, setDeleting] = useState(false)

  /** 快速新增：一个输入框直接回车添加，写文章时不用来回切页面 */
  const [quickName, setQuickName] = useState('')
  const [quickSaving, setQuickSaving] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setName('')
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (tag: TagVO) => {
    setEditing(tag)
    setName(tag.name)
    setFormError(null)
    setModalOpen(true)
  }

  const save = async () => {
    if (!name.trim()) {
      setFormError('标签名称不能为空')
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      if (editing) {
        await tagApi.update({ id: editing.id, name: name.trim() })
        toast.success('标签已重命名')
      } else {
        await tagApi.save({ name: name.trim() })
        toast.success('标签已创建')
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
      await tagApi.save({ name: value })
      toast.success(`标签「${value}」已创建`)
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
      await tagApi.remove(pendingDelete.id)
      toast.success('标签已删除')
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
          <h1 className="admin-page-head__title">标签管理</h1>
          <p className="admin-page-head__desc">
            共 {data?.length ?? 0} 个标签 · 标签可跨分类复用，已关联文章的标签无法删除
          </p>
        </div>
        <Button variant="primary" icon="plus" onClick={openCreate}>
          新建标签
        </Button>
      </div>

      {/* -------------------------------------------------------- 快速新增 */}
      <Glass className="panel" variant="strong" style={{ padding: 'var(--space-4) var(--space-5)' }}>
        <div className="filter-bar">
          <span className="filter-panel__label">快速添加</span>
          <Input
            icon="tag"
            placeholder="输入标签名后回车即可创建"
            value={quickName}
            maxLength={20}
            style={{ maxWidth: 300 }}
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
            icon="tag"
            title="还没有标签"
            desc="标签能让读者更快找到相关主题的文章。"
            action={
              <Button variant="primary" icon="plus" onClick={openCreate}>
                新建标签
              </Button>
            }
          />
        ) : (
          <div className="chip-manager">
            {data?.map((tag) => (
              <div className="chip-item glass glass--subtle" key={tag.id}>
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
                  <Icon name="tag" size={15} />
                </span>

                <span className="chip-item__name">{tag.name}</span>

                <button
                  type="button"
                  className="chip-item__action"
                  onClick={() => openEdit(tag)}
                  aria-label={`重命名 ${tag.name}`}
                  title="重命名"
                >
                  <Icon name="edit" size={15} />
                </button>

                <button
                  type="button"
                  className="chip-item__action chip-item__action--danger"
                  onClick={() => setPendingDelete(tag)}
                  aria-label={`删除 ${tag.name}`}
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
        title={editing ? '重命名标签' : '新建标签'}
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
        <Field label="标签名称" required error={formError ?? undefined}>
          <Input
            icon="tag"
            value={name}
            maxLength={20}
            placeholder="例如：Spring Boot"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void save()
            }}
          />
        </Field>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除标签"
        message={
          <>
            确定要删除标签「<strong>{pendingDelete?.name}</strong>」吗？
            <br />
            如果该标签已关联文章，后端会拒绝删除。
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

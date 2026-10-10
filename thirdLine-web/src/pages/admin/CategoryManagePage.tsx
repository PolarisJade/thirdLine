import { useState } from 'react'
import { categoryApi, type CategoryVO } from '@/api'
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
 * 分类管理。
 * 列表：GET /admin/category/list（不分页，一次返回全部）
 * 新增：POST /admin/category（名称不可重复）
 * 修改：PUT /admin/category（名称 + 排序）
 * 删除：DELETE /admin/category/{id}（分类下有文章时后端返回 CATEGORY_IN_USE，前端直接展示后端文案）
 */
export function CategoryManagePage() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => categoryApi.adminList(), [])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryVO | null>(null)
  const [name, setName] = useState('')
  const [sort, setSort] = useState('0')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [pendingDelete, setPendingDelete] = useState<CategoryVO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setName('')
    // 默认排序取当前最大值 + 1，新增分类自然排在最后
    const maxSort = Math.max(0, ...(data ?? []).map((item) => item.sort ?? 0))
    setSort(String(maxSort + 1))
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (category: CategoryVO) => {
    setEditing(category)
    setName(category.name)
    setSort(String(category.sort ?? 0))
    setFormError(null)
    setModalOpen(true)
  }

  const save = async () => {
    if (!name.trim()) {
      setFormError('分类名称不能为空')
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      if (editing) {
        await categoryApi.update({ id: editing.id, name: name.trim(), sort: Number(sort) || 0 })
        toast.success('分类已更新')
      } else {
        await categoryApi.save({ name: name.trim(), sort: Number(sort) || 0 })
        toast.success('分类已创建')
      }
      setModalOpen(false)
      reload()
    } catch (saveError) {
      setFormError(errorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return

    setDeleting(true)
    try {
      await categoryApi.remove(pendingDelete.id)
      toast.success('分类已删除')
      setPendingDelete(null)
      reload()
    } catch (deleteError) {
      // 分类下有文章时后端会拒绝，这里直接展示后端提示
      toast.error(errorMessage(deleteError))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-head__title">分类管理</h1>
          <p className="admin-page-head__desc">
            共 {data?.length ?? 0} 个分类 · 排序值越小越靠前，分类下有文章时无法删除
          </p>
        </div>
        <Button variant="primary" icon="plus" onClick={openCreate}>
          新建分类
        </Button>
      </div>

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
            icon="folder"
            title="还没有分类"
            desc="文章必须归属一个分类，先创建一个吧。"
            action={
              <Button variant="primary" icon="plus" onClick={openCreate}>
                新建分类
              </Button>
            }
          />
        ) : (
          <div className="chip-manager">
            {data?.map((category) => (
              <div className="chip-item glass glass--subtle" key={category.id}>
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
                  <Icon name="folder" size={15} />
                </span>

                <span className="chip-item__name">{category.name}</span>
                <span className="chip-item__sort">#{category.sort ?? 0}</span>

                <button
                  type="button"
                  className="chip-item__action"
                  onClick={() => openEdit(category)}
                  aria-label={`编辑 ${category.name}`}
                  title="编辑"
                >
                  <Icon name="edit" size={15} />
                </button>

                <button
                  type="button"
                  className="chip-item__action chip-item__action--danger"
                  onClick={() => setPendingDelete(category)}
                  aria-label={`删除 ${category.name}`}
                  title="删除"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Glass>

      {/* ------------------------------------------------------ 新增/编辑弹窗 */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? '编辑分类' : '新建分类'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              取消
            </Button>
            <Button variant="primary" onClick={() => void save()} loading={saving}>
              {editing ? '保存修改' : '创建'}
            </Button>
          </>
        }
      >
        <div className="stack" style={{ gap: 'var(--space-4)' }}>
          <Field label="分类名称" required error={formError ?? undefined} hint="名称不可与已有分类重复">
            <Input
              icon="folder"
              value={name}
              maxLength={20}
              placeholder="例如：后端笔记"
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void save()
              }}
            />
          </Field>

          <Field label="排序权重" hint="数字越小越靠前，相同则按创建顺序">
            <Input
              type="number"
              value={sort}
              min={0}
              onChange={(event) => setSort(event.target.value)}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除分类"
        message={
          <>
            确定要删除分类「<strong>{pendingDelete?.name}</strong>」吗？
            <br />
            如果该分类下还有文章，后端会拒绝删除。
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

import { useState } from 'react'
import { photoApi, type PhotoDTO, type PhotoVO } from '@/api'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { useToast } from '@/components/ToastContext'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { Badge, Field, Input, Select, SwitchRow, Textarea } from '@/components/Form'
import { ImageUpload } from '@/components/ImageUpload'
import { Modal, ConfirmDialog } from '@/components/Modal'
import { EmptyState, Pagination, TableSkeleton } from '@/components/Feedback'
import { errorMessage, formatDateTime, formatFileSize } from '@/utils/format'
import { photoPlaceholder, withFallback } from '@/utils/placeholder'

interface PhotoForm {
  id?: number
  title: string
  description: string
  url: string
  width?: number
  height?: number
  fileSize?: number
  sort: string
  visible: boolean
}

const EMPTY_FORM: PhotoForm = {
  title: '',
  description: '',
  url: '',
  sort: '',
  visible: true,
}

/**
 * 相册管理。
 * 列表：GET /admin/photo/page（标准分页，可按 status 过滤）
 * 增删改：POST / PUT / DELETE /admin/photo
 * 排序：sort 越小越靠前，新增时留空则后端自动追加到末尾。
 */
export function PhotoManagePage() {
  const toast = useToast()

  const [status, setStatus] = useState<number | undefined>(undefined)
  const list = usePaginatedList<PhotoVO>((page, size) => photoApi.adminPage({ page, size, status }), [status], 12)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<PhotoForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [pendingDelete, setPendingDelete] = useState<PhotoVO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (photo: PhotoVO) => {
    setForm({
      id: photo.id,
      title: photo.title ?? '',
      description: photo.description ?? '',
      url: photo.url ?? '',
      width: photo.width ?? undefined,
      height: photo.height ?? undefined,
      fileSize: photo.fileSize ?? undefined,
      sort: photo.sort === null || photo.sort === undefined ? '' : String(photo.sort),
      visible: photo.status !== 0,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.url.trim()) {
      setFormError('请先上传照片或填写图片地址')
      return
    }

    setSaving(true)
    setFormError(null)

    const dto: PhotoDTO = {
      title: form.title.trim() || undefined,
      description: form.description.trim() || undefined,
      url: form.url.trim(),
      width: form.width,
      height: form.height,
      fileSize: form.fileSize,
      status: form.visible ? 1 : 0,
      // 留空交由后端自动排到末尾
      sort: form.sort === '' ? undefined : Number(form.sort),
    }

    try {
      if (form.id) {
        await photoApi.update({ ...dto, id: form.id })
        toast.success('照片已更新')
      } else {
        await photoApi.save(dto)
        toast.success('照片已添加')
      }
      setModalOpen(false)
      list.reload()
    } catch (saveError) {
      setFormError(errorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  /** 快捷切换显隐 */
  const toggleVisible = async (photo: PhotoVO) => {
    const nextStatus = photo.status === 0 ? 1 : 0
    try {
      await photoApi.update({ id: photo.id, status: nextStatus })
      toast.success(nextStatus === 1 ? '照片已显示' : '照片已隐藏')
      list.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return

    setDeleting(true)
    try {
      await photoApi.remove(pendingDelete.id)
      toast.success('照片已删除')
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
          <h1 className="admin-page-head__title">相册管理</h1>
          <p className="admin-page-head__desc">共 {list.total} 张照片 · 排序值越小越靠前，隐藏后前台不展示</p>
        </div>
        <Button variant="primary" icon="upload" onClick={openCreate}>
          上传照片
        </Button>
      </div>

      <Glass className="panel" variant="strong" style={{ padding: 'var(--space-4) var(--space-5)' }}>
        <div className="filter-bar">
          <Select
            value={status ?? ''}
            placeholder="全部状态"
            style={{ maxWidth: 150 }}
            options={[
              { label: '显示中', value: 1 },
              { label: '已隐藏', value: 0 },
            ]}
            onChange={(event) => setStatus(event.target.value === '' ? undefined : Number(event.target.value))}
          />
          <Button variant="ghost" size="sm" icon="refresh" onClick={list.reload}>
            刷新
          </Button>
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
            icon="image"
            title="相册里还没有照片"
            desc="上传第一张照片，让相册活起来。"
            action={
              <Button variant="primary" icon="upload" onClick={openCreate}>
                上传照片
              </Button>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 300 }}>照片</th>
                    <th>尺寸 / 大小</th>
                    <th>排序</th>
                    <th>状态</th>
                    <th>上传时间</th>
                    <th style={{ textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.records.map((photo) => (
                    <tr key={photo.id}>
                      <td>
                        <div className="cell-row">
                          <img
                            className="thumb"
                            src={withFallback(photo.url, photoPlaceholder(photo.id))}
                            alt=""
                            loading="lazy"
                          />
                          <div style={{ minWidth: 0 }}>
                            <div className="cell-title">{photo.title || '未命名照片'}</div>
                            <div className="cell-sub truncate-1">{photo.description || '暂无描述'}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="text-sm text-muted">
                          {photo.width && photo.height ? `${photo.width}×${photo.height}` : '未知尺寸'}
                          <br />
                          {formatFileSize(photo.fileSize)}
                        </span>
                      </td>

                      <td>
                        <span className="text-sm">#{photo.sort ?? 0}</span>
                      </td>

                      <td>
                        {photo.status === 0 ? <Badge tone="neutral">已隐藏</Badge> : <Badge tone="success">显示中</Badge>}
                      </td>

                      <td>
                        <span className="text-sm text-muted">{formatDateTime(photo.createTime)}</span>
                      </td>

                      <td>
                        <div className="table__actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={photo.status === 0 ? 'eye' : 'eyeOff'}
                            onClick={() => void toggleVisible(photo)}
                            title={photo.status === 0 ? '设为显示' : '设为隐藏'}
                          />

                          <Button variant="ghost" size="sm" icon="edit" onClick={() => openEdit(photo)} title="编辑" />

                          <Button
                            variant="ghost"
                            size="sm"
                            icon="trash"
                            onClick={() => setPendingDelete(photo)}
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

            <Pagination current={list.page} total={list.total} size={list.size} onChange={list.setPage} />
          </>
        )}
      </Glass>

      {/* ------------------------------------------------------ 新增/编辑弹窗 */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? '编辑照片' : '上传照片'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              取消
            </Button>
            <Button variant="primary" onClick={() => void save()} loading={saving} icon="check">
              {form.id ? '保存修改' : '添加照片'}
            </Button>
          </>
        }
      >
        <div className="stack" style={{ gap: 'var(--space-4)' }}>
          <Field label="照片" required error={formError ?? undefined} hint="上传后会自动读取图片尺寸与文件大小">
            <ImageUpload
              value={form.url}
              module="photo"
              onChange={(url) => setForm((prev) => ({ ...prev, url }))}
              onUploaded={(url, meta) =>
                setForm((prev) => ({ ...prev, url, width: meta.width, height: meta.height, fileSize: meta.size }))
              }
            />
          </Field>

          <div className="form-grid">
            <Field label="标题">
              <Input
                icon="image"
                value={form.title}
                maxLength={50}
                placeholder="给这张照片起个名字"
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </Field>

            <Field label="排序权重" hint="留空自动排到末尾，数字越小越靠前">
              <Input
                type="number"
                min={0}
                value={form.sort}
                placeholder="自动"
                onChange={(event) => setForm((prev) => ({ ...prev, sort: event.target.value }))}
              />
            </Field>
          </div>

          <Field label="描述">
            <Textarea
              value={form.description}
              maxLength={200}
              showCount
              rows={3}
              placeholder="记录一下这张照片背后的故事…"
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </Field>

          <SwitchRow
            label="前台显示"
            desc="关闭后这张照片不会出现在相册里"
            checked={form.visible}
            onChange={(visible) => setForm((prev) => ({ ...prev, visible }))}
          />

          {(form.width || form.height) && (
            <div className="row wrap text-xs text-muted" style={{ gap: 14 }}>
              <span className="row" style={{ gap: 5 }}>
                <Icon name="image" size={13} />
                {form.width}×{form.height}
              </span>
              <span className="row" style={{ gap: 5 }}>
                <Icon name="file" size={13} />
                {formatFileSize(form.fileSize)}
              </span>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除照片"
        message={
          <>
            确定要删除「<strong>{pendingDelete?.title || '未命名照片'}</strong>」吗？
            <br />
            OSS 上的原图也会被同步清理，此操作不可恢复。
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

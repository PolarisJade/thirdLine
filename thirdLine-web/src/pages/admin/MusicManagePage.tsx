import { useState } from 'react'
import { musicApi, type MusicDTO, type MusicVO } from '@/api'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { useDebounced } from '@/hooks/useAsync'
import { useToast } from '@/components/ToastContext'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { Badge, Field, Input, Select, SwitchRow } from '@/components/Form'
import { AudioUpload, ImageUpload } from '@/components/ImageUpload'
import { Modal, ConfirmDialog } from '@/components/Modal'
import { EmptyState, Pagination, TableSkeleton } from '@/components/Feedback'
import { errorMessage, formatDateTime } from '@/utils/format'
import { musicCover, withFallback } from '@/utils/placeholder'

interface MusicForm {
  id?: number
  title: string
  artist: string
  coverImage: string
  audioUrl: string
  sort: string
  enabled: boolean
}

const EMPTY_FORM: MusicForm = {
  title: '',
  artist: '',
  coverImage: '',
  audioUrl: '',
  sort: '',
  enabled: true,
}

/**
 * 音乐管理。
 * 列表：GET /admin/music/page（分页 + keyword + status）
 * 增删改：POST / PUT / DELETE /admin/music
 * 音频上传走 POST /admin/file/upload-audio，上传后前台悬浮播放器会使用该 URL 播放。
 */
export function MusicManagePage() {
  const toast = useToast()

  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<number | undefined>(undefined)
  const debouncedKeyword = useDebounced(keyword, 420)

  const list = usePaginatedList<MusicVO>(
    (page, size) => musicApi.adminPage({ page, size, keyword: debouncedKeyword.trim() || undefined, status }),
    [debouncedKeyword, status],
    10,
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<MusicForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [pendingDelete, setPendingDelete] = useState<MusicVO | null>(null)
  const [deleting, setDeleting] = useState(false)

  /** 试听：直接用 Audio 播放当前填写的地址 */
  const [previewing, setPreviewing] = useState(false)
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null)

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (music: MusicVO) => {
    setForm({
      id: music.id,
      title: music.title ?? '',
      artist: music.artist ?? '',
      coverImage: music.coverImage ?? '',
      audioUrl: music.audioUrl ?? '',
      sort: music.sort === null || music.sort === undefined ? '' : String(music.sort),
      enabled: music.status !== 0,
    })
    setFormError(null)
    setModalOpen(true)
  }

  /** 试听 / 停止试听 */
  const togglePreview = () => {
    if (!form.audioUrl.trim()) {
      toast.warning('请先上传音频或填写音频地址')
      return
    }

    if (previewing && previewAudio) {
      previewAudio.pause()
      setPreviewing(false)
      return
    }

    const audio = previewAudio ?? new Audio()
    audio.src = form.audioUrl.trim()
    audio.onended = () => setPreviewing(false)
    audio.onerror = () => {
      setPreviewing(false)
      toast.error('音频无法播放，请检查地址是否可访问')
    }
    setPreviewAudio(audio)
    void audio
      .play()
      .then(() => setPreviewing(true))
      .catch(() => toast.error('浏览器拒绝了播放，请手动点击后再试'))
  }

  const save = async () => {
    if (!form.title.trim()) {
      setFormError('歌曲名不能为空')
      return
    }
    if (!form.audioUrl.trim()) {
      setFormError('请上传音频文件或填写音频地址')
      return
    }

    setSaving(true)
    setFormError(null)

    const dto: MusicDTO = {
      title: form.title.trim(),
      artist: form.artist.trim() || undefined,
      coverImage: form.coverImage.trim() || undefined,
      audioUrl: form.audioUrl.trim(),
      status: form.enabled ? 1 : 0,
      sort: form.sort === '' ? undefined : Number(form.sort),
    }

    try {
      if (form.id) {
        await musicApi.update({ ...dto, id: form.id })
        toast.success('音乐已更新')
      } else {
        await musicApi.save(dto)
        toast.success('音乐已添加')
      }
      setModalOpen(false)
      list.reload()
    } catch (saveError) {
      setFormError(errorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  /** 快捷上架 / 下架 */
  const toggleStatus = async (music: MusicVO) => {
    const nextStatus = music.status === 1 ? 0 : 1
    try {
      // MusicDTO.title 为必填，这里带上原标题
      await musicApi.update({ id: music.id, title: music.title, status: nextStatus })
      toast.success(nextStatus === 1 ? '已上架' : '已下架')
      list.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return

    setDeleting(true)
    try {
      await musicApi.remove(pendingDelete.id)
      toast.success('音乐已删除')
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
          <h1 className="admin-page-head__title">音乐管理</h1>
          <p className="admin-page-head__desc">
            共 {list.total} 首 · 已上架的音乐会出现在前台悬浮播放器与音乐页
          </p>
        </div>
        <Button variant="primary" icon="upload" onClick={openCreate}>
          添加音乐
        </Button>
      </div>

      <Glass className="panel" variant="strong" style={{ padding: 'var(--space-4) var(--space-5)' }}>
        <div className="filter-bar">
          <Input
            icon="search"
            placeholder="搜索歌曲名或歌手…"
            value={keyword}
            style={{ maxWidth: 280 }}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Select
            value={status ?? ''}
            placeholder="全部状态"
            style={{ maxWidth: 150 }}
            options={[
              { label: '已上架', value: 1 },
              { label: '已下架', value: 0 },
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
            icon="music"
            title="还没有音乐"
            desc="上传几首歌，写代码的时候有点声音。"
            action={
              <Button variant="primary" icon="upload" onClick={openCreate}>
                添加音乐
              </Button>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 260 }}>歌曲</th>
                    <th>排序</th>
                    <th>状态</th>
                    <th>添加时间</th>
                    <th style={{ textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.records.map((music) => (
                    <tr key={music.id}>
                      <td>
                        <div className="cell-row">
                          <img
                            className="thumb thumb--square"
                            src={withFallback(music.coverImage, musicCover(music.id))}
                            alt=""
                            loading="lazy"
                            style={{ borderRadius: 'var(--radius-sm)' }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div className="cell-title">{music.title}</div>
                            <div className="cell-sub truncate-1">{music.artist || '未知艺术家'}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="text-sm">#{music.sort ?? 0}</span>
                      </td>

                      <td>
                        {music.status === 1 ? <Badge tone="success">已上架</Badge> : <Badge tone="neutral">已下架</Badge>}
                      </td>

                      <td>
                        <span className="text-sm text-muted">{formatDateTime(music.createTime)}</span>
                      </td>

                      <td>
                        <div className="table__actions">
                          <a
                            className="btn btn--ghost btn--sm"
                            href={music.audioUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            title="打开音频文件"
                          >
                            <Icon name="play" size={15} />
                          </a>

                          <Button
                            variant="ghost"
                            size="sm"
                            icon={music.status === 1 ? 'eyeOff' : 'check'}
                            onClick={() => void toggleStatus(music)}
                            title={music.status === 1 ? '下架' : '上架'}
                          />

                          <Button variant="ghost" size="sm" icon="edit" onClick={() => openEdit(music)} title="编辑" />

                          <Button
                            variant="ghost"
                            size="sm"
                            icon="trash"
                            onClick={() => setPendingDelete(music)}
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
        onClose={() => {
          if (previewing && previewAudio) {
            previewAudio.pause()
            setPreviewing(false)
          }
          setModalOpen(false)
        }}
        title={form.id ? '编辑音乐' : '添加音乐'}
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button variant="primary" onClick={() => void save()} loading={saving} icon="check">
              {form.id ? '保存修改' : '添加音乐'}
            </Button>
          </>
        }
      >
        <div className="stack" style={{ gap: 'var(--space-4)' }}>
          <div className="form-grid">
            <Field label="歌曲名" required error={formError ?? undefined}>
              <Input
                icon="music"
                value={form.title}
                maxLength={80}
                placeholder="例如：夜航星"
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </Field>

            <Field label="歌手 / 艺术家">
              <Input
                icon="user"
                value={form.artist}
                maxLength={60}
                placeholder="例如：不才"
                onChange={(event) => setForm((prev) => ({ ...prev, artist: event.target.value }))}
              />
            </Field>
          </div>

          <Field
            label="音频文件"
            required
            hint="支持 mp3 / wav / flac / m4a / aac / ogg，也可直接填第三方外链"
          >
            <AudioUpload value={form.audioUrl} onChange={(audioUrl) => setForm((prev) => ({ ...prev, audioUrl }))} />
          </Field>

          <div className="row" style={{ gap: 10 }}>
            <Button
              variant="glass"
              size="sm"
              icon={previewing ? 'pause' : 'play'}
              onClick={togglePreview}
              type="button"
            >
              {previewing ? '停止试听' : '试听'}
            </Button>
            <span className="text-xs text-muted">试听只验证地址可播放，不会提前保存</span>
          </div>

          <div className="form-grid">
            <Field label="排序权重" hint="留空自动排到末尾，数字越小越靠前">
              <Input
                type="number"
                min={0}
                value={form.sort}
                placeholder="自动"
                onChange={(event) => setForm((prev) => ({ ...prev, sort: event.target.value }))}
              />
            </Field>

            <Field label="封面图" hint="不填则前台使用占位图">
              <div style={{ marginTop: 6 }}>
                <ImageUpload
                  value={form.coverImage}
                  module="music"
                  aspect="1 / 1"
                  hint="建议正方形，300×300 以上"
                  onChange={(coverImage) => setForm((prev) => ({ ...prev, coverImage }))}
                />
              </div>
            </Field>
          </div>

          <SwitchRow
            label="上架（前台可播放）"
            desc="下架后前台播放器不再包含这首歌"
            checked={form.enabled}
            onChange={(enabled) => setForm((prev) => ({ ...prev, enabled }))}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除音乐"
        message={
          <>
            确定要删除「<strong>{pendingDelete?.title}</strong>」吗？
            <br />
            删除后前台播放器会立即移除这首歌。
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

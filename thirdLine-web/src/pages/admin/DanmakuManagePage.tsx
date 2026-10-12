import { useState } from 'react'
import { danmakuApi, type DanmakuVO } from '@/api'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/components/ToastContext'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { Avatar, Badge, Select } from '@/components/Form'
import { ConfirmDialog } from '@/components/Modal'
import { EmptyState, Pagination, TableSkeleton } from '@/components/Feedback'
import { errorMessage, formatDateTime } from '@/utils/format'
import { avatarPlaceholder } from '@/utils/placeholder'

/**
 * 弹幕管理。
 * 列表：GET /admin/danmaku/page（分页 + status，含累计举报数）
 * 显隐：PUT /admin/danmaku/{id}/status?status=0|1
 * 删除：DELETE /admin/danmaku/{id}（连带删除举报记录）
 * 全局开关：GET/PUT /admin/danmaku/switch?enabled=
 */
export function DanmakuManagePage() {
  const toast = useToast()

  const [status, setStatus] = useState<number | undefined>(undefined)
  const list = usePaginatedList<DanmakuVO>((page, size) => danmakuApi.adminPage({ page, size, status }), [status], 10)

  const switchState = useAsync(() => danmakuApi.getSwitch(), [])
  const [switchSaving, setSwitchSaving] = useState(false)
  /** 本地维护开关值，避免每次切换都重新拉取 */
  const [enabled, setEnabled] = useState<boolean | null>(null)

  const [pendingDelete, setPendingDelete] = useState<DanmakuVO | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null)

  const globalEnabled = enabled ?? switchState.data ?? true

  /** 切换全局开关：关闭后前台不再展示也不允许发送 */
  const toggleGlobal = async (next: boolean) => {
    setSwitchSaving(true)
    try {
      await danmakuApi.setSwitch(next)
      setEnabled(next)
      toast.success(next ? '弹幕功能已开启' : '弹幕功能已关闭，前台不再展示')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setSwitchSaving(false)
    }
  }

  /** 单条显隐切换 */
  const toggleStatus = async (item: DanmakuVO) => {
    const nextStatus = item.status === 1 ? 0 : 1
    setStatusUpdating(item.id)
    try {
      await danmakuApi.updateStatus(item.id, nextStatus)
      toast.success(nextStatus === 1 ? '弹幕已显示' : '弹幕已隐藏')
      list.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setStatusUpdating(null)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return

    setDeleting(true)
    try {
      await danmakuApi.remove(pendingDelete.id)
      toast.success('弹幕已删除')
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
          <h1 className="admin-page-head__title">弹幕管理</h1>
          <p className="admin-page-head__desc">
            共 {list.total} 条弹幕 · 后台可隐藏或删除不当内容，关闭全局开关后前台完全停用
          </p>
        </div>
      </div>

      {/* -------------------------------------------------------- 全局开关 */}
      <Glass className="panel" variant="strong" style={{ padding: 'var(--space-4) var(--space-5)' }}>
        <div className="row wrap" style={{ gap: 'var(--space-5)', justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 'var(--space-3)' }}>
            <span
              className={globalEnabled ? 'dash-card__icon dash-card__icon--ok' : 'dash-card__icon dash-card__icon--warn'}
              style={{ width: 40, height: 40 }}
            >
              <Icon name={globalEnabled ? 'message' : 'eyeOff'} size={19} />
            </span>
            <div className="stack">
              <span style={{ fontSize: 15, fontWeight: 700 }}>
                弹幕全局开关：{globalEnabled ? '已开启' : '已关闭'}
              </span>
              <span className="text-xs text-muted">
                {globalEnabled
                  ? '前台首页会飘过弹幕，登录用户可发送'
                  : '前台不会展示弹幕层，发送接口也会被后端拒绝'}
              </span>
            </div>
          </div>

          <div className="row" style={{ gap: 'var(--space-3)' }}>
            {switchState.loading ? (
              <span className="text-sm text-muted">读取中…</span>
            ) : (
              <>
                <Badge tone={globalEnabled ? 'success' : 'neutral'}>{globalEnabled ? '开启' : '关闭'}</Badge>
                <Button
                  variant={globalEnabled ? 'glass' : 'primary'}
                  size="sm"
                  icon={globalEnabled ? 'eyeOff' : 'check'}
                  loading={switchSaving}
                  onClick={() => void toggleGlobal(!globalEnabled)}
                >
                  {globalEnabled ? '关闭弹幕' : '开启弹幕'}
                </Button>
              </>
            )}
          </div>
        </div>
      </Glass>

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
          <TableSkeleton rows={6} columns={4} />
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
          <EmptyState icon="message" title="还没有弹幕" desc="等读者来留下第一句话吧。" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 320 }}>弹幕内容</th>
                    <th>发送者</th>
                    <th>举报数</th>
                    <th>状态</th>
                    <th>发送时间</th>
                    <th style={{ textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.records.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="cell-row">
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              flexShrink: 0,
                              background: item.color || '#FFFFFF',
                              boxShadow: '0 0 0 1px var(--line-strong)',
                            }}
                            title={`颜色 ${item.color || '#FFFFFF'}`}
                          />
                          <span style={{ fontSize: 14, wordBreak: 'break-word' }}>{item.content}</span>
                        </div>
                      </td>

                      <td>
                        <div className="cell-row">
                          <Avatar
                            size="sm"
                            src={avatarPlaceholder(item.nickname ?? item.userId ?? 'anon')}
                            name={item.nickname}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div className="text-sm" style={{ fontWeight: 600 }}>
                              {item.nickname || '匿名用户'}
                            </div>
                            <div className="cell-sub">UID {item.userId ?? '—'}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {(item.reportCount ?? 0) > 0 ? (
                          <Badge tone="danger">
                            <Icon name="flag" size={11} />
                            {item.reportCount}
                          </Badge>
                        ) : (
                          <span className="text-muted text-sm">0</span>
                        )}
                      </td>

                      <td>
                        {item.status === 1 ? <Badge tone="success">显示中</Badge> : <Badge tone="neutral">已隐藏</Badge>}
                      </td>

                      <td>
                        <span className="text-sm text-muted">{formatDateTime(item.createTime)}</span>
                      </td>

                      <td>
                        <div className="table__actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={item.status === 1 ? 'eyeOff' : 'eye'}
                            loading={statusUpdating === item.id}
                            onClick={() => void toggleStatus(item)}
                            title={item.status === 1 ? '隐藏' : '显示'}
                          />

                          <Button
                            variant="ghost"
                            size="sm"
                            icon="trash"
                            onClick={() => setPendingDelete(item)}
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

      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除弹幕"
        message={
          <>
            确定要删除这条弹幕吗？
            <br />
            「<strong>{pendingDelete?.content}</strong>」
            <br />
            该弹幕的举报记录也会被一并删除。
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

import { useState } from 'react'
import { wallApi, type WallNoteAdminVO, type WallReportAdminVO } from '@/api'
import { Badge, Field, Input, Select, Textarea } from '@/components/Form'
import { Button } from '@/components/Button'
import { Glass } from '@/components/Glass'
import { Icon } from '@/components/Icon'
import { ConfirmDialog, Modal } from '@/components/Modal'
import { EmptyState, Pagination, TableSkeleton } from '@/components/Feedback'
import { useToast } from '@/components/ToastContext'
import { useAsync, useDebounced } from '@/hooks/useAsync'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { cx, errorMessage, formatDateTime, truncate } from '@/utils/format'

type Tab = 'notes' | 'reports'

const AUDIT_LABEL: Record<number, string> = { 0: '待审核', 1: '已通过', 2: '已拒绝' }
const REASON_LABEL: Record<number, string> = {
  1: '垃圾广告',
  2: '辱骂攻击',
  3: '色情低俗',
  4: '政治敏感',
  5: '违法信息',
  6: '其他',
}
const REPORT_STATUS_LABEL: Record<number, string> = { 0: '待处理', 1: '举报成立', 2: '举报不成立' }

/**
 * 留言墙管理：留言审核 + 举报处理。
 *
 * 审核通过时后端会重新计算位置（待审核期间不占位），
 * 因此这里点「通过」不需要关心墙上还有没有空位；墙满时后端会明确报错。
 */
export function WallManagePage() {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('notes')

  const { data: config } = useAsync(() => wallApi.config(), [])
  const palette = config?.palette ?? []
  const colorOf = (key: string) => palette.find((item) => item.key === key)?.color ?? '#FFD9E3'

  /* ------------------------------------------------------------ 留言列表 */

  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounced(keyword, 420)
  const [auditStatus, setAuditStatus] = useState<number | undefined>(undefined)
  const [displayStatus, setDisplayStatus] = useState<number | undefined>(undefined)

  const notesList = usePaginatedList<WallNoteAdminVO>(
    (page, size) =>
      wallApi.adminPage({
        page,
        size,
        keyword: debouncedKeyword.trim() || undefined,
        auditStatus,
        status: displayStatus,
      }),
    [debouncedKeyword, auditStatus, displayStatus],
    10,
  )

  const [rejectTarget, setRejectTarget] = useState<WallNoteAdminVO | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<WallNoteAdminVO | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [workingId, setWorkingId] = useState<number | null>(null)

  async function approve(note: WallNoteAdminVO) {
    setWorkingId(note.id)
    try {
      await wallApi.adminAudit(note.id, { auditStatus: 1 })
      toast.success('已通过，留言已经出现在墙上')
      notesList.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setWorkingId(null)
    }
  }

  function openReject(note: WallNoteAdminVO) {
    setRejectTarget(note)
    setRejectReason('')
  }

  async function submitReject() {
    if (!rejectTarget) return
    const reason = rejectReason.trim()
    if (!reason) {
      toast.warning('请填写拒绝原因')
      return
    }
    setRejecting(true)
    try {
      await wallApi.adminAudit(rejectTarget.id, { auditStatus: 2, auditRemark: reason })
      toast.success('已拒绝这条留言')
      setRejectTarget(null)
      notesList.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setRejecting(false)
    }
  }

  async function toggleStatus(note: WallNoteAdminVO) {
    const next = note.status === 1 ? 0 : 1
    setWorkingId(note.id)
    try {
      await wallApi.adminStatus(note.id, next)
      toast.success(next === 1 ? '已重新显示' : '已从墙上隐藏')
      notesList.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setWorkingId(null)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await wallApi.adminRemove(pendingDelete.id)
      toast.success('留言已删除')
      setPendingDelete(null)
      notesList.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setDeleting(false)
    }
  }

  /* ------------------------------------------------------------ 举报列表 */

  const [reportStatus, setReportStatus] = useState<number | undefined>(0)
  const reportsList = usePaginatedList<WallReportAdminVO>(
    (page, size) => wallApi.adminReports({ page, size, status: reportStatus }),
    [reportStatus],
    10,
  )
  const [handlingId, setHandlingId] = useState<number | null>(null)

  async function handleReport(report: WallReportAdminVO, status: 1 | 2) {
    setHandlingId(report.id)
    try {
      await wallApi.adminHandle(report.id, { status })
      toast.success(status === 1 ? '已下线该留言' : '已标记为不成立')
      reportsList.reload()
      notesList.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setHandlingId(null)
    }
  }

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-head__title">留言墙管理</h1>
          <p className="admin-page-head__desc">
            留言先审后发；待审核期间不占墙上的位置，通过时会自动重新落位。
          </p>
        </div>
        <div className="wall-admin-tabs" role="tablist" aria-label="留言墙管理分区">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'notes'}
            className={cx('wall-admin-tabs__item', tab === 'notes' && 'is-active')}
            onClick={() => setTab('notes')}
          >
            <Icon name="message" size={15} />
            留言审核
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'reports'}
            className={cx('wall-admin-tabs__item', tab === 'reports' && 'is-active')}
            onClick={() => setTab('reports')}
          >
            <Icon name="flag" size={15} />
            举报处理
          </button>
        </div>
      </div>

      {tab === 'notes' ? (
        <>
          <Glass className="panel" variant="strong" style={{ padding: 'var(--space-4) var(--space-5)' }}>
            <div className="filter-bar">
              <Input
                icon="search"
                placeholder="搜索留言内容…"
                value={keyword}
                style={{ maxWidth: 300 }}
                onChange={(event) => {
                  setKeyword(event.target.value)
                  notesList.setPage(1)
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
                  notesList.setPage(1)
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
                  notesList.setPage(1)
                }}
              />
              <Button type="button" variant="ghost" size="sm" icon="refresh" onClick={notesList.reload}>
                刷新
              </Button>
            </div>
          </Glass>

          <Glass className="panel panel--flush" variant="strong">
            {notesList.loading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : notesList.error ? (
              <EmptyState
                icon="alert"
                title="加载失败"
                desc={notesList.error}
                action={
                  <Button type="button" variant="primary" icon="refresh" onClick={notesList.reload}>
                    重试
                  </Button>
                }
              />
            ) : notesList.records.length === 0 ? (
              <EmptyState
                icon="message"
                title="没有符合条件的留言"
                desc="待审核的留言会出现在这里，通过后才会被所有人看到。"
              />
            ) : (
              <>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ minWidth: 320 }}>留言</th>
                        <th>审核</th>
                        <th>显示</th>
                        <th>举报</th>
                        <th>提交时间</th>
                        <th style={{ textAlign: 'right' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notesList.records.map((note) => (
                        <tr key={note.id}>
                          <td>
                            <div className="wall-admin__note">
                              <span
                                className="wall-admin__swatch"
                                style={{ background: colorOf(note.paperColor) }}
                                aria-hidden="true"
                              />
                              <div style={{ minWidth: 0 }}>
                                <div className="cell-title wall-admin__content" title={note.content}>
                                  {truncate(note.content, 60)}
                                </div>
                                <div className="cell-sub">
                                  作者 #{note.userId} · 位置 ({Math.round(note.posX)}, {Math.round(note.posY)})
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge
                              tone={
                                note.auditStatus === 1
                                  ? 'success'
                                  : note.auditStatus === 2
                                    ? 'danger'
                                    : 'warning'
                              }
                            >
                              {AUDIT_LABEL[note.auditStatus] ?? '未知'}
                            </Badge>
                            {note.auditStatus === 2 && note.auditRemark && (
                              <div className="cell-sub truncate-1" style={{ maxWidth: 180 }} title={note.auditRemark}>
                                {note.auditRemark}
                              </div>
                            )}
                            {note.auditStatus === 1 && note.auditRemark && (
                              <div className="cell-sub truncate-1" style={{ maxWidth: 180 }} title={note.auditRemark}>
                                {note.auditRemark}
                              </div>
                            )}
                          </td>
                          <td>
                            {note.auditStatus === 1 ? (
                              <Badge tone="neutral">{note.status === 1 ? '显示中' : '已隐藏'}</Badge>
                            ) : (
                              <span className="text-sm text-muted" title="审核通过后才会上墙">
                                —
                              </span>
                            )}
                          </td>
                          <td>
                            {note.reportCount > 0 ? (
                              <Badge tone="danger">{note.reportCount} 次</Badge>
                            ) : (
                              <span className="text-sm text-muted">0</span>
                            )}
                          </td>
                          <td>
                            <span className="text-sm text-muted">{formatDateTime(note.createTime)}</span>
                          </td>
                          <td>
                            <div className="table__actions">
                              {note.auditStatus !== 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  icon="check"
                                  title="通过，放到墙上"
                                  loading={workingId === note.id}
                                  onClick={() => void approve(note)}
                                />
                              )}
                              {note.auditStatus !== 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  icon="close"
                                  title="拒绝"
                                  onClick={() => openReject(note)}
                                />
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                icon={note.status === 1 ? 'eyeOff' : 'eye'}
                                title={
                                  note.auditStatus !== 1
                                    ? '审核通过后才能切换显示'
                                    : note.status === 1
                                      ? '从墙上隐藏'
                                      : '重新显示'
                                }
                                disabled={note.auditStatus !== 1 || workingId === note.id}
                                onClick={() => void toggleStatus(note)}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                icon="trash"
                                title="删除"
                                style={{ color: 'var(--danger)' }}
                                onClick={() => setPendingDelete(note)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  current={notesList.page}
                  total={notesList.total}
                  size={notesList.size}
                  onChange={notesList.setPage}
                  onSizeChange={notesList.setSize}
                />
              </>
            )}
          </Glass>
        </>
      ) : (
        <>
          <Glass className="panel" variant="strong" style={{ padding: 'var(--space-4) var(--space-5)' }}>
            <div className="filter-bar">
              <Select
                value={reportStatus ?? ''}
                placeholder="全部处理状态"
                style={{ maxWidth: 180 }}
                options={[
                  { label: '待处理', value: 0 },
                  { label: '举报成立', value: 1 },
                  { label: '举报不成立', value: 2 },
                ]}
                onChange={(event) => {
                  setReportStatus(event.target.value === '' ? undefined : Number(event.target.value))
                  reportsList.setPage(1)
                }}
              />
              <Button type="button" variant="ghost" size="sm" icon="refresh" onClick={reportsList.reload}>
                刷新
              </Button>
            </div>
          </Glass>

          <Glass className="panel panel--flush" variant="strong">
            {reportsList.loading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : reportsList.error ? (
              <EmptyState
                icon="alert"
                title="加载失败"
                desc={reportsList.error}
                action={
                  <Button type="button" variant="primary" icon="refresh" onClick={reportsList.reload}>
                    重试
                  </Button>
                }
              />
            ) : reportsList.records.length === 0 ? (
              <EmptyState icon="flag" title="没有待处理的举报" desc="被举报的留言会出现在这里。" />
            ) : (
              <>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ minWidth: 300 }}>被举报留言</th>
                        <th>原因</th>
                        <th>举报人</th>
                        <th>举报时间</th>
                        <th>状态</th>
                        <th style={{ textAlign: 'right' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportsList.records.map((report) => (
                        <tr key={report.id}>
                          <td>
                            <div className="cell-title" title={report.noteContent ?? ''}>
                              {report.noteContent
                                ? truncate(report.noteContent, 50)
                                : '（留言已被删除）'}
                            </div>
                            <div className="cell-sub">
                              留言 #{report.noteId}
                              {report.noteStatus === 0 && ' · 当前已隐藏'}
                            </div>
                          </td>
                          <td>
                            <span className="text-sm">
                              {REASON_LABEL[report.reasonType] ?? '其他'}
                            </span>
                            {report.reason && (
                              <div className="cell-sub truncate-2" style={{ maxWidth: 200 }} title={report.reason}>
                                {report.reason}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="text-sm text-muted">#{report.reporterUserId}</span>
                          </td>
                          <td>
                            <span className="text-sm text-muted">{formatDateTime(report.createTime)}</span>
                          </td>
                          <td>
                            <Badge
                              tone={
                                report.status === 1
                                  ? 'danger'
                                  : report.status === 2
                                    ? 'neutral'
                                    : 'warning'
                              }
                            >
                              {REPORT_STATUS_LABEL[report.status] ?? '未知'}
                            </Badge>
                            {report.handleRemark && (
                              <div className="cell-sub truncate-1" style={{ maxWidth: 160 }} title={report.handleRemark}>
                                {report.handleRemark}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="table__actions">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                icon="check"
                                title="举报成立，下线留言"
                                disabled={report.status !== 0 || handlingId === report.id}
                                onClick={() => void handleReport(report, 1)}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                icon="close"
                                title="举报不成立"
                                disabled={report.status !== 0 || handlingId === report.id}
                                onClick={() => void handleReport(report, 2)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  current={reportsList.page}
                  total={reportsList.total}
                  size={reportsList.size}
                  onChange={reportsList.setPage}
                  onSizeChange={reportsList.setSize}
                />
              </>
            )}
          </Glass>
        </>
      )}

      <Modal
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        title="拒绝这条留言"
        size="sm"
        maskClosable={!rejecting}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setRejectTarget(null)} disabled={rejecting}>
              取消
            </Button>
            <Button type="button" variant="danger" icon="close" loading={rejecting} onClick={() => void submitReject()}>
              确认拒绝
            </Button>
          </>
        }
      >
        <div className="stack" style={{ gap: 'var(--space-4)' }}>
          <p className="text-sm text-muted" style={{ margin: 0, lineHeight: 1.75 }}>
            留言「{truncate(rejectTarget?.content ?? '', 40)}」将被标记为已拒绝，不会出现在墙上。
            填写的原因会记录在后台。
          </p>
          <Field label="拒绝原因" required>
            <Textarea
              rows={3}
              maxLength={200}
              showCount
              value={rejectReason}
              placeholder="例如：包含广告链接 / 与本站无关"
              onChange={(event) => setRejectReason(event.target.value)}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除留言"
        message={
          <>
            确定要删除「{truncate(pendingDelete?.content ?? '', 30)}」吗？
            <br />
            删除后不可恢复；如果只是想暂时不展示，建议用「隐藏」。
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

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { danmakuApi, type DanmakuReportVO } from '@/api'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { useToast } from '@/components/ToastContext'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { Badge, Select } from '@/components/Form'
import { EmptyState, Pagination, TableSkeleton } from '@/components/Feedback'
import { errorMessage, formatDateTime } from '@/utils/format'

/**
 * 举报处理。
 * 列表：GET /admin/danmaku/report/page（分页 + status：0 待处理 / 1 已处理）
 * 处理：PUT /admin/danmaku/report/{id}/handle
 * 如需删除被举报弹幕，可到「弹幕管理」操作（举报记录会级联删除）。
 */
export function ReportManagePage() {
  const toast = useToast()

  /** 默认只看待处理，符合日常处理习惯 */
  const [status, setStatus] = useState<number | undefined>(0)
  const list = usePaginatedList<DanmakuReportVO>(
    (page, size) => danmakuApi.reportPage(status, page, size),
    [status],
    10,
  )

  const [handlingId, setHandlingId] = useState<number | null>(null)

  const handle = async (report: DanmakuReportVO) => {
    setHandlingId(report.id)
    try {
      await danmakuApi.handleReport(report.id)
      toast.success('已标记为处理完成')
      list.reload()
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
          <h1 className="admin-page-head__title">举报处理</h1>
          <p className="admin-page-head__desc">
            共 {list.total} 条记录 · 处理后标记状态，若内容确实不当可前往「弹幕管理」删除
          </p>
        </div>
        <Link to="/admin/danmaku" className="btn btn--glass">
          <Icon name="message" size={16} />
          去弹幕管理
        </Link>
      </div>

      <Glass className="panel" variant="strong" style={{ padding: 'var(--space-4) var(--space-5)' }}>
        <div className="filter-bar">
          <Select
            value={status ?? ''}
            placeholder="全部举报"
            style={{ maxWidth: 160 }}
            options={[
              { label: '待处理', value: 0 },
              { label: '已处理', value: 1 },
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
            icon="check"
            title={status === 0 ? '没有待处理的举报' : '暂无举报记录'}
            desc="社区氛围良好，继续保持。"
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 300 }}>被举报弹幕</th>
                    <th>举报理由</th>
                    <th>举报人</th>
                    <th>状态</th>
                    <th>举报时间</th>
                    <th style={{ textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.records.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, wordBreak: 'break-word' }}>
                            {report.danmakuContent || '（弹幕已删除）'}
                          </div>
                          <div className="cell-sub">发送者：{report.danmakuNickname || '匿名'} · ID {report.danmakuId}</div>
                        </div>
                      </td>

                      <td>
                        <span className="text-sm">{report.reason || '未填写'}</span>
                      </td>

                      <td>
                        <span className="text-sm text-muted">{report.reporterNickname || '匿名用户'}</span>
                      </td>

                      <td>
                        {report.status === 1 ? (
                          <Badge tone="success">已处理</Badge>
                        ) : (
                          <Badge tone="danger">
                            <Icon name="flag" size={11} />
                            待处理
                          </Badge>
                        )}
                      </td>

                      <td>
                        <span className="text-sm text-muted">{formatDateTime(report.createTime)}</span>
                      </td>

                      <td>
                        <div className="table__actions">
                          {report.status === 0 ? (
                            <Button
                              variant="primary"
                              size="sm"
                              icon="check"
                              loading={handlingId === report.id}
                              onClick={() => void handle(report)}
                            >
                              标记已处理
                            </Button>
                          ) : (
                            <span className="text-sm text-muted">已处理</span>
                          )}
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
    </div>
  )
}

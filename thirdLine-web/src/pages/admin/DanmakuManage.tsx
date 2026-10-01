import { useCallback, useEffect, useState } from 'react'
import {
  Badge,
  Button,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Trash, ShieldCheck } from '@phosphor-icons/react'
import {
  deleteDanmaku,
  getDanmakuSwitch,
  handleDanmakuReport,
  pageDanmaku,
  pageDanmakuReports,
  setDanmakuSwitch,
  updateDanmakuStatus,
} from '@/api/danmaku'
import { formatDate } from '@/utils/format'
import type { DanmakuQuery, DanmakuReportVO, DanmakuVO } from '@/types'

/** 弹幕管理：全局开关 + 弹幕列表（显隐/删除）+ 举报处理 */
export default function DanmakuManage() {
  // 全局开关
  const [enabled, setEnabled] = useState(true)
  const [switchLoading, setSwitchLoading] = useState(false)

  // 弹幕列表
  const [rows, setRows] = useState<DanmakuVO[]>([])
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<DanmakuQuery['status']>(undefined)

  // 举报列表
  const [reports, setReports] = useState<DanmakuReportVO[]>([])
  const [reportLoading, setReportLoading] = useState(false)
  const [reportCurrent, setReportCurrent] = useState(1)
  const [reportPageSize, setReportPageSize] = useState(12)
  const [reportTotal, setReportTotal] = useState(0)
  const [reportStatusFilter, setReportStatusFilter] = useState<number | undefined>(0)

  const loadSwitch = useCallback(() => {
    getDanmakuSwitch()
      .then(setEnabled)
      .catch(() => {})
  }, [])

  const loadList = useCallback(
    (page = current, size = pageSize, status = statusFilter) => {
      setLoading(true)
      pageDanmaku({ page, size, status })
        .then((res) => {
          setRows(res?.records || [])
          setTotal(res?.total || 0)
          setCurrent(res?.current || page)
          setPageSize(res?.size || size)
        })
        .finally(() => setLoading(false))
    },
    [current, pageSize, statusFilter],
  )

  const loadReports = useCallback(
    (page = reportCurrent, size = reportPageSize, status = reportStatusFilter) => {
      setReportLoading(true)
      pageDanmakuReports({ page, size, status })
        .then((res) => {
          setReports(res?.records || [])
          setReportTotal(res?.total || 0)
          setReportCurrent(res?.current || page)
          setReportPageSize(res?.size || size)
        })
        .finally(() => setReportLoading(false))
    },
    [reportCurrent, reportPageSize, reportStatusFilter],
  )

  useEffect(() => {
    loadSwitch()
    loadList(1, 12, undefined)
    loadReports(1, 12, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onToggleSwitch = async (checked: boolean) => {
    setSwitchLoading(true)
    try {
      await setDanmakuSwitch(checked)
      setEnabled(checked)
      message.success(checked ? '已开启全站弹幕' : '已关闭全站弹幕')
    } catch {
      // 拦截器已提示
    } finally {
      setSwitchLoading(false)
    }
  }

  const onToggleStatus = async (record: DanmakuVO, checked: boolean) => {
    try {
      await updateDanmakuStatus(record.id, checked ? 1 : 0)
      message.success(checked ? '已显示' : '已隐藏')
      loadList(current, pageSize)
    } catch {
      // 拦截器已提示
    }
  }

  const onDelete = async (id: number) => {
    try {
      await deleteDanmaku(id)
      message.success('已删除')
      const nextPage = rows.length === 1 && current > 1 ? current - 1 : current
      loadList(nextPage, pageSize)
    } catch {
      // 拦截器已提示
    }
  }

  const onHandleReport = async (id: number) => {
    try {
      await handleDanmakuReport(id)
      message.success('已标记为处理')
      loadReports(reportCurrent, reportPageSize)
    } catch {
      // 拦截器已提示
    }
  }

  const columns: ColumnsType<DanmakuVO> = [
    {
      title: '弹幕内容',
      dataIndex: 'content',
      render: (text: string, r) => (
        <span>
          <span
            className="mr-2 inline-block h-3 w-3 rounded-full align-middle"
            style={{ background: r.color || '#fff', border: '1px solid #eaeaea' }}
          />
          {text}
        </span>
      ),
    },
    { title: '发送者', dataIndex: 'nickname', width: 140, render: (v: string | null) => v || '—' },
    {
      title: '举报数',
      dataIndex: 'reportCount',
      width: 90,
      render: (v: number | undefined) =>
        v && v > 0 ? <Tag color="red">{v}</Tag> : <span className="text-muted">0</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status: number, record) => (
        <Switch
          size="small"
          checked={status === 1}
          onChange={(checked) => onToggleStatus(record, checked)}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 150,
      render: (v: string) => formatDate(v, 'YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <Popconfirm
          title="确认删除该弹幕？其举报记录将一并删除"
          onConfirm={() => onDelete(record.id)}
          okText="删除"
          cancelText="取消"
        >
          <Button type="text" size="small" danger icon={<Trash size={16} />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ]

  const reportColumns: ColumnsType<DanmakuReportVO> = [
    {
      title: '被举报弹幕',
      dataIndex: 'danmakuContent',
      render: (v: string | null, r) => (
        <span>
          {v || <span className="text-muted">（弹幕已删除）</span>}
          {r.danmakuNickname && (
            <span className="ml-2 text-muted">— {r.danmakuNickname}</span>
          )}
        </span>
      ),
    },
    {
      title: '举报理由',
      dataIndex: 'reason',
      width: 220,
      render: (v: string | null) => v || <span className="text-muted">—</span>,
    },
    {
      title: '举报人',
      dataIndex: 'reporterNickname',
      width: 140,
      render: (v: string | null) => v || '—',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s: number) =>
        s === 1 ? <Tag color="green">已处理</Tag> : <Tag color="orange">待处理</Tag>,
    },
    {
      title: '举报时间',
      dataIndex: 'createTime',
      width: 150,
      render: (v: string) => formatDate(v, 'YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 110,
      fixed: 'right',
      render: (_, record) =>
        record.status === 0 ? (
          <Button
            type="text"
            size="small"
            icon={<ShieldCheck size={16} />}
            onClick={() => onHandleReport(record.id)}
          >
            标记处理
          </Button>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
  ]

  const danmakuTab = (
    <div className="mui-card !rounded-lg bg-canvas p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-sm text-muted">状态</span>
        <Switch
          size="small"
          checked={statusFilter === 1}
          checkedChildren="显示"
          unCheckedChildren="全部"
          onChange={(checked) => {
            const next = checked ? 1 : undefined
            setStatusFilter(next)
            loadList(1, pageSize, next)
          }}
        />
      </div>
      <Table<DanmakuVO>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        scroll={{ x: 900 }}
        pagination={{
          current,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: [12, 24, 48],
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, s) => loadList(p, s),
        }}
      />
    </div>
  )

  const reportTab = (
    <div className="mui-card !rounded-lg bg-canvas p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-sm text-muted">处理状态</span>
        <Switch
          size="small"
          checked={reportStatusFilter === 0}
          checkedChildren="待处理"
          unCheckedChildren="全部"
          onChange={(checked) => {
            const next = checked ? 0 : undefined
            setReportStatusFilter(next)
            loadReports(1, reportPageSize, next)
          }}
        />
      </div>
      <Table<DanmakuReportVO>
        rowKey="id"
        columns={reportColumns}
        dataSource={reports}
        loading={reportLoading}
        scroll={{ x: 900 }}
        pagination={{
          current: reportCurrent,
          pageSize: reportPageSize,
          total: reportTotal,
          showSizeChanger: true,
          pageSizeOptions: [12, 24, 48],
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, s) => loadReports(p, s),
        }}
      />
    </div>
  )

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-2xl font-semibold text-ink">弹幕管理</h2>
        <Space>
          <span className="text-sm text-charcoal">全站弹幕</span>
          <Tooltip title="关闭后前台弹幕页不再展示任何弹幕，且禁止发送">
            <Switch
              checked={enabled}
              loading={switchLoading}
              checkedChildren="开"
              unCheckedChildren="关"
              onChange={onToggleSwitch}
            />
          </Tooltip>
        </Space>
      </div>

      <Tabs
        defaultActiveKey="list"
        items={[
          { key: 'list', label: '弹幕列表', children: danmakuTab },
          {
            key: 'report',
            label: (
              <Badge count={reportStatusFilter === 0 ? reportTotal : 0} size="small" offset={[6, -2]}>
                <span>举报处理</span>
              </Badge>
            ),
            children: reportTab,
          },
        ]}
        onChange={(key) => {
          if (key === 'report') loadReports(1, reportPageSize, reportStatusFilter)
          else loadList(1, pageSize, statusFilter)
        }}
      />
    </div>
  )
}

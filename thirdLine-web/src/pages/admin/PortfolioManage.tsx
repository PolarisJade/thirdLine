import { useEffect, useState } from 'react'
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Space,
  Table,
  Tag,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Plus, PencilSimple, Trash } from '@phosphor-icons/react'
import { deletePortfolio, pagePortfolios, savePortfolio, updatePortfolio } from '@/api/portfolio'
import { formatDate, statusLabel } from '@/utils/format'
import UploadImage from '@/components/UploadImage'
import type { PortfolioDTO, PortfolioVO } from '@/types'

const { TextArea } = Input

const STATUS_COLOR: Record<number, string> = {
  0: 'default',
  1: 'green',
  2: 'red',
}

/** 技术栈逗号分隔字符串转数组（去空白、去空项） */
const parseTechStack = (raw?: string | null): string[] =>
  (raw || '')
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean)

/** 作品集管理：分页列表 + 新增 / 编辑 / 删除 / 发布切换 */
export default function PortfolioManage() {
  const [data, setData] = useState<PortfolioVO[]>([])
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PortfolioVO | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<PortfolioDTO>()

  const load = (page = current, size = pageSize) => {
    setLoading(true)
    pagePortfolios({ page, size, keyword: keyword || undefined, status: statusFilter })
      .then((res) => {
        setData(res?.records || [])
        setTotal(res?.total || 0)
        setCurrent(res?.current || page)
        setPageSize(res?.size || size)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(1, pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, statusFilter])

  const openModal = (record?: PortfolioVO) => {
    setEditing(record || null)
    // 先重置再回填，避免上一次编辑的残留值；forceRender 保证 Form 已挂载，setFieldsValue 才能生效
    form.resetFields()
    form.setFieldsValue(
      record
        ? {
            id: record.id,
            title: record.title,
            summary: record.summary || '',
            coverImage: record.coverImage || '',
            techStack: record.techStack || '',
            role: record.role || '',
            period: record.period || '',
            demoUrl: record.demoUrl || '',
            repoUrl: record.repoUrl || '',
            status: record.status,
          }
        : { title: '', status: 0 },
    )
    setOpen(true)
  }

  const onSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      if (editing) {
        await updatePortfolio({ ...values, id: editing.id })
        message.success('已更新')
      } else {
        await savePortfolio(values)
        message.success('已新增')
        setCurrent(1)
      }
      setOpen(false)
      load(editing ? current : 1, pageSize)
    } catch {
      // 拦截器已提示
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (id: number) => {
    try {
      await deletePortfolio(id)
      message.success('已删除')
      const nextPage = data.length === 1 && current > 1 ? current - 1 : current
      load(nextPage, pageSize)
    } catch {
      // 拦截器已提示
    }
  }

  const onTogglePublish = async (record: PortfolioVO) => {
    const next = record.status === 1 ? 0 : 1
    try {
      await updatePortfolio({ id: record.id, status: next })
      message.success(next === 1 ? '已发布' : '已转为草稿')
      load(current, pageSize)
    } catch {
      // 拦截器已提示
    }
  }

  const columns: ColumnsType<PortfolioVO> = [
    {
      title: '封面',
      dataIndex: 'coverImage',
      width: 96,
      render: (url: string | null, record) =>
        url ? (
          <img
            src={url}
            alt={record.title}
            className="h-12 w-20 rounded object-cover"
            style={{ border: '1px solid #eaeaea' }}
          />
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    { title: '标题', dataIndex: 'title', render: (t: string) => t || <span className="text-muted">未命名</span> },
    {
      title: '技术栈',
      dataIndex: 'techStack',
      render: (raw: string | null) => {
        const list = parseTechStack(raw)
        if (list.length === 0) return <span className="text-muted">—</span>
        return (
          <Space size={4} wrap>
            {list.map((t) => (
              <Tag key={t} bordered={false}>
                {t}
              </Tag>
            ))}
          </Space>
        )
      },
    },
    { title: '周期', dataIndex: 'period', width: 150, render: (v: string | null) => v || '—' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: number) => <Tag color={STATUS_COLOR[v]}>{statusLabel(v)}</Tag>,
    },
    {
      title: '发布时间',
      dataIndex: 'publishTime',
      width: 120,
      render: (v: string | null) => formatDate(v) || '—',
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<PencilSimple size={16} />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Button type="text" size="small" onClick={() => onTogglePublish(record)}>
            {record.status === 1 ? '转草稿' : '发布'}
          </Button>
          <Popconfirm
            title="确认删除该作品？"
            onConfirm={() => onDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<Trash size={16} />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-semibold text-ink">作品集管理</h2>
        <Button type="primary" icon={<Plus size={16} weight="bold" />} onClick={() => openModal()}>
          新增作品
        </Button>
      </div>

      <div className="mui-card !rounded-lg bg-canvas p-4">
        <Space wrap className="mb-4">
          <Input.Search
            placeholder="搜索标题 / 摘要"
            allowClear
            style={{ width: 240 }}
            onSearch={(v) => setKeyword(v.trim())}
          />
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={statusFilter ?? -1}
            onChange={(e) => {
              const v = e.target.value
              setStatusFilter(v === -1 ? undefined : v)
            }}
            options={[
              { value: -1, label: '全部' },
              { value: 1, label: '已发布' },
              { value: 0, label: '草稿' },
            ]}
          />
        </Space>

        <Table<PortfolioVO>
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (t) => `共 ${t} 个作品`,
            onChange: (p, s) => load(p, s),
          }}
        />
      </div>

      <Modal
        title={editing ? '编辑作品' : '新增作品'}
        open={open}
        onOk={onSubmit}
        onCancel={() => setOpen(false)}
        okText="保存"
        cancelText="取消"
        confirmLoading={submitting}
        width={640}
        forceRender
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label="作品标题"
            name="title"
            rules={[{ required: true, message: '请输入作品标题' }]}
          >
            <Input placeholder="如：thirdLine 个人博客系统" maxLength={200} />
          </Form.Item>

          <Form.Item label="封面图" name="coverImage">
            <UploadImage module="cover" width={220} height={130} />
          </Form.Item>

          <Form.Item label="摘要" name="summary" tooltip="列表卡片展示的一句话简介">
            <TextArea placeholder="一句话介绍这个作品…" rows={3} maxLength={500} showCount />
          </Form.Item>

          <Form.Item
            label="技术栈"
            name="techStack"
            tooltip="多个技术/工具用英文逗号分隔，如 React,Spring Boot,MySQL"
          >
            <Input placeholder="React, Spring Boot, MySQL" maxLength={255} />
          </Form.Item>

          <Space size="large" className="w-full" style={{ display: 'flex' }}>
            <Form.Item label="担任角色" name="role" className="flex-1" style={{ minWidth: 200 }}>
              <Input placeholder="如：前端负责人 / 独立开发" maxLength={100} />
            </Form.Item>
            <Form.Item label="项目周期" name="period" style={{ width: 220 }}>
              <Input placeholder="如：2025-01 ~ 2025-06" maxLength={50} />
            </Form.Item>
          </Space>

          <Form.Item label="在线演示地址" name="demoUrl">
            <Input placeholder="https://…" maxLength={500} />
          </Form.Item>
          <Form.Item label="源码仓库地址" name="repoUrl">
            <Input placeholder="https://github.com/…" maxLength={500} />
          </Form.Item>

          <Form.Item label="发布状态" name="status" initialValue={0}>
            <Radio.Group>
              <Radio.Button value={1}>发布</Radio.Button>
              <Radio.Button value={0}>草稿</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

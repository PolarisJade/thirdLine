import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Popconfirm, Select, Space, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Plus, PencilSimple, Trash, SpinnerGap } from '@phosphor-icons/react'
import { deleteArticle, updateArticle } from '@/api/article'
import { adminPageArticles } from '@/api/admin'
import type { ArticleVO } from '@/types'
import { formatDate, statusLabel } from '@/utils/format'

const STATUS_COLOR: Record<number, string> = {
  0: 'default',
  1: 'green',
  2: 'red',
}

/** 后台文章管理：游标分页以"加载更多"累积展示 */
export default function ArticleList() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<ArticleVO[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<number | undefined>(undefined)

  const load = useCallback(
    async (nextCursor: number | null, append: boolean) => {
      setLoading(true)
      try {
        const page = await adminPageArticles({
          keyword: keyword || undefined,
          status,
          cursor: nextCursor,
          size: 10,
        })
        setRecords((prev) => (append ? [...prev, ...page.records] : page.records))
        setCursor(page.nextCursor)
        setHasMore(page.hasMore)
      } finally {
        setLoading(false)
      }
    },
    [keyword, status],
  )

  useEffect(() => {
    load(null, false)
  }, [load])

  const onDelete = async (id: number) => {
    await deleteArticle(id)
    message.success('已删除')
    load(null, false)
  }

  const onToggleTop = async (record: ArticleVO) => {
    await updateArticle({
      id: record.id,
      title: record.title,
      content: record.content ?? undefined,
      summary: record.summary ?? undefined,
      coverImage: record.coverImage ?? undefined,
      categoryId: record.categoryId,
      isTop: record.isTop === 1 ? 0 : 1,
      isOriginal: record.isOriginal,
      status: record.status,
      tagIds: record.tags?.map((t) => t.id) ?? [],
    })
    message.success('已更新置顶状态')
    load(null, false)
  }

  const columns: ColumnsType<ArticleVO> = [
    {
      title: '标题',
      dataIndex: 'title',
      render: (title: string, record) => (
        <Space>
          {record.isTop === 1 && <Tag color="gold">置顶</Tag>}
          <a onClick={() => navigate(`/admin/article/${record.id}`)}>{title}</a>
        </Space>
      ),
    },
    { title: '分类', dataIndex: 'categoryName', width: 140, render: (v: string) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: number) => <Tag color={STATUS_COLOR[v]}>{statusLabel(v)}</Tag>,
    },
    {
      title: '发布时间',
      dataIndex: 'publishedTime',
      width: 180,
      render: (v: string, record) => formatDate(v || record.createdTime, 'YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 240,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<PencilSimple size={16} />}
            onClick={() => navigate(`/admin/article/${record.id}`)}
          >
            编辑
          </Button>
          <Button type="text" size="small" onClick={() => onToggleTop(record)}>
            {record.isTop === 1 ? '取消置顶' : '置顶'}
          </Button>
          <Popconfirm title="确认删除该文章？" onConfirm={() => onDelete(record.id)} okText="删除" cancelText="取消">
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
        <h2 className="font-serif text-2xl font-semibold text-ink">文章管理</h2>
        <Button type="primary" icon={<Plus size={16} weight="bold" />} onClick={() => navigate('/admin/article/new')}>
          写文章
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
          <Select
            placeholder="全部状态"
            allowClear
            style={{ width: 140 }}
            value={status}
            onChange={(v) => setStatus(v)}
            options={[
              { value: 1, label: '已发布' },
              { value: 0, label: '草稿' },
            ]}
          />
        </Space>

        <Table<ArticleVO>
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={loading}
          pagination={false}
          size="middle"
        />

        <div className="mt-4 flex justify-center">
          {hasMore ? (
            <Button onClick={() => load(cursor, true)} loading={loading}>
              加载更多
            </Button>
          ) : (
            !loading &&
            records.length > 0 && (
              <span className="flex items-center gap-2 font-mono text-xs text-muted">
                <SpinnerGap size={12} /> 已加载全部
              </span>
            )
          )}
        </div>
      </div>
    </div>
  )
}

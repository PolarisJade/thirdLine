import { useEffect, useRef, useState } from 'react'
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Space,
  Table,
  Tag,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CaretRight, Pause, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { deleteMusic, pageMusics, saveMusic, updateMusic } from '@/api/music'
import UploadAudio from '@/components/UploadAudio'
import UploadImage from '@/components/UploadImage'
import { formatDate } from '@/utils/format'
import type { MusicDTO, MusicVO } from '@/types'

const STATUS_COLOR: Record<number, string> = {
  0: 'red',
  1: 'green',
}

/** 音乐管理：分页列表 + 新增 / 编辑 / 删除 / 上下架切换 / 在线试听 */
export default function MusicManage() {
  const [data, setData] = useState<MusicVO[]>([])
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MusicVO | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<MusicDTO>()

  // 在线试听：单例 audio 元素，同一时间只播一首（随页面卸载停止）
  const previewRef = useRef<HTMLAudioElement | null>(null)
  const [previewId, setPreviewId] = useState<number | null>(null)

  const stopPreview = () => {
    previewRef.current?.pause()
    setPreviewId(null)
  }

  useEffect(() => {
    return () => {
      previewRef.current?.pause()
      previewRef.current = null
    }
  }, [])

  const load = (page = current, size = pageSize) => {
    setLoading(true)
    pageMusics({ page, size, keyword: keyword || undefined, status: statusFilter })
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

  const openModal = (record?: MusicVO) => {
    stopPreview()
    setEditing(record || null)
    // 先重置再回填，避免上一次编辑的残留值；forceRender 保证 Form 已挂载，setFieldsValue 才能生效
    form.resetFields()
    form.setFieldsValue(
      record
        ? {
            id: record.id,
            title: record.title,
            artist: record.artist || '',
            coverImage: record.coverImage || '',
            audioUrl: record.audioUrl,
            sort: record.sort,
            status: record.status,
          }
        : { status: 1 },
    )
    setOpen(true)
  }

  const onSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      if (editing) {
        await updateMusic({ ...values, id: editing.id })
        message.success('已更新')
      } else {
        await saveMusic(values)
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
      await deleteMusic(id)
      message.success('已删除')
      const nextPage = data.length === 1 && current > 1 ? current - 1 : current
      load(nextPage, pageSize)
    } catch {
      // 拦截器已提示
    }
  }

  const onToggleStatus = async (record: MusicVO) => {
    const next = record.status === 1 ? 0 : 1
    try {
      await updateMusic({ id: record.id, status: next })
      message.success(next === 1 ? '已上架' : '已下架')
      load(current, pageSize)
    } catch {
      // 拦截器已提示
    }
  }

  /** 试听 / 停止试听（列表内单曲互斥） */
  const togglePreview = (record: MusicVO) => {
    if (previewId === record.id) {
      stopPreview()
      return
    }
    if (!previewRef.current) {
      previewRef.current = new Audio()
      previewRef.current.addEventListener('ended', () => setPreviewId(null))
    }
    const audio = previewRef.current
    audio.src = record.audioUrl
    audio.play().catch(() => {
      setPreviewId(null)
      message.error('试听失败，请检查音频地址是否可访问')
    })
    setPreviewId(record.id)
  }

  const columns: ColumnsType<MusicVO> = [
    {
      title: '封面',
      dataIndex: 'coverImage',
      width: 80,
      render: (url: string | null, record) =>
        url ? (
          <img
            src={url}
            alt={record.title}
            className="h-12 w-12 rounded object-cover"
            style={{ border: '1px solid #eaeaea' }}
          />
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    { title: '歌曲名', dataIndex: 'title' },
    { title: '歌手', dataIndex: 'artist', width: 140, render: (v: string | null) => v || '—' },
    { title: '排序', dataIndex: 'sort', width: 70 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: number) => <Tag color={STATUS_COLOR[v]}>{v === 1 ? '已上架' : '已下架'}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 120,
      render: (v: string | null) => formatDate(v) || '—',
    },
    {
      title: '操作',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={previewId === record.id ? <Pause size={16} /> : <CaretRight size={16} />}
            onClick={() => togglePreview(record)}
          >
            {previewId === record.id ? '停止' : '试听'}
          </Button>
          <Button
            type="text"
            size="small"
            icon={<PencilSimple size={16} />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Button type="text" size="small" onClick={() => onToggleStatus(record)}>
            {record.status === 1 ? '下架' : '上架'}
          </Button>
          <Popconfirm
            title="确认删除该音乐？"
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
        <h2 className="font-serif text-2xl font-semibold text-ink">音乐管理</h2>
        <Button type="primary" icon={<Plus size={16} weight="bold" />} onClick={() => openModal()}>
          新增音乐
        </Button>
      </div>

      <div className="mui-card !rounded-lg bg-canvas p-4">
        <Space wrap className="mb-4">
          <Input.Search
            placeholder="搜索歌曲名 / 歌手"
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
              { value: 1, label: '已上架' },
              { value: 0, label: '已下架' },
            ]}
          />
        </Space>

        <Table<MusicVO>
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
            showTotal: (t) => `共 ${t} 首`,
            onChange: (p, s) => load(p, s),
          }}
        />
      </div>

      <Modal
        title={editing ? '编辑音乐' : '新增音乐'}
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
            label="歌曲名"
            name="title"
            rules={[{ required: true, message: '请输入歌曲名' }]}
          >
            <Input placeholder="如：晴天" maxLength={200} />
          </Form.Item>

          <Form.Item label="歌手" name="artist">
            <Input placeholder="如：周杰伦" maxLength={100} />
          </Form.Item>

          <Form.Item label="封面图" name="coverImage">
            <UploadImage module="music" width={140} height={140} />
          </Form.Item>

          <Form.Item
            label="音频文件"
            name="audioUrl"
            tooltip="支持上传本地音频到 OSS，或直接粘贴可播放的音频外链地址（如网易云 / 酷狗客户端下载后上传）"
            rules={[{ required: true, message: '请上传音频或填写音频地址' }]}
          >
            <UploadAudio module="music" />
          </Form.Item>

          <Space size="large" className="w-full" style={{ display: 'flex' }}>
            <Form.Item label="排序" name="sort" tooltip="数字越小越靠前，留空自动追加到末尾">
              <InputNumber min={0} max={9999} placeholder="自动" style={{ width: 140 }} />
            </Form.Item>
            <Form.Item label="上架状态" name="status" initialValue={1}>
              <Radio.Group>
                <Radio.Button value={1}>上架</Radio.Button>
                <Radio.Button value={0}>下架</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}

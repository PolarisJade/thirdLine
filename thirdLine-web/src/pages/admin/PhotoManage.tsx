import { useEffect, useState } from 'react'
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Upload,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Plus, PencilSimple, Trash, SpinnerGap, Image as ImageIcon } from '@phosphor-icons/react'
import { deletePhoto, pagePhotos, savePhoto, updatePhoto } from '@/api/photo'
import { uploadImage } from '@/api/file'
import { formatDate, formatFileSize } from '@/utils/format'
import type { PhotoDTO, PhotoVO } from '@/types'

const { TextArea } = Input

/** 读取图片文件的像素尺寸 */
function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(objectUrl)
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
      URL.revokeObjectURL(objectUrl)
    }
    img.src = objectUrl
  })
}

/** 相册管理：分页列表 + 上传新增 / 编辑 / 删除 / 显隐切换 */
export default function PhotoManage() {
  const [data, setData] = useState<PhotoVO[]>([])
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [total, setTotal] = useState(0)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PhotoVO | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [form] = Form.useForm<PhotoDTO>()

  const load = (page = current, size = pageSize) => {
    setLoading(true)
    pagePhotos({ page, size })
      .then((res) => {
        setData(res?.records || [])
        setTotal(res?.total || 0)
        setCurrent(res?.current || page)
        setPageSize(res?.size || size)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(1, 12)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openModal = (record?: PhotoVO) => {
    setEditing(record || null)
    setPreviewUrl(record?.url || '')
    // 先重置再回填，避免上一次编辑的残留值；forceRender 保证 Form 已挂载，setFieldsValue 才能生效
    form.resetFields()
    form.setFieldsValue(
      record
        ? {
            id: record.id,
            title: record.title || '',
            description: record.description || '',
            url: record.url,
            width: record.width ?? undefined,
            height: record.height ?? undefined,
            fileSize: record.fileSize ?? undefined,
            sort: record.sort,
            status: record.status,
          }
        : { title: '', description: '', url: '', status: 1 },
    )
    setOpen(true)
  }

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('只能上传图片文件')
      return Upload.LIST_IGNORE
    }
    return true
  }

  const customRequest = async (options: { file: unknown }) => {
    const file = options.file as File
    setUploading(true)
    try {
      const [url, size] = await Promise.all([uploadImage(file, 'photo'), readImageSize(file)])
      setPreviewUrl(url)
      form.setFieldsValue({
        url,
        width: size.width || undefined,
        height: size.height || undefined,
        fileSize: file.size || undefined,
      })
      message.success('上传成功')
    } catch {
      // 错误提示已由响应拦截器统一处理
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async () => {
    const values = await form.validateFields()
    if (editing) {
      await updatePhoto({ ...values, id: editing.id })
      message.success('已更新')
    } else {
      await savePhoto(values)
      message.success('已新增')
    }
    setOpen(false)
    load(editing ? current : 1, pageSize)
    if (!editing) setCurrent(1)
  }

  const onDelete = async (id: number) => {
    try {
      await deletePhoto(id)
      message.success('已删除')
      // 删除后若当前页已空且非首页，回退一页
      const nextPage = data.length === 1 && current > 1 ? current - 1 : current
      load(nextPage, pageSize)
    } catch {
      // 拦截器已提示
    }
  }

  const onToggleStatus = async (record: PhotoVO, checked: boolean) => {
    try {
      await updatePhoto({ id: record.id, status: checked ? 1 : 0 })
      message.success(checked ? '已显示' : '已隐藏')
      load(current, pageSize)
    } catch {
      // 拦截器已提示
    }
  }

  const columns: ColumnsType<PhotoVO> = [
    {
      title: '图片',
      dataIndex: 'url',
      width: 84,
      render: (url: string, record) => (
        <img
          src={url}
          alt={record.title || '照片'}
          className="h-14 w-14 rounded object-cover"
          style={{ border: '1px solid #eaeaea' }}
        />
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      render: (t: string | null) => t || <span className="text-muted">未命名</span>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      render: (d: string | null) => d || <span className="text-muted">—</span>,
    },
    {
      title: '尺寸',
      width: 120,
      render: (_, r) => (r.width && r.height ? `${r.width} × ${r.height}` : '—'),
    },
    {
      title: '大小',
      dataIndex: 'fileSize',
      width: 100,
      render: (v: number | null) => formatFileSize(v) || '—',
    },
    { title: '排序', dataIndex: 'sort', width: 80 },
    {
      title: '显示',
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
      width: 130,
      render: (v: string) => formatDate(v),
    },
    {
      title: '操作',
      width: 160,
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
          <Popconfirm
            title="确认删除该照片？"
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
        <h2 className="font-serif text-2xl font-semibold text-ink">相册管理</h2>
        <Button type="primary" icon={<Plus size={16} weight="bold" />} onClick={() => openModal()}>
          上传照片
        </Button>
      </div>

      <div className="mui-card !rounded-lg bg-canvas p-4">
        <Table<PhotoVO>
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 960 }}
          pagination={{
            current,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [12, 24, 48],
            showTotal: (t) => `共 ${t} 张`,
            onChange: (p, s) => load(p, s),
          }}
        />
      </div>

      <Modal
        title={editing ? '编辑照片' : '上传照片'}
        open={open}
        onOk={onSubmit}
        onCancel={() => setOpen(false)}
        okText="保存"
        cancelText="取消"
        width={560}
        forceRender
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item label="照片图片" required>
            <div className="flex items-start gap-4">
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={beforeUpload}
                customRequest={customRequest as never}
              >
                <div
                  className="flex cursor-pointer items-center justify-center overflow-hidden border border-dashed border-line bg-surface transition hover:border-charcoal"
                  style={{ width: 120, height: 120, borderRadius: 8 }}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="preview" className="h-full w-full object-cover" />
                  ) : uploading ? (
                    <SpinnerGap size={20} className="animate-spin text-muted" />
                  ) : (
                    <ImageIcon size={20} className="text-muted" />
                  )}
                </div>
              </Upload>
              <div className="text-xs text-muted">
                点击左侧上传 / 更换图片。
                <br />
                上传后会自动记录图片的宽高与文件大小。
              </div>
            </div>
          </Form.Item>

          {/* 图片 URL 与元信息（由上传自动填充，URL 必填校验） */}
          <Form.Item name="url" rules={[{ required: true, message: '请上传照片图片' }]}>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="width" hidden>
            <InputNumber />
          </Form.Item>
          <Form.Item name="height" hidden>
            <InputNumber />
          </Form.Item>
          <Form.Item name="fileSize" hidden>
            <InputNumber />
          </Form.Item>

          <Form.Item label="标题" name="title">
            <Input placeholder="如：海边日落" maxLength={200} />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <TextArea placeholder="这张照片背后的故事…" rows={3} maxLength={500} showCount />
          </Form.Item>
          <Space size="large">
            <Form.Item
              label="排序权重"
              name="sort"
              tooltip="数值越小越靠前；新增留空则自动排到末尾"
            >
              <InputNumber min={0} placeholder="自动" style={{ width: 140 }} />
            </Form.Item>
            <Form.Item label="是否显示" name="status" valuePropName="checked" getValueFromEvent={(c) => (c ? 1 : 0)} getValueProps={(v) => ({ checked: v === 1 })}>
              <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}

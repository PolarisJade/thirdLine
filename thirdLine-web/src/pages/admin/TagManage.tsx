import { useEffect, useState } from 'react'
import { Button, Form, Input, Modal, Popconfirm, Space, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Plus, PencilSimple, Trash } from '@phosphor-icons/react'
import { deleteTag, saveTag, updateTag } from '@/api/tag'
import { adminListTags } from '@/api/admin'
import type { TagDTO, TagVO } from '@/types'
import Pill from '@/components/Pill'

/** 标签管理：增删改 */
export default function TagManage() {
  const [data, setData] = useState<TagVO[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TagVO | null>(null)
  const [form] = Form.useForm<TagDTO>()

  const load = () => {
    setLoading(true)
    adminListTags()
      .then((d) => setData(d || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openModal = (record?: TagVO) => {
    setEditing(record || null)
    form.setFieldsValue(record ? { id: record.id, name: record.name } : { name: '' })
    setOpen(true)
  }

  const onSubmit = async () => {
    const values = await form.validateFields()
    if (editing) {
      await updateTag(values)
      message.success('已更新')
    } else {
      await saveTag(values)
      message.success('已新增')
    }
    setOpen(false)
    load()
  }

  const onDelete = async (id: number) => {
    try {
      await deleteTag(id)
      message.success('已删除')
      load()
    } catch {
      // 已关联文章时后端拒绝，拦截器已提示
    }
  }

  const columns: ColumnsType<TagVO> = [
    {
      title: '标签',
      dataIndex: 'name',
      render: (name: string, record) => <Pill label={name} seed={record.id} />,
    },
    {
      title: '操作',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<PencilSimple size={16} />} onClick={() => openModal(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该标签？" onConfirm={() => onDelete(record.id)} okText="删除" cancelText="取消">
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
        <h2 className="font-serif text-2xl font-semibold text-ink">标签管理</h2>
        <Button type="primary" icon={<Plus size={16} weight="bold" />} onClick={() => openModal()}>
          新增标签
        </Button>
      </div>

      <div className="mui-card !rounded-lg bg-canvas p-4">
        <Table<TagVO> rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={false} />
      </div>

      <Modal
        title={editing ? '编辑标签' : '新增标签'}
        open={open}
        onOk={onSubmit}
        onCancel={() => setOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false} preserve={false}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="标签名称" name="name" rules={[{ required: true, message: '请输入标签名称' }]}>
            <Input placeholder="如：React" maxLength={20} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

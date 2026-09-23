import { useEffect, useState } from 'react'
import { Button, Form, Input, InputNumber, Modal, Popconfirm, Space, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Plus, PencilSimple, Trash } from '@phosphor-icons/react'
import {
  deleteCategory,
  saveCategory,
  updateCategory,
} from '@/api/category'
import { adminListCategories } from '@/api/admin'
import type { CategoryDTO, CategoryVO } from '@/types'

/** 分类管理：增删改 */
export default function CategoryManage() {
  const [data, setData] = useState<CategoryVO[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryVO | null>(null)
  const [form] = Form.useForm<CategoryDTO>()

  const load = () => {
    setLoading(true)
    adminListCategories()
      .then((d) => setData(d || []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openModal = (record?: CategoryVO) => {
    setEditing(record || null)
    form.setFieldsValue(
      record ? { id: record.id, name: record.name, sort: record.sort } : { name: '', sort: 0 },
    )
    setOpen(true)
  }

  const onSubmit = async () => {
    const values = await form.validateFields()
    if (editing) {
      await updateCategory(values)
      message.success('已更新')
    } else {
      await saveCategory(values)
      message.success('已新增')
    }
    setOpen(false)
    load()
  }

  const onDelete = async (id: number) => {
    try {
      await deleteCategory(id)
      message.success('已删除')
      load()
    } catch {
      // 有关联文章时后端拒绝，拦截器已提示
    }
  }

  const columns: ColumnsType<CategoryVO> = [
    { title: '分类名称', dataIndex: 'name' },
    { title: '排序权重', dataIndex: 'sort', width: 140 },
    {
      title: '操作',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<PencilSimple size={16} />} onClick={() => openModal(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该分类？" onConfirm={() => onDelete(record.id)} okText="删除" cancelText="取消">
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
        <h2 className="font-serif text-2xl font-semibold text-ink">分类管理</h2>
        <Button type="primary" icon={<Plus size={16} weight="bold" />} onClick={() => openModal()}>
          新增分类
        </Button>
      </div>

      <div className="mui-card !rounded-lg bg-canvas p-4">
        <Table<CategoryVO> rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={false} />
      </div>

      <Modal
        title={editing ? '编辑分类' : '新增分类'}
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
          <Form.Item label="分类名称" name="name" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input placeholder="如：技术笔记" maxLength={30} />
          </Form.Item>
          <Form.Item label="排序权重" name="sort" tooltip="数值越小越靠前">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

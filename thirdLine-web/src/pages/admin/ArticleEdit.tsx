import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Form, Input, Radio, Select, Space, Switch, message } from 'antd'
import { ArrowLeft } from '@phosphor-icons/react'
import { saveArticle, updateArticle } from '@/api/article'
import { adminGetArticleDetail, adminListCategories, adminListTags } from '@/api/admin'
import type { CategoryVO, TagVO } from '@/types'
import UploadImage from '@/components/UploadImage'
import RichTextEditor from '@/components/RichTextEditor'

interface FormValues {
  title: string
  content?: string
  summary?: string
  coverImage?: string
  categoryId?: number
  tagIds?: number[]
  isTop: boolean
  isOriginal: boolean
  status: number
}

/** 写文章 / 编辑文章（二合一） */
export default function ArticleEdit() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id && id !== 'new'
  const navigate = useNavigate()
  const [form] = Form.useForm<FormValues>()
  const [categories, setCategories] = useState<CategoryVO[]>([])
  const [tags, setTags] = useState<TagVO[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    adminListCategories().then((d) => setCategories(d || [])).catch(() => undefined)
    adminListTags().then((d) => setTags(d || [])).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!isEdit) {
      form.setFieldsValue({ isTop: false, isOriginal: true, status: 1 })
      return
    }
    adminGetArticleDetail(Number(id))
      .then((a) => {
        form.setFieldsValue({
          title: a.title,
          content: a.content ?? '',
          summary: a.summary ?? '',
          coverImage: a.coverImage ?? '',
          categoryId: a.categoryId,
          tagIds: a.tags?.map((t) => t.id) ?? [],
          isTop: a.isTop === 1,
          isOriginal: a.isOriginal === 1,
          status: a.status,
        })
      })
      .catch(() => message.error('文章加载失败'))
  }, [id, isEdit, form])

  const onFinish = async (values: FormValues) => {
    if (!values.categoryId) {
      message.error('请选择所属分类')
      return
    }
    setSubmitting(true)
    const payload = {
      title: values.title,
      content: values.content,
      summary: values.summary,
      coverImage: values.coverImage,
      categoryId: values.categoryId,
      tagIds: values.tagIds ?? [],
      isTop: values.isTop ? 1 : 0,
      isOriginal: values.isOriginal ? 1 : 0,
      status: values.status,
    }
    try {
      if (isEdit) {
        await updateArticle({ id: Number(id), ...payload })
        message.success('已保存')
      } else {
        await saveArticle(payload)
        message.success('已创建')
      }
      navigate('/admin/article')
    } catch {
      // 拦截器已提示
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button type="text" icon={<ArrowLeft size={18} />} onClick={() => navigate('/admin/article')} />
        <h2 className="font-serif text-2xl font-semibold text-ink">
          {isEdit ? '编辑文章' : '写文章'}
        </h2>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* 左侧主编辑区 */}
          <div className="mui-card !rounded-lg bg-canvas p-6 lg:col-span-2">
            <Form.Item
              label="标题"
              name="title"
              rules={[{ required: true, message: '请输入标题' }]}
            >
              <Input size="large" placeholder="文章标题" maxLength={120} showCount />
            </Form.Item>

            <Form.Item label="正文" name="content">
              <RichTextEditor height={460} />
            </Form.Item>

            <Form.Item label="摘要" name="summary">
              <Input.TextArea rows={3} placeholder="一句话简介，用于列表展示" maxLength={200} showCount />
            </Form.Item>
          </div>

          {/* 右侧设置区 */}
          <div className="flex flex-col gap-6">
            <div className="mui-card !rounded-lg bg-canvas p-6">
              <Form.Item label="封面图" name="coverImage">
                <UploadImage module="cover" width={220} height={130} />
              </Form.Item>

              <Form.Item
                label="分类"
                name="categoryId"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select
                  placeholder="选择分类"
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                />
              </Form.Item>

              <Form.Item label="标签" name="tagIds">
                <Select
                  mode="multiple"
                  placeholder="选择标签"
                  options={tags.map((t) => ({ value: t.id, label: t.name }))}
                />
              </Form.Item>

              <Form.Item label="发布状态" name="status" initialValue={1}>
                <Radio.Group>
                  <Radio.Button value={1}>发布</Radio.Button>
                  <Radio.Button value={0}>草稿</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Space size="large">
                <Form.Item label="置顶" name="isTop" valuePropName="checked" className="!mb-0">
                  <Switch />
                </Form.Item>
                <Form.Item label="原创" name="isOriginal" valuePropName="checked" className="!mb-0">
                  <Switch />
                </Form.Item>
              </Space>
            </div>

            <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
              {isEdit ? '保存修改' : '创建文章'}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  )
}
